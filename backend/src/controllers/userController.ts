import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prismaClient'

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true
          }
        }
      },
    })
    res.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Kullanıcılar yüklenirken bir hata oluştu' })
  }
}

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, name, password, role } = req.body

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        name,
        password: hashedPassword,
        role: role || 'WAITER'
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true
      },
    })

    res.status(201).json(user)
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ error: 'Kullanıcı oluşturulurken bir hata oluştu' })
  }
}

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { username, name, role, password } = req.body

    const data: any = {
      username,
      name,
      role
    }

    // Only update password if provided
    if (password) {
      data.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    })

    res.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ error: 'Kullanıcı güncellenirken bir hata oluştu' })
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await prisma.user.delete({
      where: { id },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Kullanıcı silinirken bir hata oluştu' })
  }
} 