#!/usr/bin/env bash

set +e

pkill -f "/home/jaderson/Projetos-pessoais/salao/node_modules/.bin/next dev" 2>/dev/null
pkill -f "/home/jaderson/Projetos-pessoais/salao/node_modules/.bin/ts-node-dev --respawn --transpile-only src/main.ts" 2>/dev/null
pkill -f "/home/jaderson/Projetos-pessoais/salao/node_modules/concurrently/dist/bin/concurrently.js" 2>/dev/null
fuser -k 3000/tcp 3001/tcp 3333/tcp 2>/dev/null

exit 0
