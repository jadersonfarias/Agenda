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
│  │  ├─ admin-master/page.tsx
│  │  └─ api/auth/[...nextauth]/route.ts
│  ├─ components/
│  │  ├─ admin/AdminPanel.tsx
│  │  ├─ platform/*
│  │  └─ ui/*
│  ├─ features/admin/
│  │  ├─ hooks/*
│  │  ├─ services/admin-api.service.ts
│  │  ├─ services/admin-server-api.service.ts
│  │  ├─ subscription-payment.ts
│  │  ├─ schemas.ts
│  │  └─ types.ts
│  ├─ features/platform/
│  │  ├─ hooks/*
│  │  ├─ services/platform-api.service.ts
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
│  │  ├─ platform/
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
- `/admin-master` e server page para administradores da plataforma:
  - exige `session.user.isPlatformAdmin === true`
  - usa `frontend/components/platform/*` e `frontend/features/platform/*`

## Fluxo Frontend/Backend
### Publico
`Frontend -> Backend Nest -> Prisma`

Endpoints usados:
- `GET /businesses/:businessId/services`
- `GET /businesses/:businessId/availability`
- `GET /appointments`
- `POST /appointments`

Protecao basica contra abuso:
- rate limit por rota em:
  - `GET /businesses/:businessId/availability`
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

### Platform / Admin Master
`AdminMasterPage -> Axios -> Backend Nest -> Prisma`

Rotas protegidas por `AuthMiddleware` + `PlatformAdminGuard`:
- `GET /platform/health`
- `GET /platform/businesses`
- `PATCH /platform/businesses/:businessId/subscription`
- `PATCH /platform/businesses/:businessId/cancel-subscription`
- `PATCH /platform/businesses/:businessId/mark-past-due`

## Auth
- Login real acontece no backend: `POST /auth/login`
- `POST /auth/login` tem rate limit por rota
- `POST /auth/register-business-owner` tem rate limit por rota
- Frontend usa NextAuth para sessao
- Backend usa `JWT_SECRET`
- Frontend usa `NEXTAUTH_SECRET`
- Token carrega:
  - `isPlatformAdmin`
  - `memberships`
  - `businesses`
  - `currentBusinessId`
- Session frontend expoe:
  - `accessToken`
  - `user.isPlatformAdmin`
  - `businesses`
  - `currentBusinessId`
- `PlatformAdminGuard` permite `/platform/*` apenas para usuario com `isPlatformAdmin === true`

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
- `User.isPlatformAdmin` identifica administradores da plataforma
- `Membership` faz `User <-> Business`
- roles: `OWNER | ADMIN | STAFF`
- unique membership: `(userId, businessId)`
- `Customer` e unico por `(businessId, phone)`
- `Business.plan`: `FREE | BASIC | PRO`
- `Business.subscriptionStatus`: `TRIALING | ACTIVE | PAST_DUE | CANCELED`
- `Business.trialEndsAt`, `subscriptionEndsAt`, `lastPaymentAt` guardam datas do ciclo de assinatura
- `Business.paymentMethod`: `PIX | MANUAL | null`

## Modulos Principais
### `backend/src/auth`
- login
- JWT
- `AuthMiddleware`
- `RoleGuard`
- `PlatformAdminGuard`
- rate limit por decorator nas rotas sensiveis
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

### `backend/src/platform`
- listagem paginada de businesses da plataforma
- filtros por status, plano e busca
- ativacao/renovacao manual de plano por meses
- marcar assinatura como `PAST_DUE`
- cancelar assinatura como `CANCELED`

### `backend/src/common`
- `RateLimit` decorator por rota
- `SimpleRateLimitGuard`
- `SimpleRateLimitService`
- limite simples em memoria por IP
- excesso retorna `429` com header `Retry-After`

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
- assinatura/plano:
  - ativacao manual define `plan`, `subscriptionEndsAt`, `lastPaymentAt` e `paymentMethod`
  - renovacao soma meses a partir do fim atual se ainda estiver vigente; senao parte de agora
  - `PAST_DUE` e `CANCELED` podem ser marcados pelo admin master
  - Pix manual nao integra gateway nem valida comprovante automaticamente
  - funcionalidades nao sao bloqueadas automaticamente pelo status da assinatura

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
- se o trial estiver expirado, ou status for `PAST_DUE`/`CANCELED`, o admin normal mostra card de Pix manual:
  - constantes em `frontend/features/admin/subscription-payment.ts`
  - botao abre WhatsApp de suporte com mensagem pre-preenchida

## Frontend Admin Master
- rota: `frontend/app/admin-master/page.tsx`
- acesso: somente sessao com `user.isPlatformAdmin`
- UI principal: `frontend/components/platform/PlatformBusinessesSection.tsx`
- gerencia plano/status com `PlatformBusinessSubscriptionManager.tsx`
- chamadas em `frontend/features/platform/services/platform-api.service.ts`

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
- Pix do admin normal usa constantes hardcoded/placeholder no frontend
- admin master faz controle manual de assinatura; nao existe gateway, upload de comprovante ou conciliacao automatica
- status de assinatura ainda nao bloqueia rotas ou funcionalidades automaticamente
- validar sempre se backend rodando foi reiniciado apos novas rotas; houve caso de rota nova nao refletida por processo antigo

## Variaveis de Ambiente Importantes
- `DATABASE_URL`
- `NEXT_PUBLIC_API_URL`
- `API_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `JWT_SECRET`

## Constantes Frontend Importantes
- `PIX_KEY`
- `SUPPORT_WHATSAPP`
- `BASIC_PRICE`
- `PRO_PRICE`

## Agent Control
- Prioridade: alterar codigo, nao documentacao
- Responder de forma curta
- Reutilizar padroes existentes
- Nao assumir arquitetura alvo; usar o codigo atual como verdade
- Nao marcar como implementado o que ainda e so ideia
