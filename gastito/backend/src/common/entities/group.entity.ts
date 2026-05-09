import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { GroupMember } from './group-member.entity';
import { Expense } from './expense.entity';
import { Settlement } from './settlement.entity';

export type Currency = 'ARS' | 'USD' | 'BRL' | 'EUR';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'ARS' })
  defaultCurrency: Currency;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => GroupMember, (gm) => gm.group, { cascade: true })
  members: GroupMember[];

  @OneToMany(() => Expense, (e) => e.group)
  expenses: Expense[];

  @OneToMany(() => Settlement, (s) => s.group)
  settlements: Settlement[];
}
