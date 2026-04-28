import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { validatePasswordOrThrow } from './common/password-policy';

const prisma = new PrismaClient();

async function main() {
  const phone = process.env.ADMIN_PHONE?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const fullAddress = process.env.ADMIN_ADDRESS?.trim() || 'Администратор';
  const contractNumber = process.env.ADMIN_CONTRACT_NUMBER?.trim() || 'ADMIN-001';

  if (!phone || !password) {
    throw new Error('Set ADMIN_PHONE and ADMIN_PASSWORD before running this command');
  }

  validatePasswordOrThrow(password);
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { phone },
    update: {
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      fullAddress,
      contractNumber,
    },
    create: {
      phone,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      fullAddress,
      contractNumber,
    },
  });

  console.log(`Admin account is ready: ${admin.phone}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
