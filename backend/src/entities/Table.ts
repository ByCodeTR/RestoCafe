import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('tables')
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  number: string

  @Column({
    type: 'enum',
    enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED'],
    default: 'AVAILABLE'
  })
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'

  @Column({ nullable: true })
  capacity: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
} 