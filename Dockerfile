# ── Build stage: full dependencies (devDependencies included) + `next build` ──
FROM node:20-alpine AS build

# Prisma's query engine needs OpenSSL, which the Alpine base image doesn't ship.
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies from the lockfile (postinstall runs `prisma generate`,
# so the schema has to be there first).
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values are inlined into the browser bundle at build time, so
# this one must be passed as a build arg:
#   docker build --build-arg NEXT_PUBLIC_JMT_FRONTEND_URL=https://jmt.example.com -t jmt-admin .
# Everything else (DATABASE_URL, JWT_SECRET, SMTP_*, …) is read at runtime —
# pass it with `docker run --env-file .env`.
ARG NEXT_PUBLIC_JMT_FRONTEND_URL=http://localhost:3002
ENV NEXT_PUBLIC_JMT_FRONTEND_URL=$NEXT_PUBLIC_JMT_FRONTEND_URL
ENV NEXT_TELEMETRY_DISABLED=1

# `npm run build` = `prisma generate && next build`.
RUN npm run build

# ── Run stage: production dependencies and the build output only ──
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Production dependencies only. `prisma` is a regular dependency and the
# postinstall still runs `prisma generate`, so the schema goes in first again.
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npm cache clean --force

# The Prisma client generated in the build stage (same schema, same platform),
# so the client the app was compiled against is the one that runs.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

COPY --from=build /app/next.config.ts ./
COPY --from=build /app/public ./public
# Owned by the runtime user: `next start` writes its cache under .next.
COPY --from=build --chown=node:node /app/.next ./.next

EXPOSE 3000

# Run as the unprivileged user that ships with the Node image.
USER node

CMD ["npm", "run", "start"]
