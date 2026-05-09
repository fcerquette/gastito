import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { GroupMember } from './group-member.entity';
import { Expense } from './expense.entity';
import { ExpenseSplit } from './expense-split.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column({ nullable: true })
  googleId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  phone: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => GroupMember, (gm) => gm.user)
  memberships: GroupMember[];

  @OneToMany(() => Expense, (e) => e.paidBy)
  expensesPaid: Expense[];

  @OneToMany(() => ExpenseSplit, (s) => s.user)
  splits: ExpenseSplit[];
}
