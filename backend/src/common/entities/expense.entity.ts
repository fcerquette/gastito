import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Group, Currency } from './group.entity';
import { GroupMember } from './group-member.entity';
import { ExpenseSplit } from './expense-split.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  groupId: string;

  @ManyToOne(() => Group, (g) => g.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column()
  description: string;

  @Column('decimal', { precision: 14, scale: 2 })
  amount: string;

  @Column()
  currency: Currency;

  // Quién puso la plata. Apunta a GroupMember para soportar tanto
  // miembros registrados como invitados (por email) como pagadores.
  @Index()
  @Column()
  paidByMemberId: string;

  @ManyToOne(() => GroupMember, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'paidByMemberId' })
  paidByMember: GroupMember;

  @Column({ type: 'date' })
  date: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ExpenseSplit, (s) => s.expense, { cascade: true, eager: true })
  splits: ExpenseSplit[];
}
