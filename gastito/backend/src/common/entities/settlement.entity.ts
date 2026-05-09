import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Group, Currency } from './group.entity';
import { GroupMember } from './group-member.entity';

/**
 * Settlement = un pago directo entre dos miembros del grupo para saldar deuda.
 * Ej: "Juan le transfirió $5.000 a María por Mercado Pago".
 */
@Entity('settlements')
export class Settlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  groupId: string;

  @ManyToOne(() => Group, (g) => g.settlements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column()
  fromMemberId: string;

  @ManyToOne(() => GroupMember, { eager: true })
  @JoinColumn({ name: 'fromMemberId' })
  fromMember: GroupMember;

  @Column()
  toMemberId: string;

  @ManyToOne(() => GroupMember, { eager: true })
  @JoinColumn({ name: 'toMemberId' })
  toMember: GroupMember;

  @Column('decimal', { precision: 14, scale: 2 })
  amount: string;

  @Column()
  currency: Currency;

  @Column({ type: 'date' })
  date: string;

  @Column({ nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}
