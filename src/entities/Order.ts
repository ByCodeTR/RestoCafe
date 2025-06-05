import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Table } from './Table'
import { User } from './User'

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  tableNumber: string

  @Column('jsonb')
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
    notes?: string
  }>

  @Column({
    type: 'enum',
    enum: ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  })
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number

  @Column({ default: false })
  isPrinted: boolean

  @ManyToOne(() => Table)
  @JoinColumn({ name: 'tableId' })
  table: Table

  @Column({ nullable: true })
  tableId: string

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'waiterId' })
  waiter: User

  @Column({ nullable: true })
  waiterId: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
} 