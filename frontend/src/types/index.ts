/**
 * Tipos compartidos espejando las entidades del backend.
 * Los `amount` vienen como string desde Postgres (decimal) — los parseamos en UI.
 */

export type Currency = 'ARS' | 'USD' | 'BRL' | 'EUR';
export type SplitMode = 'equal' | 'amounts' | 'percentages';
export type MemberRole = 'owner' | 'member';

export const CURRENCIES: Currency[] = ['ARS', 'USD', 'BRL', 'EUR'];

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  phone?: string | null;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string | null;
  user?: User | null;
  invitedEmail?: string | null;
  invitedName?: string | null;
  role: MemberRole;
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  defaultCurrency: Currency;
  createdById: string;
  createdBy?: User;
  createdAt: string;
  members?: GroupMember[];
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  groupMemberId: string;
  groupMember?: GroupMember;
  amount: string;
  isPaid: boolean;
  paidAt?: string | null;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: string;
  currency: Currency;
  paidByMemberId: string;
  paidByMember?: GroupMember;
  date: string;
  createdAt: string;
  splits: ExpenseSplit[];
}

export interface Settlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  fromMember?: GroupMember;
  toMemberId: string;
  toMember?: GroupMember;
  amount: string;
  currency: Currency;
  date: string;
  note?: string | null;
  createdAt: string;
}

/* Balances (response de GET /groups/:id/balances) */

export interface MemberBalance {
  groupMemberId: string;
  displayName: string;
  email: string | null;
  isRegistered: boolean;
  balance: number;
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

/* Payloads */

export interface CreateGroupPayload {
  name: string;
  description?: string;
  defaultCurrency?: Currency;
  members?: Array<{ email: string; name?: string }>;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  defaultCurrency?: Currency;
}

export interface AddMemberPayload {
  email: string;
  name?: string;
}

export interface UpdateMemberPayload {
  email?: string;
  name?: string;
}

export interface SplitInput {
  groupMemberId: string;
  /** Requerido si splitMode = 'amounts' o 'percentages'. Ignorado si 'equal'. */
  value?: number;
}

export interface CreateExpensePayload {
  description: string;
  amount: number;
  currency: Currency;
  /** id del GroupMember que pagó (cualquier miembro, registrado o invitado). */
  paidByMemberId: string;
  date: string;
  splitMode: SplitMode;
  splits: SplitInput[];
}

export interface CreateSettlementPayload {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  currency: Currency;
  date: string;
  note?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
}
