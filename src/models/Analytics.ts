import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('analytics')
export class Analytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  event_type: string; // phone_click, conversion_start, ad_revenue, etc.

  @Column({ type: 'jsonb' })
  event_data: any;

  @Column({ nullable: true })
  @Index()
  user_id?: string;

  @Column({ nullable: true })
  phone_id?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  revenue?: number;

  @CreateDateColumn()
  @Index()
  created_at: Date;
}
