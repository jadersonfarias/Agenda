# Project Context

## Visao Geral
Monorepo fullstack para agendamento servicos, com area publica de reservas e area administrativa autenticada. O projeto e multi-tenant por `Business`: servicos, clientes e agendamentos pertencem a um negocio.

## Estrutura Resumida
```text
/
├─ frontend/
│  ├─ app/
│  │  ├─ page.tsx                 # pagina publica de agendamento
│  │  ├─ login/                   # login admin
│  │  ├─ admin/                   # dashboard admin
│  │  └─ api/admin/               # route handlers do admin
│  ├─ components/
│  │  ├─ ui/                      # button, input, card, calendar/date picker
│  │  └─ admin/                   # painel admin
│  ├─ features/admin/
│  │  ├─ repositories/            # acesso Prisma no frontend server-side
│  │  ├─ services/                # regras do admin
│  │  ├─ schemas/                 # zod do admin
│  │  └─ types.ts
│  ├─ lib/                        # auth NextAuth, prisma client
│  └─ types/                      # augmentations TS/NextAuth
├─ backend/
│  ├─ src/
│  │  ├─ appointments/            # controller/service/repository/schema
│  │  ├─ auth/                    # login via email+senha
│  │  ├─ businesses/              # servicos e disponibilidade
│  │  ├─ scheduling/              # timezone + cache de disponibilidade
│  │  ├─ prisma/                  # PrismaModule/Service
│  │  └─ app.module.ts
│  ├─ prisma/
│  │  ├─ schema.prisma            # modelo de dados
│  │  ├─ migrations/
│  │  └─ seed.js
├─ scripts/                       # helpers para ambiente/dev
├─ docker-compose.yml
└─ README.md
```

## Tecnologias
- Frontend: Next.js App Router, React 18, TypeScript, Tailwind CSS.
- Forms/validacao: React Hook Form + Zod.
- Data fetching client: TanStack Query.
- Auth frontend: NextAuth com `CredentialsProvider`.
- Backend: NestJS + TypeScript.
- Banco: PostgreSQL + Prisma ORM.
- Datas/fusos: `date-fns`, `react-day-picker`, `luxon`.
- Feedback UI: `react-hot-toast`.

## Arquitetura
### Monorepo
- `frontend` e `backend` sao workspaces separados.
- Script raiz sobe frontend Next, backend Nest e banco via Docker.

### Backend
- Padrao em camadas: `Controller -> Service -> Repository -> Prisma`.
- `Controller`: valida entrada HTTP e traduz erros.
- `Service`: regras de negocio.
- `Repository`: queries Prisma.
- `SchedulingModule`: logica transversal de timezone e cache.

### Frontend
- App Router com paginas server/client.
- UI publica em `frontend/app/page.tsx`.
- Admin misto:
  - pagina server-side carrega sessao e dados iniciais;
  - componente client gerencia formularios e interacoes.
- Existe uma camada local de dominio em `features/admin/services` e `features/admin/repositories`.

## Modelos Principais
- `User`: dono/admin autenticavel.
- `Business`: tenant principal; possui `slug`, `timezone`, horario de funcionamento.
- `Service`: servico oferecido pelo negocio.
- `Customer`: cliente unico por telefone dentro do negocio.
- `Appointment`: agendamento com `scheduledAt`, `endsAt`, `status`.

## Features Principais
### Area publica
- Lista servicos de um negocio.
- Consulta disponibilidade por servico + data.
- Cria agendamento.
- Lista proximos agendamentos do negocio.

### Area admin
- Login por email/senha.
- Carrega negocio gerenciado pelo usuario autenticado.
- Lista servicos com contagem de agendamentos.
- Cria, edita e remove servicos.
- Atualiza horario de funcionamento do negocio.
- Bloqueia exclusao de servico com agendamentos.

## Fluxos Principais
### 1. Agendamento publico
1. Frontend busca `GET /businesses/:businessId/services`.
2. Usuario escolhe servico e data.
3. Frontend busca `GET /businesses/:businessId/availability?serviceId=...&date=YYYY-MM-DD`.
4. Usuario escolhe horario e envia.
5. Frontend chama `POST /appointments`.
6. Backend valida negocio, servico, data/hora, conflito e cliente.
7. Backend cria/recicla `Customer`, cria `Appointment` e invalida cache de disponibilidade.

### 2. Consulta de disponibilidade
1. Backend resolve negocio por `id` ou `slug`.
2. Valida faixa de data via timezone do negocio.
3. Calcula janela UTC entre abertura e fechamento.
4. Busca agendamentos nao cancelados no intervalo.
5. Gera slots por duracao do servico.
6. Remove slots com conflito.
7. Cacheia resultado em memoria por curto TTL.

### 3. Login admin
1. Pagina `/login` usa `signIn('credentials')`.
2. NextAuth chama `authorize`.
3. `authorize` faz `POST /auth/login` no backend.
4. Backend valida email/senha com bcrypt.
5. NextAuth salva sessao JWT e injeta `user.id` em token/session.

### 4. Gestao admin de servicos
1. Pagina `/admin` exige sessao.
2. Server component chama `getAdminDashboardData(session.user.id)`.
3. Service local encontra o `Business` do owner e lista servicos via Prisma.
4. Formularios client chamam `app/api/admin/...`.
5. Route handlers validam sessao e delegam para `features/admin/services`.
6. Services executam regras, usam Prisma via repository e chamam `revalidatePath('/admin')`.

## Autenticacao
- Implementada no frontend com NextAuth.
- Estrategia de sessao: `jwt`.
- Provider: `CredentialsProvider`.
- Fonte de verdade das credenciais: backend Nest (`/auth/login`).
- Sessao protege `/admin` e rotas `app/api/admin/*`.
- O backend principal nao expoe JWT proprio; ele apenas valida credenciais e retorna usuario basico.

## Comunicacao Frontend x Backend
### Publico
- Comunicacao HTTP direta do browser para o backend via `NEXT_PUBLIC_API_URL`.
- Endpoints usados:
  - `GET /businesses/:businessId/services`
  - `GET /businesses/:businessId/availability`
  - `GET /appointments`
  - `POST /appointments`

### Admin
- Nao depende do backend Nest para CRUD de servicos.
- Fluxo: componente client -> `app/api/admin/*` -> service local -> repository local -> Prisma.
- Excecao: autenticacao admin, que depende do backend `/auth/login`.

## Padroes e Convencoes
- Backend:
  - repository pattern;
  - service layer;
  - modules do Nest;
  - validacao com Zod dentro de controllers/schemas;
  - Prisma como acesso a dados;
  - services transversais para timezone/cache.
- Frontend:
  - React Hook Form + Zod para formularios;
  - TanStack Query para leitura/mutacao na area publica;
  - server components para gate de sessao e preload inicial;
  - route handlers para operacoes admin;
  - camada `features/*` para separar dominio da UI.

## Regras de Negocio Relevantes
- `Business` pode ser encontrado por `id` ou `slug`.
- Disponibilidade e criacao de agendamento respeitam `timezone` do negocio.
- Nao permite passado nem datas alem de 30 dias.
- Conflito de horario ignora agendamentos `CANCELED`.
- `Customer` e deduplicado por `businessId + phone`.
- Alteracoes em agendamentos invalidam cache de disponibilidade.
- Servico com agendamentos nao pode ser excluido no admin.

## Variaveis de Ambiente Importantes
- `DATABASE_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_DEFAULT_BUSINESS_ID`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

## Observacoes de Projeto
- O sistema mistura dois estilos de backend:
  - backend Nest para area publica e login;
  - backend interno do Next/Prisma para admin.
- Isso reduz round-trips no admin, mas duplica fronteiras de negocio/acesso a dados.
- O `seed.js` cria dados iniciais para uso local.
