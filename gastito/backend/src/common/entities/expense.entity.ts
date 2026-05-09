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
import { User } from './user.entity';
import { Group, Currency } from './group.entity';
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

  // Quién puso la plata. Puede ser un user registrado o un GroupMember invitado.
  // Para simplificar el MVP, asumimos que solo users registrados pueden "pagar"
  // (los invitados solo aparecen como deudores hasta que se registren).
  @Index()
  @Column()
  paidById: string;

  @ManyToOne(() => User, (u) => u.expensesPaid, { eager: true })
  @JoinColumn({ name: 'paidById' })
  paidBy: User;

  @Column({ type: 'date' })
  date: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ExpenseSplit, (s) => s.expense, { cascade: true, eager: true })
  splits: ExpenseSplit[];
}
