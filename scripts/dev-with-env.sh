#!/usr/bin/env bash

set -euo pipefail

ENV_FILE="${1:-.env}"

if [ ! -f "$ENV_FILE" ]; then
  if [ "$ENV_FILE" = ".env.ngrok" ] && [ -f ".env.ngrok.example" ]; then
    cp .env.ngrok.example .env.ngrok
    echo "Arquivo .env.ngrok criado a partir de .env.ngrok.example"
    echo "Edite .env.ngrok com as URLs públicas do frontend e backend antes de rodar novamente."
    exit 0
  fi

  echo "Arquivo de ambiente não encontrado: $ENV_FILE"
  exit 1
fi

npm run dev:stop
npm run db:up

node --env-file="$ENV_FILE" ./node_modules/concurrently/dist/bin/concurrently.js \
  "npm --workspace=frontend run dev" \
  "npm --workspace=backend run start:dev"
