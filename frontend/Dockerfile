# Build context: ./frontend (see docker-compose.yml)
# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG DASHBOARD_AUTH_SECRET=siwaky2026dashboard_secret_key_very_long_32chars
ARG DASHBOARD_USERS_JSON="[{\"email\":\"siwaky.assistance@gmail.com\",\"role\":\"admin\",\"passwordHash\":\"$$2b$$12$$l8XVlTD.5i5kJVKYmHxbJ.8cQBChQ/oCAEwdRiqQ8c1xOIDRXSH7C\"}]"
ENV DASHBOARD_AUTH_SECRET=${DASHBOARD_AUTH_SECRET}
ENV DASHBOARD_USERS_JSON=${DASHBOARD_USERS_JSON}
RUN rm -rf .next
RUN BUILD_ID="$(date +%s)" && \
  export BUILD_ID && \
  export NEXT_PUBLIC_APP_BUILD_ID="$BUILD_ID" && \
  npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG DASHBOARD_AUTH_SECRET=siwaky2026dashboard_secret_key_very_long_32chars
ARG DASHBOARD_USERS_JSON="[{\"email\":\"siwaky.assistance@gmail.com\",\"role\":\"admin\",\"passwordHash\":\"$$2b$$12$$l8XVlTD.5i5kJVKYmHxbJ.8cQBChQ/oCAEwdRiqQ8c1xOIDRXSH7C\"}]"
ENV DASHBOARD_AUTH_SECRET=${DASHBOARD_AUTH_SECRET}
ENV DASHBOARD_USERS_JSON=${DASHBOARD_USERS_JSON}
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
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
