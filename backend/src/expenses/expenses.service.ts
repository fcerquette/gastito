import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Expense } from '../common/entities/expense.entity';
import { ExpenseSplit } from '../common/entities/expense-split.entity';
import { GroupMember } from '../common/entities/group-member.entity';
import { GroupsService } from '../groups/groups.service';
import { CreateExpenseDto } from './expenses.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense) private expensesRepo: Repository<Expense>,
    @InjectRepository(ExpenseSplit) private splitsRepo: Repository<ExpenseSplit>,
    @InjectRepository(GroupMember) private membersRepo: Repository<GroupMember>,
    private groupsService: GroupsService,
    private dataSource: DataSource,
  ) {}

  async listByGroup(groupId: string, userId: string): Promise<Expense[]> {
    await this.groupsService.assertMembership(groupId, userId);
    return this.expensesRepo.find({
      where: { groupId },
      order: { date: 'DESC', createdAt: 'DESC' },
      relations: [
        'splits',
        'splits.groupMember',
        'splits.groupMember.user',
        'paidByMember',
        'paidByMember.user',
      ],
    });
  }

  async create(
    groupId: string,
    userId: string,
    dto: CreateExpenseDto,
  ): Promise<Expense> {
    await this.groupsService.assertMembership(groupId, userId);

    // Verificar que paidByMemberId pertenezca al grupo
    const payerMember = await this.membersRepo.findOne({
      where: { id: dto.paidByMemberId, groupId },
    });
    if (!payerMember)
      throw new BadRequestException('Payer must be a member of the group');

    // Verificar que todos los splits sean miembros del grupo
    for (const s of dto.splits) {
      const member = await this.membersRepo.findOne({
        where: { id: s.groupMemberId, groupId },
      });
      if (!member)
        throw new BadRequestException(`Member ${s.groupMemberId} is not in the group`);
    }

    // Calcular montos según splitMode
    const splitAmounts = this.computeSplitAmounts(dto);

    return this.dataSource.transaction(async (manager) => {
      const expense = manager.create(Expense, {
        groupId,
        description: dto.description,
        amount: dto.amount.toFixed(2),
        currency: dto.currency,
        paidByMemberId: dto.paidByMemberId,
        date: dto.date,
      });
      const saved = await manager.save(expense);

      const splits = splitAmounts.map((s) =>
        manager.create(ExpenseSplit, {
          expenseId: saved.id,
          groupMemberId: s.groupMemberId,
          amount: s.amount.toFixed(2),
          isPaid: false,
        }),
      );
      await manager.save(splits);

      const found = await manager.findOne(Expense, {
        where: { id: saved.id },
        relations: [
          'splits',
          'splits.groupMember',
          'splits.groupMember.user',
          'paidByMember',
          'paidByMember.user',
        ],
      });
      if (!found) throw new NotFoundException('Expense not found after creation');
      return found;
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const expense = await this.expensesRepo.findOne({
      where: { id },
      relations: ['paidByMember', 'group'],
    });
    if (!expense) throw new NotFoundException();
    await this.groupsService.assertMembership(expense.groupId, userId);
    // Sólo puede borrar quien lo pagó (si está registrado) o el owner del grupo
    const isPayer = expense.paidByMember?.userId === userId;
    const isOwner = expense.group?.createdById === userId;
    if (!isPayer && !isOwner)
      throw new ForbiddenException('Only the payer or the group owner can delete the expense');
    await this.expensesRepo.remove(expense);
  }

  async setSplitPaid(splitId: string, userId: string, isPaid: boolean) {
    const split = await this.splitsRepo.findOne({
      where: { id: splitId },
      relations: ['expense'],
    });
    if (!split) throw new NotFoundException();
    await this.groupsService.assertMembership(split.expense.groupId, userId);
    split.isPaid = isPaid;
    split.paidAt = isPaid ? new Date() : null;
    return this.splitsRepo.save(split);
  }

  /**
   * Reparte el monto total entre los splits según el modo elegido.
   * Maneja redondeo: el último split absorbe el resto para que sume exacto.
   */
  private computeSplitAmounts(
    dto: CreateExpenseDto,
  ): { groupMemberId: string; amount: number }[] {
    const total = dto.amount;
    const n = dto.splits.length;

    if (dto.splitMode === 'equal') {
      const base = Math.floor((total * 100) / n) / 100;
      const result = dto.splits.map((s) => ({
        groupMemberId: s.groupMemberId,
        amount: base,
      }));
      const distributed = base * n;
      const remainder = Math.round((total - distributed) * 100) / 100;
      if (remainder !== 0) {
        result[result.length - 1].amount = round2(result[result.length - 1].amount + remainder);
      }
      return result;
    }

    if (dto.splitMode === 'amounts') {
      const sum = dto.splits.reduce((acc, s) => acc + (s.value ?? 0), 0);
      if (Math.abs(sum - total) > 0.01)
        throw new BadRequestException(
          `Split amounts (${sum.toFixed(2)}) must equal total (${total.toFixed(2)})`,
        );
      return dto.splits.map((s) => ({
        groupMemberId: s.groupMemberId,
        amount: round2(s.value ?? 0),
      }));
    }

    if (dto.splitMode === 'percentages') {
      const sum = dto.splits.reduce((acc, s) => acc + (s.value ?? 0), 0);
      if (Math.abs(sum - 100) > 0.01)
        throw new BadRequestException(`Percentages must sum to 100, got ${sum}`);
      const result = dto.splits.map((s) => ({
        groupMemberId: s.groupMemberId,
        amount: round2((total * (s.value ?? 0)) / 100),
      }));
      // Ajustar último para que sume exacto
      const distributed = result.reduce((acc, r) => acc + r.amount, 0);
      const remainder = round2(total - distributed);
      if (remainder !== 0) {
        result[result.length - 1].amount = round2(result[result.length - 1].amount + remainder);
      }
      return result;
    }

    throw new BadRequestException('Invalid split mode');
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
