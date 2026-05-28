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
- `GET /appointments/customer` (rate limit)
- `GET /appointments/financial/monthly`
- `GET /appointments/public/:token` (rate limit)
- `POST /appointments` (rate limit)
- `PATCH /appointments/public/:token/cancel` (rate limit)
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
- `GET /admin/memberships` (paginado opcionalmente com `page` e `perPage`)
- `POST /admin/memberships`
- `PATCH /admin/memberships/:id`
- `DELETE /admin/memberships/:id`
- `GET /admin/invitations` (paginado opcionalmente com `page` e `perPage`)
- `POST /admin/invitations`
- `GET /admin/appointments`
- `PATCH /admin/appointments/:id/status`
- `PATCH /admin/appointments/:id/assignee`
- `GET /admin/financial-summary`
- `GET /admin/reports/financial`

### Convites
- `GET /invitations/:token` (rate limit)
- `POST /invitations/:token/accept` (rate limit)

### Platform / Admin Master
Rotas protegidas por `AuthMiddleware` + `PlatformAdminGuard`.
- `GET /platform/health`
- `GET /platform/businesses` (paginado com `page` e `perPage`)
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
- Consulta publica `GET /appointments/customer` exige `businessId` para busca efetiva, usa candidatos exatos de telefone (`phone IN (...)`) dentro do business e nao faz varredura ampla normalizando todos os clientes em memoria.
- `Customer.lastVisitAt` acompanha ultimo appointment concluido.
- Faturamento mensal considera apenas appointments `COMPLETED`.
- Agenda por responsavel no admin:
  - `Appointment.assignedToUserId` indica o responsavel pelo atendimento.
  - `OWNER` e `ADMIN` listam todos os agendamentos do business.
  - `STAFF` lista apenas agendamentos com `assignedToUserId` igual ao proprio usuario.
  - `STAFF` so altera status de agendamentos atribuidos a ele.
  - `OWNER` e `ADMIN` podem atribuir/trocar responsavel pelo endpoint `PATCH /admin/appointments/:id/assignee`.
- Service com appointments nao pode ser excluido.
- Membros:
  - `OWNER` gerencia equipe e convites.
  - `OWNER` e `ADMIN` podem listar memberships.
  - `GET /admin/memberships` e `GET /admin/invitations` aceitam paginacao e retornam `{ data, meta }` quando `page/perPage` sao enviados.
  - nao pode remover/rebaixar ultimo `OWNER`.
  - convite pode criar usuario novo ou vincular usuario existente.
- Assinatura:
  - admin master lista businesses e gerencia status/plano.
  - ativacao manual define `plan`, `subscriptionEndsAt`, `lastPaymentAt` e `paymentMethod`.
  - renovacao soma meses a partir do fim atual se ainda estiver vigente; senao parte de agora.
  - `PAST_DUE` e `CANCELED` podem ser marcados manualmente.
  - Pix manual nao integra gateway nem valida comprovante automaticamente.
  - Escritas sensiveis chamam `SubscriptionService.assertBusinessCanWrite`.
  - Escrita e bloqueada para `PAST_DUE`, `CANCELED` ou ciclo vencido apos 1 dia de tolerancia.
  - Leituras administrativas e publicas continuam permitidas.

## Performance e Seguranca
- Rotas publicas sensiveis usam rate limit simples global:
  - consulta por telefone de appointment;
  - detalhe/cancelamento publico de appointment por token;
  - criacao publica de appointment;
  - detalhe/aceite de convite por token.
- `appointments.repository.findById` usa `select` minimo para fluxos de status/delete/assignee: `id`, `businessId`, `customerId`, `status`, `assignedToUserId`.
- `appointments.repository.updateStatus` usa `updateMany` com filtro por `id` e `businessId`.
- `findByPublicToken` seleciona apenas dados necessarios para resposta publica e cancelamento.

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
- Team/equipe:
  - `TeamSection` consome memberships e invitations paginados.
  - nao busca todas as paginas em paralelo.
  - mantem acoes de convite, copia de link, WhatsApp, edicao de role e remocao de membro.
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
- `/admin-master` consome apenas a pagina atual de `GET /platform/businesses`.
- A UI mostra pagina atual, total de clientes e total de paginas; nao busca todas as paginas em paralelo.

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
- `ALLOWED_ORIGINS` para origens extras permitidas no CORS, separadas por virgula
- `HOST` no backend, opcional

Config atual de CORS:
- Backend usa `buildCorsOptions`.
- Em desenvolvimento, localhost e 127.0.0.1 sao permitidos.
- Em producao, origins precisam estar em `FRONTEND_URL` ou `ALLOWED_ORIGINS`.
- Requisicoes sem header `Origin` continuam permitidas.

Config frontend atual para Pix manual:
- `PIX_KEY`, `SUPPORT_WHATSAPP`, `BASIC_PRICE` e `PRO_PRICE` vêm de `NEXT_PUBLIC_*`.
- Existem fallbacks hardcoded em `frontend/features/admin/subscription-payment.ts`.

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
- Pix manual ainda depende de env/fallback frontend para chave, WhatsApp e precos; ideal centralizar em configuracao operacional.
- Nao existe gateway, upload de comprovante ou conciliacao automatica de pagamento.
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
