FROM node:20-alpine

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

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Run as the unprivileged user that ships with the Node image.
RUN chown -R node:node /app/.next
USER node

CMD ["npm", "run", "start"]
