FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates postgresql-client \
    && rm -rf /var/lib/apt/lists/*

USER node
