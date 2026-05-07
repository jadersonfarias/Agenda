# Project Context

## Visao Geral
Monorepo fullstack para agendamento de servicos com:
- area publica de reservas
- area admin autenticada
- multi-tenant por `Business`

Entidades principais por business:
- `Service`
- `Customer`
- `Appointment`
- `Membership`
- `ManualBlock`

## Stack
- Frontend: Next.js App Router, React, TypeScript, Tailwind
- Estado client-side: TanStack Query
- Auth frontend: NextAuth (`CredentialsProvider`)
- HTTP frontend: Axios (`frontend/lib/api.ts`)
- Backend: NestJS
- Banco: PostgreSQL + Prisma
- Datas/fuso: Luxon
- Feedback UI: react-hot-toast

## Estrutura Resumida
```text
/
├─ frontend/
│  ├─ app/
│  │  ├─ page.tsx
│  │  ├─ login/page.tsx
│  │  ├─ admin/page.tsx
│  │  └─ api/auth/[...nextauth]/route.ts
│  ├─ components/
│  │  ├─ admin/AdminPanel.tsx
│  │  └─ ui/*
│  ├─ features/admin/
│  │  ├─ hooks/*
│  │  ├─ services/admin-api.service.ts
│  │  ├─ services/admin-server-api.service.ts
│  │  ├─ schemas.ts
│  │  └─ types.ts
│  ├─ lib/
│  │  ├─ api.ts
│  │  ├─ auth.ts
│  │  ├─ access-token.ts
│  │  └─ server-api.ts
│  └─ types/next-auth.d.ts
├─ backend/
│  ├─ src/
│  │  ├─ admin/
│  │  ├─ appointments/
│  │  ├─ auth/
│  │  ├─ businesses/
│  │  ├─ common/
│  │  ├─ prisma/
│  │  ├─ scheduling/
│  │  ├─ app.module.ts
│  │  └─ main.ts
│  └─ prisma/
│     ├─ schema.prisma
│     ├─ migrations/
│     └─ seed.ts
└─ PROJECT_CONTEXT.md
```

## Arquitetura Atual
- Backend segue `Controller -> Service -> Repository -> Prisma`
- Frontend nao usa Prisma
- Frontend admin consome backend via HTTP
- `/admin` e server page + client panel:
  - `frontend/app/admin/page.tsx` carrega sessao e dashboard inicial
  - `frontend/components/admin/AdminPanel.tsx` faz queries/mutations

## Fluxo Frontend/Backend
### Publico
`Frontend -> Backend Nest -> Prisma`

Endpoints usados:
- `GET /businesses/:businessId/services`
- `GET /businesses/:businessId/availability`
- `GET /appointments`
- `POST /appointments`

### Admin
`AdminPanel -> Axios -> Backend Nest -> Prisma`

Endpoints principais:
- `GET /admin/dashboard`
- `GET /admin/financial-summary`
- `GET /admin/services`
- `POST /admin/services`
- `PATCH /admin/services/:serviceId`
- `DELETE /admin/services/:serviceId`
- `GET /admin/memberships`
- `POST /admin/memberships`
- `PATCH /admin/memberships/:id`
- `DELETE /admin/memberships/:id`
- `GET /admin/appointments`
- `PATCH /admin/appointments/:id/status`
- `PATCH /admin/business/availability`

## Auth
- Login real acontece no backend: `POST /auth/login`
- Frontend usa NextAuth para sessao
- Backend usa `JWT_SECRET`
- Frontend usa `NEXTAUTH_SECRET`
- Token carrega:
  - `memberships`
  - `businesses`
  - `currentBusinessId`
- Session frontend expoe:
  - `accessToken`
  - `businesses`
  - `currentBusinessId`

## Banco / Prisma
Modelos criticos:
- `User`
- `Business`
- `Membership`
- `Service`
- `Customer`
- `Appointment`
- `ManualBlock`

Regras estruturais:
- `Membership` faz `User <-> Business`
- roles: `OWNER | ADMIN | STAFF`
- unique membership: `(userId, businessId)`
- `Customer` e unico por `(businessId, phone)`

## Modulos Principais
### `backend/src/auth`
- login
- JWT
- `AuthMiddleware`
- `RoleGuard`
- resolve `request.user` e `request.businessId`

### `backend/src/admin`
- dashboard admin
- CRUD de services
- memberships
- appointments admin
- business availability
- financial summary

### `backend/src/appointments`
- criacao/listagem
- update status
- faturamento mensal

### `backend/src/businesses`
- services publicos
- disponibilidade
- clientes ativos

### `backend/src/scheduling`
- timezone
- cache de disponibilidade

## Regras de Negocio Criticas
- `Business` pode ser resolvido por `id` ou `slug`
- disponibilidade considera:
  - horario do business
  - appointments nao cancelados
  - manual blocks
  - timezone
- agendamento publico nao aceita passado
- `Customer.lastVisitAt` acompanha ultimo appointment concluido
- faturamento mensal considera apenas `COMPLETED`
- service com appointments nao pode ser excluido
- permissoes por role:
  - `OWNER`: acesso total do business
  - `ADMIN`: gerencia quase tudo, sem algumas acoes exclusivas do owner
  - `STAFF`: acesso operacional limitado
- memberships:
  - nao pode remover ultimo `OWNER`
  - nao pode rebaixar ultimo `OWNER`
  - criar membro hoje exige usuario ja existente por email
  - criar membro e restrito a `OWNER`

## Frontend Admin
- hooks principais em `frontend/features/admin/hooks`
- fetchers/mutations em `frontend/features/admin/services/admin-api.service.ts`
- dashboard inicial server-side em `frontend/features/admin/services/admin-server-api.service.ts`
- `AdminPanel.tsx` concentra UI de:
  - services
  - memberships
  - appointments
  - availability
  - financial summary
  - seletor de business atual

## Convencoes do Projeto
- backend: manter padrao controller/service/repository
- frontend: usar Axios + TanStack Query
- evitar mover regra de negocio para o frontend
- usar `businessId` explicitamente nas operacoes admin
- auth do backend sempre com `JWT_SECRET`
- auth do frontend sempre com NextAuth

## Dividas Tecnicas Importantes
- criacao de membro ainda nao cria `User`; apenas vincula usuario existente
- multi-business esta minimo:
  - ha seletor no admin
  - ainda nao existe fluxo completo de “business switch” global no app inteiro
- alguns fluxos dependem de decodificar token no frontend para decidir UI
- `AccessTokenService` ainda mistura consulta Prisma + payload customizado
- validar sempre se backend rodando foi reiniciado apos novas rotas; houve caso de rota nova nao refletida por processo antigo

## Variaveis de Ambiente Importantes
- `DATABASE_URL`
- `NEXT_PUBLIC_API_URL`
- `API_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `JWT_SECRET`

## Agent Control
- Prioridade: alterar codigo, nao documentacao
- Responder de forma curta
- Reutilizar padroes existentes
- Nao assumir arquitetura alvo; usar o codigo atual como verdade
- Nao marcar como implementado o que ainda e so ideia
