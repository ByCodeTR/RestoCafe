import { PrismaClient } from './generated/prisma';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'test123',
        role: 'admin'
      }
    });
    
    console.log('Created user:', user);
    
    // Get all users
    const users = await prisma.user.findMany();
    console.log('All users:', users);
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  }); 