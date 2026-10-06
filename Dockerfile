# Composer's Dungeon, hosted.
#
# Builds the same Next.js app the Windows installer ships, against Postgres
# instead of a local SQLite file. Runs on anything that takes a Dockerfile —
# Railway, Render, Fly.io, a plain VPS.
#
#   docker build -t composers-dungeon .
#   docker run -p 3000:3000 --env-file .env composers-dungeon
#
# See DEPLOY.md for the hosted environment variables and the two cheapest paths.

# --- dependencies ----------------------------------------------------------
FROM node:22-slim AS deps
WORKDIR /app
# Prisma's query engine is linked against OpenSSL; the slim image does not
# carry it, and without this Prisma fails at startup rather than at build.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci

# --- build -----------------------------------------------------------------
FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Derive the Postgres schema from the SQLite one, so the hosted build and the
# desktop app can never describe different tables. check:schemas enforces it.
RUN node scripts/make-postgres-schema.mjs && node scripts/check-schemas.mjs
RUN npx prisma generate --schema prisma/schema.postgres.prisma

# next build needs these present, not reachable: no database is contacted here.
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
ENV DIRECT_DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
ENV NEXTAUTH_SECRET="build-time-placeholder-never-used-at-runtime"
RUN npm run build

# The entrypoint needs the Prisma CLI to push the schema and tsx to run the
# seed. They live apart from the app's own traced node_modules so the two
# dependency trees cannot shadow each other.
RUN npm install --no-save --prefix /opt/tools prisma@5.22.0 tsx@4.19.1

# --- run -------------------------------------------------------------------
FROM node:22-slim AS run
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# What makes this instance behave as a server other people reach, rather than
# as somebody's desktop copy: no updater, and no password-reset hand-over
# through a file on disk that only a person at the keyboard could read.
ENV CD_HOSTED=1
ENV DATABASE_PROVIDER=postgresql
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /opt/tools /opt/tools
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
# The seed is TypeScript and imports from src/ (src/lib/curriculum, and through
# src/lib/lesson-figure on to src/lib/score), resolved through tsconfig's "@/*"
# path alias. Without these two the first boot pushes the schema and then dies
# on the seed, which a cold-start test caught.
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/scripts/docker-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Not root: the app only ever needs to read its own files.
RUN useradd --system --uid 1001 composer && chown -R composer:composer /app
USER composer

EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "server.js"]
