import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string },
  ): Promise<User> {
    const user = await this.repo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    if (data.name !== undefined) user.name = data.name;
    if (data.phone !== undefined) user.phone = data.phone;
    return this.repo.save(user);
  }
}
