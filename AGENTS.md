# AGENTS.md

## Idioma

Responda e explique sempre em português do Brasil.

## Projeto

Este é um monorepo fullstack de agendamento de serviços.

A aplicação possui:
- Área pública para reservas
- Área admin autenticada
- Suporte a multi-business
- Isolamento de dados por businessId

## Stack

Frontend:
- Next.js App Router
- React
- TypeScript
- Tailwind
- TanStack Query
- React Hook Form
- Zod
- Axios
- NextAuth

Backend:
- NestJS
- TypeScript
- Prisma
- PostgreSQL
- Luxon
- JWT/Auth middleware

Infra:
- Docker / Docker Compose
- PostgreSQL em container

## Regras principais

- Não refatore fora do escopo solicitado.
- Não remova código existente sem necessidade.
- Faça mudanças pequenas, seguras e fáceis de revisar.
- Antes de alterar schema Prisma, explique por que é necessário.
- Não quebre endpoints existentes.
- Preserve compatibilidade com o fluxo atual.
- Sempre respeite o isolamento por businessId.
- Nunca permitir que um usuário acesse dados de outro business.

## Backend

- Controller recebe a requisição.
- Service aplica regra de negócio.
- Repository acessa o Prisma.
- Não acessar Prisma diretamente em controller.
- Usar exceptions do NestJS.
- Evitar overfetching.
- Preferir select quando não precisar de relations completas.
- Paginar listagens administrativas.
- Validar permissões antes de consultar ou alterar dados sensíveis.

## Frontend

- Usar TanStack Query para chamadas de API.
- Usar React Hook Form + Zod para formulários.
- Evitar useEffect desnecessário.
- Criar componentes reutilizáveis.
- Manter responsividade para computador, tablet e smartphone.
- Não misturar regra de negócio pesada dentro de componente visual.

## Multi-business

- Um usuário pode ter mais de um business.
- O usuário só pode acessar businesses dos quais é dono.
- O frontend deve trabalhar com um business atual selecionado.
- Toda chamada administrativa deve considerar o businessId atual.
- Se houver apenas um business, selecionar automaticamente.
- Se houver mais de um, permitir escolha no painel admin.

## Comandos úteis

Instalar dependências:
npm install

Rodar projeto:
npm run dev

Rodar banco:
docker compose up -d

Parar containers:
docker compose down

Rodar migrations Prisma:
npm --workspace=backend run prisma:migrate

Rodar seed:
npm run seed

## Antes de finalizar uma tarefa

Sempre que possível:
- Rode lint/typecheck/build se existirem scripts disponíveis.
- Informe quais arquivos foram alterados.
- Informe se algo não pôde ser testado.
- Não invente que testou algo se não rodou.