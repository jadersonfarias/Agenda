# Project Context

## Visao Geral
Monorepo fullstack da MarcaCerta para agendamento de servicos.

Possui:
- landing publica, demo visual e fluxo real de reserva publica;
- area admin autenticada por business;
- admin master da plataforma;
- suporte multi-business por `Business` e `Membership`;
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
    demo/page.tsx
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
    demo/*
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
    subscriptions/
  prisma/
    schema.prisma
    migrations/
    seed.ts
```

## Arquitetura
- Backend segue `Controller -> Service -> Repository -> Prisma`.
- Frontend nao usa Prisma diretamente.
- Auth backend usa JWT via `@nestjs/jwt` e `JWT_SECRET`.
- Auth frontend usa NextAuth e `NEXTAUTH_SECRET`.
- `AuthMiddleware` resolve `request.user` e `request.businessId`.
- `RoleGuard` valida role por `Membership`.
- `PlatformAdminGuard` valida `isPlatformAdmin`.
- Chamadas admin do frontend enviam `businessId` explicitamente.
- Um usuario pode ter mais de um business; o admin usa business atual selecionado.

## Rotas Frontend
- `/`: landing publica MarcaCerta com preview simples de demonstracao, sem depender de `Business` real
- `/demo`: demonstracao ficticia 100% frontend, visual/interativa e nao persistente
- `/signup`: cadastro publico real de dono + primeiro business
- `/login`: login com NextAuth
- `/admin`: painel admin do business
- `/admin-master`: painel master da plataforma
- `/b/[slug]`: fluxo real de reserva publica por slug
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

## Auth, Login e Senha
- Login real acontece no backend.
- Cadastro publico cria dono, business, membership `OWNER`, plano `BASIC`, status `TRIALING` e trial de 7 dias.
- Login aceita senha legada ja cadastrada; a regra forte vale para signup e aceite de convite.
- NextAuth guarda `accessToken`, `businesses`, `currentBusinessId` e `isPlatformAdmin`.
- Token backend carrega `sub`, `email`, `isPlatformAdmin`, `memberships`, `businesses` e `currentBusinessId`.
- Se o token admin expira, `frontend/lib/api.ts` e chamadas server-side redirecionam para `/login?reason=session-expired`.
- `/login?reason=session-expired` mostra: "Sua sessao expirou. Faca login novamente."
- Platform admin continua indo para `/admin-master`; usuario comum continua indo para `/admin`.
- Erro de credenciais no login mostra toast amigavel: "Email ou senha invalidos."
- Erro inesperado no login mostra mensagem generica, sem expor erro tecnico.
- Campos de senha usam `PasswordInput` com botao mostrar/ocultar e icone de olho/olho cortado.
- Checklist de senha mostra em tempo real: minimo 8 caracteres, maiuscula, minuscula, numero e simbolo.
- Nao salvar senha em storage e nao logar senha.

Regra de senha forte:
- minimo 8 caracteres;
- pelo menos uma letra maiuscula;
- pelo menos uma letra minuscula;
- pelo menos um numero;
- pelo menos um simbolo.

## Banco / Prisma
Modelos criticos:
- `User`, `Business`, `Membership`, `Invitation`
- `Service`, `Customer`, `Appointment`, `ManualBlock`

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
- Agendamentos antigos com `assignedToUserId = null` continuam funcionando para `OWNER`/`ADMIN`.

## Servicos
- `Service.description` e opcional (`String?`/nullable).
- Migration: `20260611120000_add_service_description`.
- SQL da migration: `ALTER TABLE "Service" ADD COLUMN "description" TEXT;`
- `description` pode ser `null`.
- String vazia e normalizada para `null`.
- Limite maximo: 300 caracteres.
- Servicos antigos continuam funcionando sem descricao.
- Criacao e edicao admin aceitam `description`.
- Validacao de criacao/edicao usa Zod.
- Listagem admin e publica retornam `description`.
- Formulario admin de criar/editar servico tem textarea opcional de descricao.
- Texto auxiliar explica que a descricao ajuda o cliente a entender o que esta incluso.
- Cards de servico no admin exibem descricao truncada quando existir.
- Pagina publica `/b/[slug]` mostra a descricao abaixo do nome do servico quando existir; se for `null`, nao mostra nada.

## Modal de Criar/Editar Servico
- Modal foi redesenhado visualmente no frontend.
- Cabecalho possui icone.
- Titulo muda entre criacao e edicao.
- Campos: nome, preco, duracao e descricao.
- Preco possui prefixo visual `R$`.
- Descricao e textarea opcional.
- Botoes: cancelar e criar/salvar.
- Mudanca e visual/frontend; backend e regra de servico nao foram alterados nessa etapa visual.
- Ha cuidado com responsividade e rolagem do modal em desktop/mobile.

## Disponibilidade Publica
- Disponibilidade publica retorna slots estruturados:

```ts
{
  time: string
  status: 'AVAILABLE' | 'BOOKED' | 'UNAVAILABLE'
}
```

Regras:
- `AVAILABLE`: horario livre e clicavel.
- `BOOKED`: horario ocupado por appointment existente.
- `BOOKED` nao expoe dados do cliente/agendamento.
- `UNAVAILABLE`: bloqueio manual, horario passado ou regra de disponibilidade.
- Pagina publica renderiza a grade completa.
- Horarios reservados aparecem em vermelho e nao sao clicaveis.
- Horarios indisponiveis aparecem cinza/desabilitados.
- Criacao de appointment valida conflito com appointments e `ManualBlock`.
- Cliente final ainda nao escolhe funcionario/responsavel.
- Responsavel continua sendo atribuido no admin por `OWNER`/`ADMIN`.
- Disponibilidade usa cache por `businessId/serviceId/date` e invalida ao alterar horarios, criar/cancelar/alterar agendamentos.

## Agenda por Funcionario
- `Appointment.assignedToUserId` e opcional.
- `OWNER` e `ADMIN` listam todos os agendamentos do business quando nao ha filtro por responsavel.
- `OWNER` e `ADMIN` podem filtrar por `assignedToUserId`.
- `STAFF` lista apenas agendamentos atribuidos a ele.
- `STAFF` nao consegue alterar status de agendamento atribuido a outro usuario.
- `OWNER` e `ADMIN` atribuem responsavel via `PATCH /admin/appointments/:id/assignee`.
- Assignee precisa ser membro do business.
- Cliente publico ainda nao escolhe funcionario.
- Agenda admin possui filtro por responsavel com dropdown customizado.
- Roles aparecem traduzidas visualmente: `OWNER -> Dono`, `ADMIN -> Administrador`, `STAFF -> Funcionario`.
- Valores internos continuam `OWNER`, `ADMIN` e `STAFF`.

## Filtros da Agenda
- Filtro de status existe: Todos, Agendado, Concluido, Cancelado.
- Filtro por responsavel existe para quem pode gerenciar responsavel: Todos os responsaveis e membros disponiveis.
- Dropdowns usam visual customizado, nao select nativo.
- Chevron gira ao abrir/fechar.
- Roles no filtro por responsavel aparecem em portugues.
- Valores internos e query continuam usando valores reais.
- Regras `STAFF`/`OWNER`/`ADMIN` continuam preservadas.

## Permissoes por Role
### UI admin atual
- `OWNER` ve overview/onboarding, agenda, servicos, financeiro, equipe, configuracoes e card Pix quando aplicavel.
- `ADMIN` ve agenda, servicos, financeiro, configuracoes e card Pix quando aplicavel.
- `STAFF` ve apenas agenda.
- `STAFF` nao ve servicos, financeiro, equipe, configuracoes, onboarding nem card Pix.
- Aba proibida redireciona visualmente para Agenda.
- Backend continua sendo a fonte real de seguranca.

### Backend atual
- Dashboard: `OWNER`, `ADMIN`, `STAFF`.
- Listagem admin de servicos: `OWNER`, `ADMIN`, `STAFF`.
- Criar/editar/excluir servico: `OWNER`, `ADMIN`.
- Horario do negocio: `OWNER`, `ADMIN`.
- Convites: `OWNER`.
- Membership create/update/delete: `OWNER`.
- Membership list: `OWNER`, `ADMIN`.
- Agenda e status de appointment: `OWNER`, `ADMIN`, `STAFF`, respeitando regra de atribuicao.
- Atribuir responsavel de appointment: `OWNER`, `ADMIN`.
- Financeiro: `OWNER`, `ADMIN`.

## Equipe / Membros
- Tela de equipe foi ajustada.
- `OWNER`/Dono nao e tratado como membro editavel.
- Dono pode aparecer como informacao visual, mas nao aparece como opcao editavel no select/dropdown.
- Dropdown de permissao mostra apenas:
  - Administrador -> envia `ADMIN`
  - Funcionario -> envia `STAFF`
- Dono foi removido apenas das opcoes editaveis.
- `OWNER` continua existindo no backend.
- Valores reais continuam `OWNER`, `ADMIN` e `STAFF`.
- Roles sao traduzidas apenas na UI: `OWNER -> Dono`, `ADMIN -> Administrador`, `STAFF -> Funcionario`.
- Listagens de memberships e invitations sao paginadas.

## Landing e Demo
- Landing `/` usa preview simples de demonstracao 100% frontend.
- Landing nao depende de `Business` real.
- Botao "Ver demonstracao" leva para `/demo`.
- `/demo` usa dados ficticios locais.
- `/demo` nao salva nada no banco.
- `/demo` nao chama endpoints de escrita.
- `/signup` e o fluxo real de cadastro.
- `/b/[slug]` e o fluxo real de reserva publica.
- Demo simula experiencia visual/interativa, sem criar `User`, `Business`, `Customer` ou `Appointment`.
- Etapa de data/horario da demo segue visualmente o fluxo real, sem escolha de funcionario pelo cliente.

## AdminHeader / Avatar
- Card superior do admin mostra avatar circular.
- Avatar tenta usar Gravatar a partir do e-mail.
- Se nao houver imagem ou falhar, usa iniciais.
- Role aparece traduzida visualmente.
- Card mostra usuario, e-mail, negocio atual, plano/status e botao Sair.
- Mudanca e frontend; nao altera auth, backend ou permissoes.
- Mobile deve ser compacto; desktop deve ser elegante e sem altura exagerada.

## Financeiro
- Faturamento baseado em appointments concluidos.
- Ticket medio baseado em concluidos.
- Clientes ativos/inativos seguem regra existente.
- Relatorio inclui cancelamentos do mes, receita por servico, top servicos e filtro por mes.
- Card principal de faturamento ganhou destaque.
- Cards secundarios mostram concluidos, ticket medio, clientes e cancelamentos.
- Seletor de mes foi melhorado.
- Estado vazio explica que faturamento aparece quando atendimentos sao marcados como concluidos.
- Existe atalho "Ver agenda" no estado vazio, quando disponivel.
- Mudanca e visual/frontend; calculos e endpoints nao foram alterados nessa etapa visual.

## Visao Geral / Card de Agendamentos
- Card de resumo mostra total de agendamentos.
- Mostra frase contextual, por exemplo: "7 ainda aguardam atendimento."
- Botao "Ver agenda" leva para aba Agenda.
- Mostra cards compactos: Agendados, Concluidos e Cancelados.
- Visual inspirado em dashboard SaaS.
- Mudanca e visual/frontend; calculos nao foram alterados.

## Horarios Disponiveis do Negocio
- `openTime` e `closeTime` continuam em `HH:mm`.
- Backend continua recebendo `HH:mm`.
- UI usa campos personalizados para abertura e encerramento.
- Atalhos de abertura: `06:00`, `07:00`, `08:00`, `09:00`.
- Atalhos de fechamento: `17:00`, `18:00`, `19:00`, `20:00`.
- Abertura precisa ser menor que encerramento.
- Horarios invalidos mostram mensagem amigavel.
- Mudanca e frontend/UI.

## Assinatura / Bloqueio de Escrita
- `GRACE_PERIOD_DAYS = 1`.
- Plano/trial vencido alem da tolerancia bloqueia acoes de escrita.
- Mensagem: "Plano expirado. Regularize sua assinatura para continuar."
- Leituras continuam permitidas.
- Escritas sensiveis chamam `SubscriptionService.assertBusinessCanWrite`.

Acoes bloqueadas no codigo atual:
- criar, editar e excluir servico;
- atualizar horario do business;
- criar convite;
- criar membership;
- aceitar convite, pois cria membership;
- criar agendamento publico;
- alterar status de appointment;
- atribuir responsavel de appointment;
- cancelar appointment publico, pois altera status.

Observacao: `PATCH /admin/memberships/:id` e `DELETE /admin/memberships/:id` nao chamam `assertBusinessCanWrite` no codigo atual.

## Performance e Seguranca
- Rotas publicas sensiveis usam rate limit simples global:
  - consulta por telefone de appointment;
  - detalhe/cancelamento publico de appointment por token;
  - criacao publica de appointment;
  - detalhe/aceite de convite por token.
- `appointments.repository.findById` usa `select` minimo para fluxos de status/delete/assignee.
- `appointments.repository.updateStatus` usa `updateMany` com filtro por `id` e `businessId`.
- `findByPublicToken` seleciona apenas dados necessarios para resposta publica e cancelamento.
- Consulta publica `GET /appointments/customer` exige `businessId`, usa candidatos exatos de telefone dentro do business e evita varredura ampla normalizando todos os clientes em memoria.

## Frontend Admin
- `frontend/app/admin/page.tsx` carrega sessao, dashboard inicial e appointments iniciais.
- `frontend/components/admin/AdminPanel.tsx` concentra overview/onboarding, services, appointments, availability, financial, team e business switcher.
- Hooks e chamadas ficam em `frontend/features/admin/*`.
- Agenda mostra responsavel pelo atendimento ou "Sem responsavel".
- Query key da agenda usa `businessId`, `statusFilter` e `assignedToUserId`.
- `TeamSection` consome memberships e invitations paginados.
- Se trial/plano estiver vencido ou status for `PAST_DUE`/`CANCELED`, mostra card Pix manual quando a role tem permissao.

## Frontend Admin Master
- Rota: `frontend/app/admin-master/page.tsx`.
- Acesso: somente `session.user.isPlatformAdmin`.
- UI principal: `frontend/components/platform/PlatformBusinessesSection.tsx`.
- Gerencia plano/status com `PlatformBusinessSubscriptionManager.tsx`.
- Chamadas em `frontend/features/platform/services/platform-api.service.ts`.
- `/admin-master` consome apenas a pagina atual de `GET /platform/businesses`.
- UI mostra pagina atual, total de clientes e total de paginas; nao busca todas as paginas em paralelo.

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
- `NEXT_PUBLIC_DEFAULT_BUSINESS_ID`, se ainda usado
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `JWT_SECRET`
- `FRONTEND_URL`
- `ALLOWED_ORIGINS`
- `HOST`, opcional no backend
- `NEXT_PUBLIC_PIX_KEY`
- `NEXT_PUBLIC_SUPPORT_WHATSAPP`
- `NEXT_PUBLIC_BASIC_PRICE`
- `NEXT_PUBLIC_PRO_PRICE`

Config atual de CORS:
- Backend usa `buildCorsOptions`.
- Em desenvolvimento, localhost e 127.0.0.1 sao permitidos.
- Em producao, origins precisam estar em `FRONTEND_URL` ou `ALLOWED_ORIGINS`.
- Requisicoes sem header `Origin` continuam permitidas.

Comandos uteis:
- `npm run dev`
- `npm run dev:ngrok`
- `npm run build`
- `npm run seed`
- `npm --workspace=frontend run build`
- `npm --workspace=backend run build`
- `npm --workspace=backend run test`
- `npm --workspace=backend run prisma:migrate`

## Validacoes Recentes Conhecidas
Registro historico informado no projeto:
- backend tests passando com cerca de 110 testes apos descricao de servico;
- backend build passou;
- frontend `tsc` passou;
- frontend build passou fora do sandbox;
- builds frontend no sandbox podem falhar por limitacao conhecida do Turbopack/`Operation not permitted`.

Nao trate estes itens como testes executados na tarefa atual sem rodar novamente.

## Pendencias / Pode Ficar Para Depois
- Gateway de pagamento.
- Upload de comprovante.
- Conciliacao automatica de Pix.
- Upload manual de foto de perfil.
- Resumo diario por email com Resend.
- Automacao de cobranca.
- Fluxo completo de multi-business fora do painel admin.
- Cliente escolher profissional no fluxo publico.
- Relatorios avancados.
- Notificacoes automaticas por WhatsApp/e-mail.
- Revisar se update/delete de membership tambem devem ser bloqueados por assinatura vencida.
- Alguns endpoints em `/appointments` usam apenas `businessId` por query/body e nao passam por `AuthMiddleware`; revisar antes de producao.
- Seed cria usuarios com senha `password123`; nao usar seed/credenciais de dev em producao.
- Criacao direta de membro por email ainda depende de usuario existente; convite cobre criacao de usuario novo.
- Reiniciar backend apos adicionar rotas novas; ja houve caso de processo antigo nao refletir rota nova.

## Convencoes
- Nao acessar Prisma diretamente em controller.
- Manter isolamento por `businessId`.
- Validar permissao antes de ler/alterar dados sensiveis.
- Frontend deve usar Axios + TanStack Query para chamadas admin.
- Formularios devem usar React Hook Form + Zod quando aplicavel.
- Evitar refatoracao fora do escopo.
- Nao marcar como implementado o que ainda e apenas ideia.
