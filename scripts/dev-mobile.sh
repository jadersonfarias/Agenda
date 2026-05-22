#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.ngrok"
ENV_EXAMPLE_FILE="$ROOT_DIR/.env.ngrok.example"
NGROK_PID_FILE="/tmp/marcacerta-ngrok.pid"
NGROK_LOG_FILE="/tmp/marcacerta-ngrok.log"
NGROK_API_URL="http://127.0.0.1:4040/api/tunnels"

cleanup() {
  if [ -f "$NGROK_PID_FILE" ]; then
    local pid
    pid="$(cat "$NGROK_PID_FILE" 2>/dev/null || true)"

    if [ -n "${pid:-}" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi

    rm -f "$NGROK_PID_FILE"
  fi
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Comando obrigatorio nao encontrado: $1"
    exit 1
  fi
}

ensure_env_file() {
  if [ -f "$ENV_FILE" ]; then
    return
  fi

  if [ -f "$ENV_EXAMPLE_FILE" ]; then
    cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
    echo "Arquivo .env.ngrok criado a partir de .env.ngrok.example"
    return
  fi

  echo "Arquivo de ambiente nao encontrado: $ENV_FILE"
  exit 1
}

stop_previous_ngrok() {
  cleanup
}

start_ngrok() {
  : >"$NGROK_LOG_FILE"
  ngrok http 3000 --log=stdout >"$NGROK_LOG_FILE" 2>&1 &
  echo "$!" >"$NGROK_PID_FILE"
}

get_ngrok_public_url() {
  local attempts=30
  local url=""

  for _ in $(seq 1 "$attempts"); do
    url="$(node -e "
const http = require('node:http');
http.get('${NGROK_API_URL}', (response) => {
  let body = '';
  response.on('data', (chunk) => body += chunk);
  response.on('end', () => {
    try {
      const data = JSON.parse(body);
      const tunnel = (data.tunnels || []).find((item) => typeof item.public_url === 'string' && item.public_url.startsWith('https://'));
      process.stdout.write(tunnel?.public_url || '');
    } catch {
      process.stdout.write('');
    }
  });
}).on('error', () => process.stdout.write(''));
" 2>/dev/null || true)"

    if [ -n "$url" ]; then
      printf '%s' "$url"
      return 0
    fi

    sleep 1
  done

  return 1
}

update_ngrok_env() {
  local public_url="$1"

  node - "$ENV_FILE" "$public_url" <<'NODE'
const fs = require('node:fs');

const [envFile, publicUrl] = process.argv.slice(2);
const content = fs.readFileSync(envFile, 'utf8');

function upsertEnv(source, key, value) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const line = `${key}="${value}"`;
  const regex = new RegExp(`^${escapedKey}=.*$`, 'm');

  if (regex.test(source)) {
    return source.replace(regex, line);
  }

  return source.endsWith('\n') ? `${source}${line}\n` : `${source}\n${line}\n`;
}

let next = content;
next = upsertEnv(next, 'NEXTAUTH_URL', publicUrl);
next = upsertEnv(next, 'FRONTEND_URL', publicUrl);

fs.writeFileSync(envFile, next);
NODE
}

main() {
  require_command ngrok
  require_command node

  ensure_env_file
  stop_previous_ngrok

  trap cleanup EXIT INT TERM

  start_ngrok

  local public_url
  if ! public_url="$(get_ngrok_public_url)"; then
    echo "Nao foi possivel obter a URL publica do ngrok."
    echo "Confira o log em: $NGROK_LOG_FILE"
    exit 1
  fi

  update_ngrok_env "$public_url"

  echo "Ngrok ativo em: $public_url"
  echo "Arquivo atualizado: .env.ngrok"
  echo "Iniciando frontend e backend..."

  cd "$ROOT_DIR"
  SKIP_NGROK_STOP=1 npm run dev:ngrok
}

main "$@"
