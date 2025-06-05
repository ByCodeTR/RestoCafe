import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createWaiter() {
  try {
    const username = 'garson1';
    const password = 'garson123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        name: 'Garson 1',
        email: 'garson1@restocafe.com',
        password: hashedPassword,
        role: 'WAITER'
      }
    });

    console.log('Garson hesabı oluşturuldu:', {
      username: user.username,
      name: user.name,
      role: user.role
    });

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createWaiter(); 