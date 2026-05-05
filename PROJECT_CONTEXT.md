# Project Context

## Visao Geral
Monorepo fullstack para agendamento de servicos com area publica de reservas e area administrativa autenticada. O sistema e multi-tenant por `Business`: servicos, clientes, memberships, bloqueios manuais e agendamentos pertencem a um negocio.

## Estrutura Resumida
```text
/
├─ frontend/
│  ├─ app/
│  │  ├─ page.tsx                              # pagina publica de agendamento
│  │  ├─ login/                                # login admin
│  │  ├─ admin/                                # dashboard admin
│  │  ├─ api/auth/[...nextauth]/route.ts       # NextAuth App Router
│  │  └─ api/admin/                            # route handlers server-side do admin
│  │     ├─ route.ts                           # dashboard inicial
│  │     ├─ services/                          # CRUD parcial de servicos
│  │     ├─ appointments/                      # proxy de agendamentos/status
│  │     ├─ financial-summary/                 # resumo financeiro
│  │     └─ availability/                      # atualizacao de horario do negocio
│  ├─ components/
│  │  ├─ ui/                                   # button, input, card, modal, table, calendar
│  │  └─ admin/                                # painel administrativo client-side
│  ├─ features/admin/
│  │  ├─ hooks/                                # hooks TanStack Query
│  │  ├─ repositories/                         # camada local Prisma do admin
│  │  ├─ services/                             # regras e fetchers do admin
│  │  ├─ schemas.ts                            # zod do admin
│  │  └─ types.ts
│  ├─ lib/
│  │  ├─ auth.ts                               # config NextAuth
│  │  ├─ api.ts                                # client Axios com token da session
│  │  ├─ prisma.ts                             # PrismaClient usado no frontend server-side
│  │  └─ access-token.ts                       # utilitario local de token
│  └─ types/                                   # augmentations TS/NextAuth
├─ backend/
│  ├─ src/
│  │  ├─ admin/                                # modulo admin Nest
│  │  ├─ appointments/                         # controller/service/repository/schema
│  │  ├─ auth/                                 # login, JWT, middleware, role guard
│  │  ├─ businesses/                           # servicos, disponibilidade, clientes ativos
│  │  ├─ common/                               # helpers comuns como paginacao
│  │  ├─ prisma/                               # PrismaModule/PrismaService
│  │  ├─ scheduling/                           # timezone + cache de disponibilidade
│  │  └─ app.module.ts
│  ├─ prisma/
│  │  ├─ schema.prisma                         # modelo de dados
│  │  ├─ migrations/
│  │  └─ seed.ts
├─ scripts/                                    # helpers de ambiente/dev
├─ docker-compose.yml
└─ README.md
```

## Tecnologias
- Frontend: Next.js App Router, React 18, TypeScript, Tailwind CSS.
- Estado e data fetching client-side: TanStack Query.
- Auth frontend: NextAuth com `CredentialsProvider`.
- HTTP frontend: `fetch` nos route handlers e fetchers do admin; existe `frontend/lib/api.ts` com Axios configurado para uso com session JWT.
- Backend: NestJS + TypeScript.
- Banco: PostgreSQL + Prisma ORM.
- Datas/fusos: `date-fns`, `react-day-picker`, `luxon`.
- Feedback UI: `react-hot-toast`.

## Arquitetura
### Monorepo
- `frontend` e `backend` sao workspaces separados.
- O script raiz sobe frontend Next, backend Nest e Postgres via Docker Compose.

### Backend
- Padrao em camadas: `Controller -> Service -> Repository -> Prisma`.
- `AuthModule`: login por email/senha, emissao e validacao de JWT, middleware de autenticacao, `@Roles` e `RoleGuard`.
- `AdminModule`: endpoint autenticado e paginado para listagem de servicos por business.
- `AppointmentsModule`: criacao/listagem/atualizacao de agendamentos e resumo de faturamento mensal.
- `BusinessesModule`: servicos publicos de servicos/disponibilidade e query de clientes ativos.
- `SchedulingModule`: timezone e cache em memoria da disponibilidade.

### Frontend
- App Router com paginas server/client.
- `page.tsx` publica consulta servicos, disponibilidade e cria agendamento diretamente contra o backend Nest.
- `/admin` usa server component para validar session e carregar dados iniciais.
- `components/admin/AdminPanel.tsx` usa TanStack Query para servicos, resumo financeiro e agendamentos.
- A area admin ainda e hibrida:
  - parte das operacoes passa por `frontend/app/api/admin/*`;
  - parte dessas rotas usa services/repositorios locais com Prisma no frontend server-side;
  - outra parte faz proxy para o backend Nest.

## Modelos Principais
- `User`: usuario autenticavel.
- `Membership`: ligacao entre `User` e `Business` com `role` (`OWNER`, `ADMIN`, `STAFF`).
- `Business`: tenant principal com `slug`, `timezone`, horario e memberships.
- `ManualBlock`: bloqueio manual de agenda por intervalo (`startsAt`, `endsAt`).
- `Service`: servico oferecido pelo negocio.
- `Customer`: cliente unico por telefone dentro do negocio, com `lastVisitAt`.
- `Appointment`: agendamento com `scheduledAt`, `endsAt`, `status`, `price` e `completedAt`.

## Features Principais
### Area publica
- Lista servicos de um negocio.
- Consulta disponibilidade por servico + data.
- Considera agendamentos e bloqueios manuais no calculo da disponibilidade.
- Cria agendamento.
- Lista agendamentos de um negocio.

### Area admin
- Login por email/senha com NextAuth + backend Nest.
- Carrega dashboard inicial server-side.
- Lista servicos com contagem de agendamentos.
- Cria, edita e remove servicos.
- Atualiza horario de funcionamento do negocio.
- Atualiza status de agendamento.
- Consulta resumo financeiro mensal.
- Aplica regras de permissao por membership/role no token.

## Fluxos Principais
### 1. Agendamento publico
1. Frontend busca `GET /businesses/:businessId/services` no backend Nest.
2. Usuario escolhe servico e data.
3. Frontend busca `GET /businesses/:businessId/availability?serviceId=...&date=YYYY-MM-DD`.
4. Backend calcula disponibilidade considerando:
   - horario do negocio;
   - appointments nao cancelados;
   - manual blocks;
   - timezone do business.
5. Usuario escolhe horario e envia.
6. Frontend chama `POST /appointments`.
7. Backend valida negocio, servico, data/hora, conflito e cliente.
8. Backend cria/atualiza `Customer`, cria `Appointment` e invalida cache.

### 2. Login admin
1. Pagina `/login` usa `signIn('credentials')`.
2. NextAuth chama `authorize` em `frontend/lib/auth.ts`.
3. `authorize` faz `POST /auth/login` no backend Nest.
4. Backend valida email/senha com bcrypt.
5. `AccessTokenService` gera JWT com memberships do usuario.
6. NextAuth salva `accessToken` no token e na session.

### 3. Dashboard admin
1. Server component `/admin` chama `getServerSession(authOptions)`.
2. Se autenticado, chama `getAdminDashboardData(session.user.id)`.
3. `getAdminDashboardData` usa service local do frontend.
4. O service local resolve business/servicos via repository local Prisma.
5. `AdminPanel` recebe `initialData` e reidrata consultas com TanStack Query.

### 4. Operacoes admin de servico
1. O client chama route handlers em `frontend/app/api/admin/services/*`.
2. O handler valida session NextAuth.
3. Em `POST` e `DELETE`, o handler decodifica memberships do `accessToken`.
4. Parte das operacoes usa Prisma local no frontend server-side.
5. Parte das operacoes usa services locais do frontend (`features/admin/services/admin.service.ts`).
6. Os dados sao revalidados com `revalidatePath('/admin')`.

### 5. Operacoes admin de appointment
1. O client chama `frontend/app/api/admin/appointments/*`.
2. O handler valida session.
3. `GET /api/admin/appointments` faz proxy para `GET /appointments` no backend Nest.
4. `PATCH /api/admin/appointments/:id/status` faz proxy autenticado para o backend Nest com `Authorization: Bearer <accessToken>`.

## Autenticacao
- Frontend usa NextAuth com estrategia de session `jwt`.
- O provider e `CredentialsProvider`.
- `frontend/lib/auth.ts` usa `NEXTAUTH_SECRET`.
- O backend usa `JWT_SECRET` no `JwtModule`.
- O backend e a fonte de verdade para login (`POST /auth/login`).
- `AuthMiddleware` resolve `request.user` e `request.businessId` a partir do JWT.
- `RoleGuard` aplica permissao por `businessId` e role da membership.

## Comunicacao Frontend x Backend
### Publico
- Fluxo predominante: `Frontend -> HTTP direto -> Backend Nest -> Prisma`.
- O frontend usa `NEXT_PUBLIC_API_URL` para chamar o backend.
- Endpoints usados:
  - `GET /businesses/:businessId/services`
  - `GET /businesses/:businessId/availability`
  - `GET /appointments`
  - `POST /appointments`

### Admin
- Fluxo atual e misto.
- Parte 1:
  `Client component -> frontend/app/api/admin/* -> Prisma local no frontend`
- Parte 2:
  `Client component -> frontend/app/api/admin/* -> Backend Nest -> Prisma`
- Parte 3:
  `Server component -> features/admin/services -> features/admin/repositories -> Prisma local no frontend`
- Existe um client Axios em `frontend/lib/api.ts` configurado com session JWT, mas o fluxo principal do admin hoje usa `fetch`.

## Modulos Backend
### Admin
- `backend/src/admin/admin.controller.ts`
- `backend/src/admin/admin.service.ts`
- `backend/src/admin/admin.repository.ts`
- Endpoint atual:
  - `GET /admin/services`
- Usa `AuthMiddleware`, `RoleGuard` e `@Roles`.
- Aceita `page` e `perPage` para paginacao.

### Appointments
- Lista agendamentos com `statusFilter`.
- Atualiza status com `completedAt`.
- Atualiza `lastVisitAt` do cliente quando appointment e concluido ou quando um concluido e removido.
- Calcula faturamento mensal considerando apenas `COMPLETED` e somando `price`.

### Businesses
- Lista servicos publicos.
- Calcula disponibilidade com cache.
- Busca clientes ativos dos ultimos 30 dias.
- Considera bloqueios manuais (`ManualBlock`) na agenda.

## Frontend Admin
### Dados e estado
- `components/providers.tsx` cria `QueryClient`.
- Hooks:
  - `useAdminServicesQuery`
  - `useAdminAppointmentsQuery`
  - `useAdminMonthlySummaryQuery`
- Fetchers em `features/admin/services/admin-api.service.ts`.

### Route Handlers
- `frontend/app/api/admin/route.ts`: dashboard inicial.
- `frontend/app/api/admin/services/route.ts`: `GET` e `POST`.
- `frontend/app/api/admin/services/[serviceId]/route.ts`: `PATCH` e `DELETE`.
- `frontend/app/api/admin/appointments/route.ts`: proxy de listagem para o backend Nest.
- `frontend/app/api/admin/appointments/[appointmentId]/status/route.ts`: proxy autenticado de update status.
- `frontend/app/api/admin/financial-summary/route.ts`: resumo financeiro usando service local Prisma.
- `frontend/app/api/admin/availability/route.ts`: atualizacao de horario do negocio.

## Regras de Negocio Relevantes
- `Business` pode ser encontrado por `id` ou `slug`.
- Disponibilidade respeita `timezone`, horario do negocio, appointments nao cancelados e bloqueios manuais.
- Nao permite passado nem datas alem de 30 dias no agendamento publico.
- `Customer` e deduplicado por `businessId + phone`.
- `Customer.lastVisitAt` e sincronizado a partir do appointment concluido mais recente.
- `Membership` e unica por `userId + businessId`.
- `OWNER`, `ADMIN` e `STAFF` recebem escopos diferentes nos handlers do admin.
- Servico com agendamentos nao pode ser excluido.

## Variaveis de Ambiente Importantes
- `DATABASE_URL`
- `NEXT_PUBLIC_API_URL`
- `API_URL`
- `NEXT_PUBLIC_DEFAULT_BUSINESS_ID`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `JWT_SECRET`

## Observacoes de Projeto
- O codigo atual ainda nao esta totalmente separado entre frontend e backend.
- O backend Nest ja concentra:
  - autenticacao JWT;
  - disponibilidade publica;
  - appointments;
  - faturamento mensal;
  - modulo admin paginado.
- O frontend ainda mantem:
  - route handlers `app/api/admin`;
  - service layer local;
  - repository local com Prisma para parte do admin.
- O `PROJECT_CONTEXT.md` deve ser tratado como retrato do codigo atual, nao como arquitetura alvo.


## AGENT CONTROL

### MODO DE RESPOSTA
- Prioridade absoluta: gerar código
- Não gerar documentação (.md) sem solicitação explícita
- Não explicar o sistema
- Não criar resumos

### OUTPUT
- Responder apenas com código
- Sempre informar:
  - caminho do arquivo
  - código final
- Não adicionar textos longos
- Explicações: máximo 2 linhas

### FOCO
- Alterar apenas o necessário
- Reutilizar código existente
- Evitar refatorações desnecessárias

### BACKEND RULES
- Sempre usar JWT_SECRET no backend
- Nunca usar NEXTAUTH_SECRET no backend
- Seguir padrão Controller -> Service -> Repository

### FRONTEND RULES
- Usar TanStack Query para chamadas
- Usar Axios para comunicação com backend
- Proteger rotas com session

### PROIBIDO
- Criar documentação automática
- Reescrever código sem necessidade
- Alterar arquitetura sem pedido explícito
