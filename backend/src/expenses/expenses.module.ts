import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { Expense } from '../common/entities/expense.entity';
import { ExpenseSplit } from '../common/entities/expense-split.entity';
import { GroupMember } from '../common/entities/group-member.entity';
import { GroupsModule } from '../groups/groups.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, ExpenseSplit, GroupMember]),
    GroupsModule,
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
