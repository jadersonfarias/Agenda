# Scheduler SaaS

Projeto fullstack multi-tenant com:
- Frontend: Next.js App Router, Tailwind CSS, React Hook Form, Zod, TanStack Query, NextAuth
- Backend: NestJS, Prisma, PostgreSQL, Zod
- Arquitetura: Controller, Service, Repository, Prisma ORM

## Como rodar

1. Defina variáveis de ambiente no arquivo `.env` na raiz:
```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXT_PUBLIC_API_URL="http://localhost:3333"
NEXT_PUBLIC_DEFAULT_BUSINESS_ID="default-business"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="uma_senha_secreta_segura"
```

2. Instale dependências
```bash
npm install
```

3. Gere o cliente Prisma
```bash
npx prisma generate
```

4. (Opcional) Gere dados iniciais de exemplo
```bash
npm run seed
```

5. Execute a aplicação
```bash
npm run dev
```

5. Acesse:
- Frontend: http://localhost:3000
- Backend: http://localhost:3333

## Usando Docker no Windows

Se você quiser rodar o banco PostgreSQL em Docker, use o `docker-compose.yml` fornecido.

1. Instale o Docker Desktop e habilite o backend WSL 2.
2. Inicie o container do banco:
```bash
docker compose up -d
```
3. Certifique-se de que `DATABASE_URL` no `.env` está definido como:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/salao"
```
4. Execute as migrações/seed:
```bash
npx prisma db push
npm --workspace=backend run seed
```
5. Inicie o app:
```bash
npm run dev
```

## Endpoints principais

- `GET /appointments?businessId=...`
- `POST /appointments`
- `PATCH /appointments/:id/status?businessId=...`
- `DELETE /appointments/:id?businessId=...`
- `GET /businesses/:businessId/services`
- `GET /businesses/:businessId/availability?serviceId=...&date=...`

## Notas

- O frontend inclui login com NextAuth para a área `/admin`
- O backend usa Prisma para modelos multi-business: `User`, `Business`, `Customer`, `Service`, `Appointment`
- A lógica evita conflito de horários por negócio e calcula disponibilidade por serviço
