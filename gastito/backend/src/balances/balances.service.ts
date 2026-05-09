import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense } from '../common/entities/expense.entity';
import { Settlement } from '../common/entities/settlement.entity';
import { GroupMember } from '../common/entities/group-member.entity';
import { Currency } from '../common/entities/group.entity';
import { GroupsService } from '../groups/groups.service';

export interface MemberBalance {
  groupMemberId: string;
  displayName: string;
  email: string | null;
  isRegistered: boolean;
  balance: number; // positivo = le deben; negativo = debe
}

export interface DebtTransaction {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
}

export interface CurrencyBalance {
  currency: Currency;
  members: MemberBalance[];
  simplifiedDebts: DebtTransaction[];
}

@Injectable()
export class BalancesService {
  constructor(
    @InjectRepository(Expense) private expensesRepo: Repository<Expense>,
    @InjectRepository(Settlement) private settlementsRepo: Repository<Settlement>,
    @InjectRepository(GroupMember) private membersRepo: Repository<GroupMember>,
    private groupsService: GroupsService,
  ) {}

  async getGroupBalances(
    groupId: string,
    userId: string,
  ): Promise<CurrencyBalance[]> {
    await this.groupsService.assertMembership(groupId, userId);

    const [members, expenses, settlements] = await Promise.all([
      this.membersRepo.find({
        where: { groupId },
        relations: ['user'],
      }),
      this.expensesRepo.find({
        where: { groupId },
        relations: ['splits', 'paidBy'],
      }),
      this.settlementsRepo.find({ where: { groupId } }),
    ]);

    // El payer es un User. Necesitamos su GroupMember correspondiente.
    const memberByUserId = new Map<string, GroupMember>();
    for (const m of members) {
      if (m.userId) memberByUserId.set(m.userId, m);
    }

    // Agrupar todo por moneda
    const byCurrency = new Map<Currency, {
      balances: Map<string, number>; // groupMemberId → balance
    }>();

    const ensureCurrency = (c: Currency) => {
      if (!byCurrency.has(c)) {
        const balances = new Map<string, number>();
        for (const m of members) balances.set(m.id, 0);
        byCurrency.set(c, { balances });
      }
      return byCurrency.get(c)!;
    };

    // Procesar gastos: el payer recibe +amount, cada split recibe -split.amount
    // Solo considera splits no pagados (los pagados se descuentan)
    for (const exp of expenses) {
      const payerMember = memberByUserId.get(exp.paidById);
      if (!payerMember) continue; // payer no es miembro? raro pero seguro
      const cur = ensureCurrency(exp.currency);

      for (const split of exp.splits) {
        if (split.isPaid) continue; // ya saldada, no afecta balance
        if (split.groupMemberId === payerMember.id) continue; // se debe a sí mismo
        const amt = parseFloat(split.amount);
        // El que pagó está adelantando esto
        cur.balances.set(payerMember.id, (cur.balances.get(payerMember.id) ?? 0) + amt);
        // El que tiene el split debe esto
        cur.balances.set(
          split.groupMemberId,
          (cur.balances.get(split.groupMemberId) ?? 0) - amt,
        );
      }
    }

    // Procesar settlements: from le pagó a to → from sube, to baja
    for (const s of settlements) {
      const cur = ensureCurrency(s.currency);
      const amt = parseFloat(s.amount);
      cur.balances.set(s.fromMemberId, (cur.balances.get(s.fromMemberId) ?? 0) + amt);
      cur.balances.set(s.toMemberId, (cur.balances.get(s.toMemberId) ?? 0) - amt);
    }

    // Construir output por moneda
    const result: CurrencyBalance[] = [];
    for (const [currency, data] of byCurrency.entries()) {
      const memberBalances: MemberBalance[] = members
        .map((m) => ({
          groupMemberId: m.id,
          displayName: this.getDisplayName(m),
          email: m.user?.email ?? m.invitedEmail ?? null,
          isRegistered: !!m.userId,
          balance: round2(data.balances.get(m.id) ?? 0),
        }))
        .filter((b) => b.balance !== 0);

      const simplifiedDebts = this.simplifyDebts(memberBalances);

      result.push({ currency, members: memberBalances, simplifiedDebts });
    }

    return result;
  }

  private getDisplayName(m: GroupMember): string {
    if (m.user?.name) return m.user.name;
    if (m.invitedName) return m.invitedName;
    if (m.user?.email) return m.user.email;
    if (m.invitedEmail) return m.invitedEmail;
    return 'Sin nombre';
  }

  /**
   * Algoritmo de simplificación de deudas.
   * Idea: separar acreedores (balance > 0) y deudores (balance < 0).
   * Emparejarlos greedy: el deudor con mayor deuda paga al acreedor con mayor crédito,
   * hasta que uno se salda. Repetir hasta que todos queden en 0.
   * Resultado: máximo N-1 transacciones para N personas con saldo distinto de 0.
   */
  private simplifyDebts(balances: MemberBalance[]): DebtTransaction[] {
    const creditors = balances
      .filter((b) => b.balance > 0)
      .map((b) => ({ ...b }))
      .sort((a, b) => b.balance - a.balance);
    const debtors = balances
      .filter((b) => b.balance < 0)
      .map((b) => ({ ...b, balance: -b.balance }))
      .sort((a, b) => b.balance - a.balance);

    const transactions: DebtTransaction[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = round2(Math.min(debtor.balance, creditor.balance));

      if (amount > 0) {
        transactions.push({
          fromMemberId: debtor.groupMemberId,
          fromName: debtor.displayName,
          toMemberId: creditor.groupMemberId,
          toName: creditor.displayName,
          amount,
        });
      }

      debtor.balance = round2(debtor.balance - amount);
      creditor.balance = round2(creditor.balance - amount);

      if (debtor.balance < 0.01) i++;
      if (creditor.balance < 0.01) j++;
    }

    return transactions;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
