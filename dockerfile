# Root build for Easypanel — context is repo root; app lives in frontend/
# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS deps
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ .
ENV NEXT_TELEMETRY_DISABLED=1
# Fallbacks: use literal ENV so `$$` → single `$` in the container (Easypanel-safe).
ENV DASHBOARD_AUTH_SECRET=siwaky2026dashboard_secret_key_very_long_32chars
ENV DASHBOARD_USERS_JSON='[{"email":"siwaky.assistance@gmail.com","role":"admin","passwordHash":"$$2b$$12$$JgcBQkW2jvlbrkBnI0dWVOXclGsR2qAPQwLCdg6KVkvhYFNpCZTfO"}]'
RUN rm -rf .next
RUN BUILD_ID="$(date +%s)" && \
  export BUILD_ID && \
  export NEXT_PUBLIC_APP_BUILD_ID="$BUILD_ID" && \
  npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV DASHBOARD_AUTH_SECRET=siwaky2026dashboard_secret_key_very_long_32chars
ENV DASHBOARD_USERS_JSON='[{"email":"siwaky.assistance@gmail.com","role":"admin","passwordHash":"$$2b$$12$$JgcBQkW2jvlbrkBnI0dWVOXclGsR2qAPQwLCdg6KVkvhYFNpCZTfO"}]'
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
# Standalone output is produced from frontend/ sources (see builder COPY frontend/ .)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production
CMD ["node", "server.js"]
