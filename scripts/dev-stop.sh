#!/usr/bin/env bash

set +e

NGROK_PID_FILE="/tmp/marcacerta-ngrok.pid"

if [ "${SKIP_NGROK_STOP:-0}" != "1" ] && [ -f "$NGROK_PID_FILE" ]; then
  NGROK_PID="$(cat "$NGROK_PID_FILE" 2>/dev/null)"
  if [ -n "$NGROK_PID" ]; then
    kill "$NGROK_PID" 2>/dev/null
  fi
  rm -f "$NGROK_PID_FILE"
fi

pkill -f "/home/jaderson/Projetos-pessoais/salao/node_modules/.bin/next dev" 2>/dev/null
pkill -f "/home/jaderson/Projetos-pessoais/salao/node_modules/.bin/ts-node-dev --respawn --transpile-only src/main.ts" 2>/dev/null
pkill -f "/home/jaderson/Projetos-pessoais/salao/node_modules/concurrently/dist/bin/concurrently.js" 2>/dev/null
fuser -k 3000/tcp 3001/tcp 3333/tcp 2>/dev/null

exit 0
