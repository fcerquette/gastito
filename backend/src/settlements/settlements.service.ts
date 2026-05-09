import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settlement } from '../common/entities/settlement.entity';
import { GroupMember } from '../common/entities/group-member.entity';
import { GroupsService } from '../groups/groups.service';
import { CreateSettlementDto } from './settlements.dto';

@Injectable()
export class SettlementsService {
  constructor(
    @InjectRepository(Settlement) private repo: Repository<Settlement>,
    @InjectRepository(GroupMember) private membersRepo: Repository<GroupMember>,
    private groupsService: GroupsService,
  ) {}

  async listByGroup(groupId: string, userId: string): Promise<Settlement[]> {
    await this.groupsService.assertMembership(groupId, userId);
    return this.repo.find({
      where: { groupId },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(
    groupId: string,
    userId: string,
    dto: CreateSettlementDto,
  ): Promise<Settlement> {
    await this.groupsService.assertMembership(groupId, userId);

    if (dto.fromMemberId === dto.toMemberId)
      throw new BadRequestException('From and to members must differ');

    const [from, to] = await Promise.all([
      this.membersRepo.findOne({ where: { id: dto.fromMemberId, groupId } }),
      this.membersRepo.findOne({ where: { id: dto.toMemberId, groupId } }),
    ]);
    if (!from || !to) throw new BadRequestException('Members must belong to the group');

    const settlement = this.repo.create({
      groupId,
      fromMemberId: dto.fromMemberId,
      toMemberId: dto.toMemberId,
      amount: dto.amount.toFixed(2),
      currency: dto.currency,
      date: dto.date,
      note: dto.note,
    });
    return this.repo.save(settlement);
  }

  async remove(id: string, userId: string): Promise<void> {
    const settlement = await this.repo.findOne({ where: { id } });
    if (!settlement) throw new NotFoundException();
    await this.groupsService.assertMembership(settlement.groupId, userId);
    await this.repo.remove(settlement);
  }
}
