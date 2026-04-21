FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
COPY frontend/tsconfig.json ./frontend/tsconfig.json
COPY frontend/next.config.mjs ./frontend/next.config.mjs
COPY frontend/postcss.config.js ./frontend/postcss.config.js
COPY frontend/tailwind.config.ts ./frontend/tailwind.config.ts
COPY frontend/next-env.d.ts ./frontend/next-env.d.ts
COPY frontend/app ./frontend/app
COPY frontend/components ./frontend/components
COPY frontend/lib ./frontend/lib
COPY frontend/types ./frontend/types

RUN npm install

ARG NEXT_PUBLIC_API_URL=http://backend:3333
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=uma_chave_secreta_alterar
ENV NODE_ENV=production

RUN npm --workspace=frontend run build

EXPOSE 3000
CMD ["npm","--workspace=frontend","run","start"]
