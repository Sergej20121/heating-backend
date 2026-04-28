import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
  const phone = process.env.SEED_ADMIN_PHONE?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD?.trim();
  if (!phone || !password) return console.log('Seed пропущен: задайте SEED_ADMIN_PHONE и SEED_ADMIN_PASSWORD');
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.upsert({ where: { phone }, update: { passwordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE, fullAddress: process.env.SEED_ADMIN_ADDRESS?.trim() || 'Адрес администратора', contractNumber: process.env.SEED_ADMIN_CONTRACT?.trim() || 'ADMIN-001' }, create: { phone, passwordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE, fullAddress: process.env.SEED_ADMIN_ADDRESS?.trim() || 'Адрес администратора', contractNumber: process.env.SEED_ADMIN_CONTRACT?.trim() || 'ADMIN-001' } });
  console.log(`Admin ready: ${admin.phone}`);
}
main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
