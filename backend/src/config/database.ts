import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✓ Conexión a SQLite establecida');
  } catch (error) {
    console.error('✗ Error conectando a SQLite:', error);
    process.exit(1);
  }
};

export default prisma;
