import { randomUUID } from 'node:crypto';

import {
  AppointmentStatus,
  BusinessPlan,
  PaymentMethod,
  Prisma,
  PrismaClient,
  Role,
  SubscriptionStatus,
} from '@prisma/client';
import { hash } from 'bcryptjs';
import { DateTime } from 'luxon';

const prisma = new PrismaClient();

// Dados apenas para desenvolvimento/demo. Não usar em produção.
const DEMO_PASSWORD = 'Demo@12345';
const DEMO_BUSINESS_SLUG = 'barbearia-demo';
const DEMO_TIMEZONE = 'America/Sao_Paulo';

type DemoUserInput = {
  name: string;
  email: string;
  passwordHash: string;
  isPlatformAdmin?: boolean;
};

type DemoServiceInput = {
  name: string;
  priceInCents: number;
  durationMinutes: number;
};

async function upsertDemoUser(input: DemoUserInput) {
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      password: input.passwordHash,
      isPlatformAdmin: input.isPlatformAdmin ?? false,
    },
    create: {
      name: input.name,
      email: input.email,
      password: input.passwordHash,
      isPlatformAdmin: input.isPlatformAdmin ?? false,
    },
  });
}

async function cleanDemoBusinessData(businessId: string): Promise<void> {
  await prisma.appointment.deleteMany({ where: { businessId } });
  await prisma.manualBlock.deleteMany({ where: { businessId } });
  await prisma.invitation.deleteMany({ where: { businessId } });
  await prisma.service.deleteMany({ where: { businessId } });
  await prisma.customer.deleteMany({ where: { businessId } });
  await prisma.membership.deleteMany({ where: { businessId } });
}

function priceFromCents(cents: number): Prisma.Decimal {
  return new Prisma.Decimal(cents).div(100);
}

function localDateAt(dayOffset: number, hour: number, minute = 0): DateTime {
  return DateTime.now()
    .setZone(DEMO_TIMEZONE)
    .startOf('day')
    .plus({ days: dayOffset })
    .set({ hour, minute, second: 0, millisecond: 0 });
}

async function main(): Promise<void> {
  const passwordHash = await hash(DEMO_PASSWORD, 10);
  const now = DateTime.now().setZone(DEMO_TIMEZONE);

  const platformAdmin = await upsertDemoUser({
    name: 'Jaderson Admin',
    email: 'master@marcacerta.com',
    passwordHash,
    isPlatformAdmin: true,
  });

  await prisma.user.deleteMany({
    where: {
      email: 'git push',
      memberships: { none: {} },
      businesses: { none: {} },
      assignedAppointments: { none: {} },
      accounts: { none: {} },
      sessions: { none: {} },
    },
  });

  const owner = await upsertDemoUser({
    name: 'Marcos Oliveira',
    email: 'dono@barbeariademos.com',
    passwordHash,
  });

  const admin = await upsertDemoUser({
    name: 'Ana Souza',
    email: 'admin@barbeariademos.com',
    passwordHash,
  });

  const carlos = await upsertDemoUser({
    name: 'Carlos Lima',
    email: 'staff@barbeariademos.com',
    passwordHash,
  });

  const pedro = await upsertDemoUser({
    name: 'Pedro Santos',
    email: 'pedro@barbeariademos.com',
    passwordHash,
  });

  const existingBusiness = await prisma.business.findUnique({
    where: { slug: DEMO_BUSINESS_SLUG },
    select: { id: true },
  });

  if (existingBusiness) {
    await cleanDemoBusinessData(existingBusiness.id);
  }

  const business = await prisma.business.upsert({
    where: { slug: DEMO_BUSINESS_SLUG },
    update: {
      name: 'Barbearia Demo MarcaCerta',
      phone: '(48) 99999-0000',
      timezone: DEMO_TIMEZONE,
      openTime: '09:00',
      closeTime: '18:00',
      plan: BusinessPlan.PRO,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      paymentMethod: PaymentMethod.PIX,
      trialEndsAt: null,
      lastPaymentAt: now.toUTC().toJSDate(),
      subscriptionEndsAt: now.plus({ days: 30 }).toUTC().toJSDate(),
      ownerId: owner.id,
    },
    create: {
      name: 'Barbearia Demo MarcaCerta',
      slug: DEMO_BUSINESS_SLUG,
      phone: '(48) 99999-0000',
      timezone: DEMO_TIMEZONE,
      openTime: '09:00',
      closeTime: '18:00',
      plan: BusinessPlan.PRO,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      paymentMethod: PaymentMethod.PIX,
      trialEndsAt: null,
      lastPaymentAt: now.toUTC().toJSDate(),
      subscriptionEndsAt: now.plus({ days: 30 }).toUTC().toJSDate(),
      ownerId: owner.id,
    },
  });

  const memberships = [
    { userId: owner.id, role: Role.OWNER },
    { userId: admin.id, role: Role.ADMIN },
    { userId: carlos.id, role: Role.STAFF },
    { userId: pedro.id, role: Role.STAFF },
  ];

  for (const membership of memberships) {
    await prisma.membership.upsert({
      where: {
        userId_businessId: {
          userId: membership.userId,
          businessId: business.id,
        },
      },
      update: { role: membership.role },
      create: {
        userId: membership.userId,
        businessId: business.id,
        role: membership.role,
      },
    });
  }

  const demoServices: DemoServiceInput[] = [
    { name: 'Corte Masculino', priceInCents: 4500, durationMinutes: 30 },
    { name: 'Barba', priceInCents: 3000, durationMinutes: 30 },
    { name: 'Corte + Barba', priceInCents: 7000, durationMinutes: 60 },
    { name: 'Sobrancelha', priceInCents: 2000, durationMinutes: 20 },
  ];

  const services = await Promise.all(
    demoServices.map((service) =>
      prisma.service.create({
        data: {
          name: service.name,
          price: priceFromCents(service.priceInCents),
          durationMinutes: service.durationMinutes,
          businessId: business.id,
        },
      }),
    ),
  );

  const serviceByName = new Map(services.map((service) => [service.name, service]));

  const customers = await Promise.all(
    [
      { name: 'João Pereira', phone: '(48) 98888-1111' },
      { name: 'Lucas Martins', phone: '(48) 97777-2222' },
      { name: 'Rafael Costa', phone: '(48) 96666-3333' },
      { name: 'Bruno Almeida', phone: '(48) 95555-4444' },
    ].map((customer) =>
      prisma.customer.create({
        data: {
          name: customer.name,
          phone: customer.phone,
          businessId: business.id,
        },
      }),
    ),
  );

  const customerByName = new Map(customers.map((customer) => [customer.name, customer]));

  const appointmentInputs = [
    {
      startsAt: localDateAt(0, 9),
      customerName: 'João Pereira',
      serviceName: 'Corte Masculino',
      assignedToUserId: carlos.id,
      status: AppointmentStatus.SCHEDULED,
    },
    {
      startsAt: localDateAt(0, 10),
      customerName: 'Lucas Martins',
      serviceName: 'Barba',
      assignedToUserId: pedro.id,
      status: AppointmentStatus.SCHEDULED,
    },
    {
      startsAt: localDateAt(0, 14),
      customerName: 'Rafael Costa',
      serviceName: 'Corte + Barba',
      assignedToUserId: carlos.id,
      status: AppointmentStatus.COMPLETED,
    },
    {
      startsAt: localDateAt(1, 11),
      customerName: 'Bruno Almeida',
      serviceName: 'Sobrancelha',
      assignedToUserId: pedro.id,
      status: AppointmentStatus.SCHEDULED,
    },
    {
      startsAt: localDateAt(1, 15),
      customerName: 'João Pereira',
      serviceName: 'Corte Masculino',
      assignedToUserId: null,
      status: AppointmentStatus.SCHEDULED,
    },
  ];

  for (const appointmentInput of appointmentInputs) {
    const service = serviceByName.get(appointmentInput.serviceName);
    const customer = customerByName.get(appointmentInput.customerName);

    if (!service || !customer) {
      throw new Error(`Dados demo incompletos para ${appointmentInput.customerName}`);
    }

    const endsAt = appointmentInput.startsAt.plus({ minutes: service.durationMinutes });
    const completedAt =
      appointmentInput.status === AppointmentStatus.COMPLETED ? now.toUTC().toJSDate() : null;

    await prisma.appointment.create({
      data: {
        publicToken: randomUUID(),
        scheduledAt: appointmentInput.startsAt.toUTC().toJSDate(),
        endsAt: endsAt.toUTC().toJSDate(),
        price: service.price,
        status: appointmentInput.status,
        completedAt,
        businessId: business.id,
        serviceId: service.id,
        customerId: customer.id,
        assignedToUserId: appointmentInput.assignedToUserId,
      },
    });

    if (completedAt) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { lastVisitAt: completedAt },
      });
    }
  }

  await prisma.manualBlock.create({
    data: {
      businessId: business.id,
      startsAt: localDateAt(1, 13).toUTC().toJSDate(),
      endsAt: localDateAt(1, 14).toUTC().toJSDate(),
      reason: 'Horário reservado para pausa',
    },
  });

  console.log('\nSeed demo finalizado com sucesso.');
  console.log('Dados apenas para desenvolvimento/demo. Não usar em produção.');
  console.log(`Business: ${business.name} (${business.slug})`);
  console.log('\nCredenciais demo:');
  console.log(`Platform Admin: ${platformAdmin.email} / ${DEMO_PASSWORD}`);
  console.log(`OWNER: ${owner.email} / ${DEMO_PASSWORD}`);
  console.log(`ADMIN: ${admin.email} / ${DEMO_PASSWORD}`);
  console.log(`STAFF: ${carlos.email} / ${DEMO_PASSWORD}`);
  console.log(`STAFF: ${pedro.email} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
