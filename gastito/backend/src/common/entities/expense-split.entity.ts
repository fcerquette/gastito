import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Expense } from './expense.entity';
import { GroupMember } from './group-member.entity';

/**
 * Cada ExpenseSplit representa cuánto le toca pagar a un miembro de un gasto.
 * Apuntamos a GroupMember (no a User) para soportar miembros invitados sin cuenta.
 */
@Entity('expense_splits')
export class ExpenseSplit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  expenseId: string;

  @ManyToOne(() => Expense, (e) => e.splits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'expenseId' })
  expense: Expense;

  @Index()
  @Column()
  groupMemberId: string;

  @ManyToOne(() => GroupMember, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupMemberId' })
  groupMember: GroupMember;

  @Column('decimal', { precision: 14, scale: 2 })
  amount: string;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;
}
