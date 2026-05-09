import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Group } from './group.entity';

export type MemberRole = 'owner' | 'member';

/**
 * GroupMember representa la relación usuario ↔ grupo.
 * Soporta invitaciones a personas que aún no se registraron:
 * - Si la persona ya existe → userId apunta al user
 * - Si todavía no se registró → userId queda null y guardamos invitedEmail.
 *   Cuando esa persona haga login con Google y su email coincida, vinculamos.
 */
@Entity('group_members')
@Unique(['groupId', 'userId'])
@Unique(['groupId', 'invitedEmail'])
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  groupId: string;

  @ManyToOne(() => Group, (g) => g.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Index()
  @Column({ nullable: true, type: 'uuid' })
  userId: string | null;

  @ManyToOne(() => User, (u) => u.memberships, { nullable: true, eager: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  // Si la persona aún no se registró, guardamos el email para vincularla después
  @Index()
  @Column({ nullable: true, type: 'varchar' })
  invitedEmail: string | null;

  // Display name para mostrar antes de que se registre
  @Column({ nullable: true, type: 'varchar' })
  invitedName: string | null;

  @Column({ default: 'member' })
  role: MemberRole;

  @CreateDateColumn()
  joinedAt: Date;
}
