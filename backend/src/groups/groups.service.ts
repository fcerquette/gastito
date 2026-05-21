import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Group } from '../common/entities/group.entity';
import { GroupMember } from '../common/entities/group-member.entity';
import { User } from '../common/entities/user.entity';
import {
  AddMemberDto,
  CreateGroupDto,
  UpdateGroupDto,
  UpdateMemberDto,
} from './groups.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private groupsRepo: Repository<Group>,
    @InjectRepository(GroupMember) private membersRepo: Repository<GroupMember>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  /** Lista todos los grupos donde el usuario es miembro */
  async listForUser(userId: string): Promise<Group[]> {
    const memberships = await this.membersRepo.find({
      where: { userId },
      relations: ['group', 'group.members', 'group.members.user'],
    });
    return memberships.map((m) => m.group);
  }

  async findOne(groupId: string, userId: string): Promise<Group> {
    await this.assertMembership(groupId, userId);
    const group = await this.groupsRepo.findOne({
      where: { id: groupId },
      relations: ['members', 'members.user', 'createdBy'],
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async create(creatorId: string, dto: CreateGroupDto): Promise<Group> {
    return this.dataSource.transaction(async (manager) => {
      const group = manager.create(Group, {
        name: dto.name,
        description: dto.description,
        defaultCurrency: dto.defaultCurrency ?? 'ARS',
        createdById: creatorId,
      });
      const saved = await manager.save(group);

      // El creador siempre es miembro y owner
      const ownerMember = manager.create(GroupMember, {
        groupId: saved.id,
        userId: creatorId,
        role: 'owner' as const,
      });
      await manager.save(ownerMember);

      // Miembros invitados (si los hay)
      if (dto.members?.length) {
        for (const m of dto.members) {
          const email = m.email.toLowerCase();
          if (email === (await manager.findOne(User, { where: { id: creatorId } }))?.email)
            continue;

          const existingUser = await manager.findOne(User, { where: { email } });
          const member = manager.create(GroupMember, {
            groupId: saved.id,
            userId: existingUser?.id ?? null,
            invitedEmail: existingUser ? null : email,
            invitedName: existingUser ? null : m.name ?? null,
            role: 'member' as const,
          });
          await manager.save(member);
        }
      }

      const found = await manager.findOne(Group, {
        where: { id: saved.id },
        relations: ['members', 'members.user', 'createdBy'],
      });
      if (!found) throw new NotFoundException('Group not found after creation');
      return found;
    });
  }

  async update(
    groupId: string,
    userId: string,
    dto: UpdateGroupDto,
  ): Promise<Group> {
    const group = await this.findOne(groupId, userId);
    if (group.createdById !== userId)
      throw new ForbiddenException('Only the owner can update the group');
    Object.assign(group, dto);
    return this.groupsRepo.save(group);
  }

  async remove(groupId: string, userId: string): Promise<void> {
    const group = await this.findOne(groupId, userId);
    if (group.createdById !== userId)
      throw new ForbiddenException('Only the owner can delete the group');
    await this.groupsRepo.remove(group);
  }

  async addMember(
    groupId: string,
    userId: string,
    dto: AddMemberDto,
  ): Promise<GroupMember> {
    await this.assertMembership(groupId, userId);
    const email = dto.email.toLowerCase();
    const existingUser = await this.usersRepo.findOne({ where: { email } });

    // Evitar duplicados
    const already = await this.membersRepo.findOne({
      where: existingUser
        ? { groupId, userId: existingUser.id }
        : { groupId, invitedEmail: email },
    });
    if (already) return already;

    const member = this.membersRepo.create({
      groupId,
      userId: existingUser?.id ?? null,
      invitedEmail: existingUser ? null : email,
      invitedName: existingUser ? null : dto.name ?? null,
      role: 'member' as const,
    });
    return this.membersRepo.save(member);
  }

  /**
   * Edita el nombre y/o email de un miembro invitado (sin cuenta).
   * Solo el owner puede editar. Si el nuevo email coincide con un user
   * registrado, se vincula automáticamente como miembro real.
   */
  async updateMember(
    groupId: string,
    userId: string,
    memberId: string,
    dto: UpdateMemberDto,
  ): Promise<GroupMember> {
    await this.assertMembership(groupId, userId);
    const group = await this.groupsRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.createdById !== userId) {
      throw new ForbiddenException('Solo el creador puede editar miembros');
    }

    const member = await this.membersRepo.findOne({
      where: { id: memberId, groupId },
    });
    if (!member) throw new NotFoundException('Member not found');

    if (member.userId) {
      throw new ForbiddenException(
        'No se puede editar la info de un usuario registrado. Los datos vienen de su cuenta de Google.',
      );
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      if (!email) {
        throw new BadRequestException('Email no puede estar vacío');
      }
      // Si el email ya está en otro miembro del mismo grupo (que no sea este), error
      const conflict = await this.membersRepo
        .createQueryBuilder('m')
        .leftJoinAndSelect('m.user', 'u')
        .where('m.groupId = :groupId', { groupId })
        .andWhere('m.id != :memberId', { memberId })
        .andWhere('(m.invitedEmail = :email OR u.email = :email)', { email })
        .getOne();
      if (conflict) {
        throw new ConflictException('Ese email ya está en el grupo');
      }

      const existingUser = await this.usersRepo.findOne({ where: { email } });
      if (existingUser) {
        // Se registró desde la última vez: vincular como user real
        member.userId = existingUser.id;
        member.invitedEmail = null;
        // mantenemos invitedName solo como fallback hasta que el user complete
      } else {
        member.invitedEmail = email;
      }
    }

    if (dto.name !== undefined) {
      member.invitedName = dto.name.trim() || null;
    }

    await this.membersRepo.save(member);

    // Devolver el miembro con la relación user (puede que se acabe de vincular)
    return this.membersRepo.findOne({
      where: { id: memberId },
      relations: ['user'],
    }) as Promise<GroupMember>;
  }

  async removeMember(
    groupId: string,
    userId: string,
    memberId: string,
  ): Promise<void> {
    const group = await this.findOne(groupId, userId);
    const member = group.members.find((m) => m.id === memberId);
    if (!member) throw new NotFoundException('Member not found');
    if (member.userId === group.createdById)
      throw new ForbiddenException('Cannot remove the group owner');
    if (group.createdById !== userId && member.userId !== userId)
      throw new ForbiddenException('Only the owner can remove other members');
    await this.membersRepo.remove(member);
  }

  /** Throws if the user is not a member of the group */
  async assertMembership(groupId: string, userId: string): Promise<GroupMember> {
    const member = await this.membersRepo.findOne({
      where: { groupId, userId },
    });
    if (!member) throw new ForbiddenException('You are not a member of this group');
    return member;
  }
}
