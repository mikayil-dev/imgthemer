# 1) Build lutgen CLI
FROM rust AS lutgen-builder

RUN cargo install lutgen-cli --version 1.0.1

# 2) Build Astro app + install deps
FROM node:22-slim AS builder

WORKDIR /app

# 1. Install deps (these will be re-used in runtime)
COPY package*.json ./
RUN npm ci

# 2. Build Astro
COPY . .
RUN npm run build

# 3) Runtime image
FROM node:22-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Copy runtime deps + metadata
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy built server bundle
COPY --from=builder /app/dist ./dist

# Copy lutgen into PATH
COPY --from=lutgen-builder /usr/local/cargo/bin/lutgen /usr/local/bin/lutgen

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
