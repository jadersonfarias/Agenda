import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

type SeedUser = {
  name: string;
  email: string;
  password: string;
  membershipRole: 'OWNER' | 'ADMIN' | 'STAFF';
  isPlatformAdmin?: boolean;
};

async function main(): Promise<void> {
  const businessSlug = 'default-business';
  const users: SeedUser[] = [
    {
      name: 'Administrador',
      email: 'admin@salon.com',
      password: 'password123',
      membershipRole: 'OWNER',
      isPlatformAdmin: true,
    },
    {
      name: 'Gerente',
      email: 'manager@salon.com',
      password: 'password123',
      membershipRole: 'ADMIN',
    },
    {
      name: 'Atendente',
      email: 'staff@salon.com',
      password: 'password123',
      membershipRole: 'STAFF',
    },
  ];

  const preparedUsers = await Promise.all(
    users.map(async (user) => ({
      ...user,
      hashedPassword: await hash(user.password, 10),
    })),
  );

  const ownerSeedUser = preparedUsers.find((user) => user.membershipRole === 'OWNER');

  if (!ownerSeedUser) {
    throw new Error('Seed sem usuário OWNER configurado');
  }

  const ownerUser = await prisma.user.upsert({
    where: { email: ownerSeedUser.email },
    update: {
      name: ownerSeedUser.name,
      password: ownerSeedUser.hashedPassword,
      isPlatformAdmin: ownerSeedUser.isPlatformAdmin ?? false,
    },
    create: {
      name: ownerSeedUser.name,
      email: ownerSeedUser.email,
      password: ownerSeedUser.hashedPassword,
      isPlatformAdmin: ownerSeedUser.isPlatformAdmin ?? false,
    },
  });
  console.log(`Usuário pronto para login: ${ownerSeedUser.email}`);

  let business = await prisma.business.findUnique({ where: { slug: businessSlug } });
  if (!business) {
    business = await prisma.business.create({
      data: {
        name: 'Negócio Padrão',
        slug: businessSlug,
        openTime: '09:00',
        closeTime: '18:00',
        ownerId: ownerUser.id,
        timezone: 'America/Sao_Paulo',
      },
    });
    console.log(`Negócio criado: ${businessSlug}`);
  } else {
    business = await prisma.business.update({
      where: { id: business.id },
      data: {
        ownerId: ownerUser.id,
      },
    });
    console.log(`Negócio já existe: ${businessSlug}`);
  }

  for (const seedUser of preparedUsers) {
    const user = seedUser.email === ownerSeedUser.email
      ? ownerUser
      : await prisma.user.upsert({
          where: { email: seedUser.email },
        update: {
          name: seedUser.name,
          password: seedUser.hashedPassword,
          isPlatformAdmin: seedUser.isPlatformAdmin ?? false,
        },
        create: {
          name: seedUser.name,
          email: seedUser.email,
          password: seedUser.hashedPassword,
          isPlatformAdmin: seedUser.isPlatformAdmin ?? false,
        },
      });

    await prisma.$executeRaw`
      INSERT INTO "Membership" ("id", "userId", "businessId", "role", "createdAt", "updatedAt")      
      VALUES (gen_random_uuid(), ${user.id}, ${business.id}, ${seedUser.membershipRole}::"Role", NOW(), NOW())
      ON CONFLICT ("userId", "businessId")
      DO UPDATE SET "role" = ${seedUser.membershipRole}::"Role", "updatedAt" = NOW()
    `;

    console.log(`Membership garantida: ${seedUser.email} -> ${seedUser.membershipRole}`);
  }

  const serviceName = 'Corte de cabelo';
  const existingService = await prisma.service.findFirst({
    where: { name: serviceName, businessId: business.id },
  });
  if (!existingService) {
    await prisma.service.create({
      data: {
        name: serviceName,
        price: 80.0,
        durationMinutes: 60,
        businessId: business.id,
      },
    });
    console.log(`Serviço criado: ${serviceName}`);
  } else {
    console.log(`Serviço já existe: ${serviceName}`);
  }

  console.log('\nSeed finalizado com sucesso.');
  for (const seedUser of preparedUsers) {
    console.log(`Login (${seedUser.membershipRole}):`, seedUser.email);
    console.log('Senha:', seedUser.password);
  }
}

main()
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
