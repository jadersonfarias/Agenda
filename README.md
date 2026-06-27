# MarcaCerta

Monorepo fullstack para agendamento de serviços com:

- site público para reservas online
- área admin autenticada por negócio
- área admin master da plataforma
- suporte a multi-business com isolamento por `businessId`

## Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Estado e formulários: TanStack Query, React Hook Form, Zod
- Autenticação frontend: NextAuth
- Backend: NestJS, TypeScript
- Banco: PostgreSQL + Prisma
- Datas: Luxon

## Estrutura

```text
frontend/
  app/
  components/
  features/
  lib/

backend/
  src/
  prisma/

scripts/
```

## Rotas principais

Públicas:

- `/`
- `/signup`
- `/login`
- `/b/[slug]`
- `/appointments/[token]`
- `/meus-agendamentos`
- `/invite/[token]`

Administrativas:

- `/admin`
- `/admin-master`

## Variáveis de ambiente

Crie um arquivo `.env` na raiz com pelo menos:

```env
DATABASE_URL="postgresql://DB_USER:DB_PASSWORD@DB_HOST:5432/DB_NAME?schema=public"
NEXT_PUBLIC_API_URL="/backend"
API_URL="http://127.0.0.1:3333"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="GERAR_SEGREDO_FORTE_E_ALEATORIO"
JWT_SECRET="GERAR_OUTRO_SEGREDO_FORTE_E_ALEATORIO"
FRONTEND_URL="http://localhost:3000"
ALLOWED_ORIGINS="http://localhost:3000"
HOST="0.0.0.0"
NEXT_PUBLIC_PIX_KEY="SUA_CHAVE_PIX_PUBLICA"
NEXT_PUBLIC_SUPPORT_WHATSAPP="55DDDNUMERO"
NEXT_PUBLIC_BASIC_PRICE="R$ 00,00/mês"
NEXT_PUBLIC_PRO_PRICE="R$ 00,00/mês"
```

Resumo:

- `DATABASE_URL`: conexão PostgreSQL usada pelo Prisma/backend.
- `NEXT_PUBLIC_API_URL`: URL da API acessível pelo navegador; pode ser `/backend` quando usar o proxy do Next.js.
- `API_URL`: URL interna da API usada no server-side do Next.js e no proxy.
- `NEXTAUTH_URL`: URL pública final do frontend.
- `NEXTAUTH_SECRET`: segredo forte do NextAuth.
- `JWT_SECRET`: segredo forte e diferente para os tokens do backend.
- `FRONTEND_URL`: URL pública usada pelo backend para links.
- `ALLOWED_ORIGINS`: origens extras permitidas no CORS, separadas por vírgula.
- `HOST`: interface de rede usada pelo backend.
- Variáveis `NEXT_PUBLIC_PIX_*`/preços: dados públicos exibidos no fluxo manual de assinatura.

`NEXT_PUBLIC_DEFAULT_BUSINESS_ID` foi removida da documentação porque não é usada pelo runtime atual.

## Como rodar localmente

1. Instale as dependências:

```bash
npm install
```

2. Suba o banco:

```bash
npm run db:up
```

3. Gere/aplique o Prisma se necessário:

```bash
npm --workspace=backend run prisma:generate
npm --workspace=backend run prisma:push
```

4. Opcionalmente rode a seed:

```bash
npm run seed
```

5. Inicie o projeto:

```bash
npm run dev
```

## Comandos úteis

```bash
npm run dev
npm run dev:stop
npm run db:up
npm run db:down
npm run db:logs
npm run seed
npm run build
npm --workspace=frontend run build
npm --workspace=backend run build
npm --workspace=backend run test
```

## Teste no celular com ngrok

O projeto já tem um fluxo pronto para abrir o frontend no smartphone:

```bash
npm run mobile
```

Esse comando:

- sobe um túnel `ngrok` para a porta `3000`
- atualiza o `.env.ngrok` com a URL pública
- inicia frontend e backend no modo correto

Para parar:

```bash
Ctrl + C
```

Se quiser limpar os processos manualmente:

```bash
npm run dev:stop
```

## Endpoints principais

Auth:

- `POST /auth/login`
- `POST /auth/register-business-owner`

Públicos:

- `GET /businesses/:businessId`
- `GET /businesses/slug/:slug`
- `GET /businesses/:businessId/services`
- `GET /businesses/:businessId/availability`
- `GET /appointments/customer`
- `GET /appointments/public/:token`
- `POST /appointments`
- `PATCH /appointments/public/:token/cancel`

Admin:

- `GET /admin/dashboard`
- `GET /admin/services`
- `POST /admin/services`
- `PATCH /admin/services/:id`
- `DELETE /admin/services/:id`
- `GET /admin/appointments`
- `PATCH /admin/appointments/:id/status`
- `PATCH /admin/appointments/:id/assignee`
- `GET /admin/memberships`
- `GET /admin/invitations`
- `GET /admin/financial-summary`

Platform:

- `GET /platform/health`
- `GET /platform/businesses`
- `PATCH /platform/businesses/:businessId/subscription`
- `PATCH /platform/businesses/:businessId/cancel-subscription`
- `PATCH /platform/businesses/:businessId/mark-past-due`

## Regras importantes

- O backend segue `Controller -> Service -> Repository`.
- O frontend não acessa Prisma diretamente.
- Toda regra administrativa deve respeitar o `businessId`.
- Um usuário pode participar de mais de um negócio.
- O admin master exige `session.user.isPlatformAdmin === true`.

## Observações

- O visual público usa a identidade MarcaCerta.
- O backend usa `FRONTEND_URL` com fallback para `NEXTAUTH_URL` em links públicos.
- O fluxo de assinatura é manual e bloqueia escritas quando trial/plano está vencido além da tolerância configurada; leituras permanecem disponíveis.
- Antes de publicar, siga [docs/MVP_PRODUCTION_CHECKLIST.md](docs/MVP_PRODUCTION_CHECKLIST.md).
