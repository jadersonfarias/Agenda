# Project Context

## Visao Geral
Monorepo fullstack da MarcaCerta para agendamento de servicos com:
- site publico e reserva online;
- area admin autenticada por business;
- admin master da plataforma;
- multi-business por `Business`;
- isolamento de dados por `businessId`.

Entidades principais:
- `User`, `Business`, `Membership`, `Invitation`
- `Service`, `Customer`, `Appointment`, `ManualBlock`

## Stack
- Frontend: Next.js App Router, React, TypeScript, Tailwind
- Estado client-side: TanStack Query
- Formularios: React Hook Form + Zod
- Auth frontend: NextAuth (`CredentialsProvider`)
- HTTP frontend: Axios (`frontend/lib/api.ts`)
- Backend: NestJS + TypeScript
- Banco: PostgreSQL + Prisma
- Datas/fuso: Luxon
- Feedback UI: react-hot-toast

## Estrutura Atual
```text
frontend/
  app/
    page.tsx
    login/page.tsx
    signup/page.tsx
    admin/page.tsx
    admin-master/page.tsx
    b/[slug]/page.tsx
    appointments/[token]/page.tsx
    invite/[token]/page.tsx
    meus-agendamentos/page.tsx
    api/auth/[...nextauth]/route.ts
  components/
    admin/*
    platform/*
    public/*
    ui/*
  features/
    admin/*
    invitations/*
    platform/*
  lib/*
  types/next-auth.d.ts

backend/
  src/
    admin/
    appointments/
    auth/
    businesses/
    common/
    platform/
    prisma/
    scheduling/
  prisma/
    schema.prisma
    migrations/
    seed.ts
```

## Arquitetura
- Backend segue `Controller -> Service -> Repository -> Prisma`.
- Frontend nao usa Prisma diretamente.
- Admin normal usa `/admin` com server page + `AdminPanel`.
- Admin master usa `/admin-master` e exige `session.user.isPlatformAdmin === true`.
- Auth backend usa JWT via `@nestjs/jwt` e `JWT_SECRET`.
- Auth frontend usa NextAuth e `NEXTAUTH_SECRET`.
- `AuthMiddleware` resolve `request.user` e `request.businessId`.
- `RoleGuard` valida role por `Membership`.
- `PlatformAdminGuard` valida `isPlatformAdmin`.

## Rotas Frontend
- `/`: landing publica MarcaCerta
- `/signup`: cadastro publico de dono + primeiro business
- `/login`: login com NextAuth
- `/admin`: painel admin do business
- `/admin-master`: painel master da plataforma
- `/b/[slug]`: pagina publica de reserva por slug
- `/appointments/[token]`: detalhe/cancelamento publico da reserva
- `/meus-agendamentos`: consulta publica de agendamentos por dados do cliente
- `/invite/[token]`: aceite de convite de equipe

## Endpoints Backend
### Auth
- `POST /auth/login`
- `POST /auth/register-business-owner`

### Publico
- `GET /businesses/:businessId`
- `GET /businesses/slug/:slug`
- `GET /businesses/:businessId/services`
- `GET /businesses/:businessId/availability`
- `GET /appointments`
- `GET /appointments/customer`
- `GET /appointments/financial/monthly`
- `GET /appointments/public/:token`
- `POST /appointments`
- `PATCH /appointments/public/:token/cancel`
- `PATCH /appointments/:id/status`
- `DELETE /appointments/:id`

### Admin
Rotas protegidas por `AuthMiddleware` + `RoleGuard`.
- `GET /admin/dashboard`
- `GET /admin/services`
- `POST /admin/services`
- `PATCH /admin/services/:id`
- `DELETE /admin/services/:id`
- `PATCH /admin/business/availability`
- `GET /admin/memberships`
- `POST /admin/memberships`
- `PATCH /admin/memberships/:id`
- `DELETE /admin/memberships/:id`
- `GET /admin/invitations`
- `POST /admin/invitations`
- `GET /admin/appointments`
- `PATCH /admin/appointments/:id/status`
- `PATCH /admin/appointments/:id/assignee`
- `GET /admin/financial-summary`
- `GET /admin/reports/financial`

### Convites
- `GET /invitations/:token`
- `POST /invitations/:token/accept`

### Platform / Admin Master
Rotas protegidas por `AuthMiddleware` + `PlatformAdminGuard`.
- `GET /platform/health`
- `GET /platform/businesses`
- `PATCH /platform/businesses/:businessId/subscription`
- `PATCH /platform/businesses/:businessId/cancel-subscription`
- `PATCH /platform/businesses/:businessId/mark-past-due`

## Auth e Sessao
- Login real acontece no backend.
- NextAuth guarda `accessToken`, `businesses`, `currentBusinessId` e `isPlatformAdmin`.
- Token backend carrega:
  - `sub`
  - `email`
  - `isPlatformAdmin`
  - `memberships`
  - `businesses`
  - `currentBusinessId`
- Um usuario pode ter memberships em mais de um business.
- Se houver apenas um membership, o backend consegue inferir `businessId`.
- Chamadas admin do frontend enviam `businessId` explicitamente.

## Banco / Prisma
Modelos criticos:
- `User`
- `Business`
- `Membership`
- `Invitation`
- `Service`
- `Customer`
- `Appointment`
- `ManualBlock`

Regras estruturais:
- `User.isPlatformAdmin` identifica administradores da plataforma.
- `Membership` faz `User <-> Business`.
- Roles: `OWNER | ADMIN | STAFF`.
- `Membership` e unico por `(userId, businessId)`.
- `Customer` e unico por `(businessId, phone)`.
- `Business.slug` e unico.
- `Business.plan`: `FREE | BASIC | PRO`.
- `Business.subscriptionStatus`: `TRIALING | ACTIVE | PAST_DUE | CANCELED`.
- `Business.paymentMethod`: `PIX | MANUAL | null`.
- `Appointment.publicToken` e usado para detalhe publico da reserva.
- `Appointment.assignedToUserId` e opcional e aponta para o `User` responsavel pelo atendimento.

## Regras de Negocio Implementadas
- Cadastro publico cria dono, business, membership `OWNER`, plano `BASIC`, status `TRIALING` e trial de 7 dias.
- Disponibilidade considera horario do business, appointments nao cancelados, manual blocks e timezone.
- Agendamento publico nao aceita horario passado.
- `Customer.lastVisitAt` acompanha ultimo appointment concluido.
- Faturamento mensal considera apenas appointments `COMPLETED`.
- Agenda por responsavel no admin:
  - `OWNER` e `ADMIN` listam todos os agendamentos do business.
  - `STAFF` lista apenas agendamentos com `assignedToUserId` igual ao proprio usuario.
  - `STAFF` so altera status de agendamentos atribuidos a ele.
  - `OWNER` e `ADMIN` podem atribuir/trocar responsavel do atendimento.
- Service com appointments nao pode ser excluido.
- Membros:
  - `OWNER` gerencia equipe e convites.
  - nao pode remover/rebaixar ultimo `OWNER`.
  - convite pode criar usuario novo ou vincular usuario existente.
- Assinatura:
  - admin master lista businesses e gerencia status/plano.
  - ativacao manual define `plan`, `subscriptionEndsAt`, `lastPaymentAt` e `paymentMethod`.
  - renovacao soma meses a partir do fim atual se ainda estiver vigente; senao parte de agora.
  - `PAST_DUE` e `CANCELED` podem ser marcados manualmente.
  - Pix manual nao integra gateway nem valida comprovante automaticamente.
  - status da assinatura ainda nao bloqueia rotas ou funcionalidades automaticamente.

## Frontend Admin
- `frontend/app/admin/page.tsx` carrega sessao, dashboard inicial e appointments iniciais.
- `frontend/components/admin/AdminPanel.tsx` concentra:
  - overview/onboarding
  - services
  - appointments
  - availability
  - financial summary/report
  - team/memberships/invitations
  - business switcher
- Hooks e chamadas ficam em `frontend/features/admin/*`.
- Agenda:
  - mostra responsavel pelo atendimento quando existir.
  - exibe "Sem responsavel" quando `assignedToUserId` e `null`.
  - `OWNER` e `ADMIN` veem filtro por responsavel.
  - queryKey da agenda usa `businessId`, `statusFilter` e `assignedToUserId`.
- Se trial estiver expirado, ou status for `PAST_DUE`/`CANCELED`, mostra card Pix manual:
  - componente: `frontend/components/admin/SubscriptionPaymentCard.tsx`
  - constantes: `frontend/features/admin/subscription-payment.ts`
  - botao abre WhatsApp com mensagem pre-preenchida.

## Frontend Admin Master
- Rota: `frontend/app/admin-master/page.tsx`.
- Acesso: somente `session.user.isPlatformAdmin`.
- UI principal: `frontend/components/platform/PlatformBusinessesSection.tsx`.
- Gerencia plano/status com `PlatformBusinessSubscriptionManager.tsx`.
- Chamadas em `frontend/features/platform/services/platform-api.service.ts`.

## Identidade Visual
- Marca publica atual: MarcaCerta.
- Metadata, header publico e landing usam MarcaCerta.
- Logo usado em `frontend/public/marcacerta-logo.png` e assets relacionados.
- Admin normal e admin master ainda usam visual mais generico do sistema, com predominancia de roxo.

## Variaveis e Config
Variaveis usadas/importantes:
- `DATABASE_URL`
- `NEXT_PUBLIC_API_URL`
- `API_URL`
- `NEXT_PUBLIC_DEFAULT_BUSINESS_ID`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `JWT_SECRET`
- `FRONTEND_URL` para montar links de convite, com fallback para `NEXTAUTH_URL`
- `HOST` no backend, opcional

Constantes frontend atuais para Pix manual:
- `PIX_KEY`
- `SUPPORT_WHATSAPP`
- `BASIC_PRICE`
- `PRO_PRICE`

Comandos uteis:
- `npm run dev`
- `npm run dev:ngrok`
- `npm run build`
- `npm run seed`
- `npm --workspace=frontend run build`
- `npm --workspace=backend run build`
- `npm --workspace=backend run test`
- `npm --workspace=backend run prisma:migrate`

## Pendencias / Riscos Atuais
- `PIX_KEY`, `SUPPORT_WHATSAPP`, `BASIC_PRICE` e `PRO_PRICE` estao hardcoded/placeholder no frontend.
- Nao existe gateway, upload de comprovante ou conciliacao automatica de pagamento.
- Status da assinatura ainda nao bloqueia uso do sistema.
- `.env.example` nao documenta todas as variaveis usadas em producao, como `API_URL`, `JWT_SECRET` e `FRONTEND_URL`.
- CORS do backend esta aberto com `origin: true`.
- Alguns endpoints em `/appointments` usam apenas `businessId` por query/body e nao passam por `AuthMiddleware`; revisar antes de producao.
- Agendamentos antigos podem estar sem responsavel (`assignedToUserId = null`); atribuir manualmente quando necessario.
- Seed cria usuarios com senha `password123`; nao usar seed/credenciais de dev em producao.
- Criacao direta de membro por email ainda depende de usuario existente; convite cobre criacao de usuario novo.
- Multi-business ainda e simples: ha seletor no admin, mas nao ha fluxo global completo fora do painel.
- Alguns fluxos do frontend ainda dependem de dados do token/session para decidir UI.
- Reiniciar backend apos adicionar rotas novas; ja houve caso de processo antigo nao refletir rota nova.

## Convencoes
- Nao acessar Prisma diretamente em controller.
- Manter isolamento por `businessId`.
- Validar permissao antes de ler/alterar dados sensiveis.
- Frontend deve usar Axios + TanStack Query para chamadas admin.
- Formularios devem usar React Hook Form + Zod quando aplicavel.
- Evitar refatoracao fora do escopo.
- Nao marcar como implementado o que ainda e apenas ideia.
