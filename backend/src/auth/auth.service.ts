import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from '../common/entities/user.entity';
import { GroupMember } from '../common/entities/group-member.entity';

export interface GoogleProfile {
  email: string;
  googleId: string;
  name: string;
  avatarUrl: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(GroupMember) private membersRepo: Repository<GroupMember>,
    private jwtService: JwtService,
  ) {}

  /**
   * Encuentra o crea un user a partir del perfil de Google.
   * Si el email coincide con invitaciones pendientes (group_members con
   * userId null y invitedEmail = email), las vincula automáticamente.
   */
  async findOrCreateFromGoogle(profile: GoogleProfile): Promise<User> {
    let user = await this.usersRepo.findOne({ where: { email: profile.email } });

    if (!user) {
      user = this.usersRepo.create({
        email: profile.email,
        googleId: profile.googleId,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      });
      user = await this.usersRepo.save(user);
    } else if (!user.googleId) {
      // Si existía sin googleId (poco probable pero posible), lo vinculamos
      user.googleId = profile.googleId;
      user.avatarUrl = user.avatarUrl || profile.avatarUrl;
      user = await this.usersRepo.save(user);
    }

    // Vincular invitaciones pendientes
    await this.linkPendingInvitations(user);

    return user;
  }

  private async linkPendingInvitations(user: User): Promise<void> {
    const pending = await this.membersRepo.find({
      where: { userId: IsNull(), invitedEmail: user.email.toLowerCase() },
    });

    for (const member of pending) {
      member.userId = user.id;
      member.invitedEmail = null;
      await this.membersRepo.save(member);
    }
  }

  signToken(user: User): string {
    return this.jwtService.sign({ sub: user.id, email: user.email });
  }
}
