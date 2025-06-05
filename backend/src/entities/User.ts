import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column({ unique: true })
  email: string

  @Column()
  password: string

  @Column({
    type: 'enum',
    enum: ['ADMIN', 'WAITER', 'KITCHEN'],
    default: 'WAITER'
  })
  role: 'ADMIN' | 'WAITER' | 'KITCHEN'

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
} 