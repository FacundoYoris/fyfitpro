const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.user.findUnique({ where: { username: 'adminuser' } });
    console.log('User found:', user?.username);
    
    // Probar con admin123
    const valid1 = await bcrypt.compare('admin123', user?.password || '');
    console.log('admin123 valid:', valid1);
    
    // Probar con otras contraseñas comunes
    const passwords = ['admin', '123456', 'password', 'Admin123'];
    for (const pwd of passwords) {
      const valid = await bcrypt.compare(pwd, user?.password || '');
      console.log(`${pwd} valid:`, valid);
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    prisma.$disconnect();
  }
}

test();
