import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { CommunityPost } from './CommunityPost';
import { Contact } from './Contact';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  profile_image_url?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  location_lat?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  location_lon?: number;

  @Column({ default: 'free' })
  @Index()
  subscription_tier: string; // free, premium, upgrade

  @Column({ type: 'timestamp', nullable: true })
  subscription_expires_at?: Date;

  @Column({ nullable: true })
  stripe_customer_id?: string;

  @Column({ nullable: true })
  stripe_subscription_id?: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_admin: boolean;

  @Column({ nullable: true })
  refresh_token?: string;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToMany(() => CommunityPost, (post) => post.user)
  posts: CommunityPost[];

  @OneToMany(() => Contact, (contact) => contact.user)
  contacts: Contact[];
}
