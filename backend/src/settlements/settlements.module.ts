import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';
import { Settlement } from '../common/entities/settlement.entity';
import { GroupMember } from '../common/entities/group-member.entity';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Settlement, GroupMember]),
    GroupsModule,
  ],
  controllers: [SettlementsController],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
