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
RUN rm -rf .next
RUN BUILD_ID="$(date +%s)" && \
  export BUILD_ID && \
  export NEXT_PUBLIC_APP_BUILD_ID="$BUILD_ID" && \
  npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
# Standalone output is produced from frontend/ sources (see builder COPY frontend/ .)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
