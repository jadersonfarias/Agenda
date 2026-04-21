import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@salon.com'
  const password = 'password123'
  const businessSlug = 'default-business'

  let user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Administrador',
        email,
        password: await hash(password, 10),
      },
    })
    console.log(`Usuário criado: ${email}`)
  } else {
    console.log(`Usuário já existe: ${email}`)
  }

  let business = await prisma.business.findUnique({ where: { slug: businessSlug } })
  if (!business) {
    business = await prisma.business.create({
      data: {
        name: 'Negócio Padrão',
        slug: businessSlug,
        openTime: '09:00',
        closeTime: '18:00',
        ownerId: user.id,
        timezone: 'America/Sao_Paulo',
      },
    })
    console.log(`Negócio criado: ${businessSlug}`)
  } else {
    console.log(`Negócio já existe: ${businessSlug}`)
  }

  const serviceName = 'Corte de cabelo'
  const existingService = await prisma.service.findFirst({ where: { name: serviceName, businessId: business.id } })
  if (!existingService) {
    await prisma.service.create({
      data: {
        name: serviceName,
        price: 80.0,
        durationMinutes: 60,
        businessId: business.id,
      },
    })
    console.log(`Serviço criado: ${serviceName}`)
  } else {
    console.log(`Serviço já existe: ${serviceName}`)
  }

  console.log('\nSeed finalizado com sucesso.')
  console.log('Login:', email)
  console.log('Senha:', password)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
