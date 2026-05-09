import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalancesController } from './balances.controller';
import { BalancesService } from './balances.service';
import { Expense } from '../common/entities/expense.entity';
import { ExpenseSplit } from '../common/entities/expense-split.entity';
import { Settlement } from '../common/entities/settlement.entity';
import { GroupMember } from '../common/entities/group-member.entity';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, ExpenseSplit, Settlement, GroupMember]),
    GroupsModule,
  ],
  controllers: [BalancesController],
  providers: [BalancesService],
})
export class BalancesModule {}
