FROM node:22-bookworm-slim

# curl: Cloud Agent の install-exec-daemon が必須（slim イメージには同梱されない）
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        ca-certificates \
        curl \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

USER node
