#!/bin/bash

set -exu

if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

if [ -n "${SERVE_DOMAIN}" ]; then
    docker compose up -d --build # remote, deploy caddy too
else
    docker compose up -d --build devnet faucet # local, no reverse proxy
fi