# ---------- Stage 1: Builder ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.12.1

# Install all deps (including dev) for build
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Generate Prisma client
COPY prisma ./prisma/
RUN pnpm generate

# Copy source & config
COPY tsconfig.json ./
COPY src ./src/
COPY serviceAccountKey.json ./

# Build TypeScript -> /app/dist
RUN pnpm build


# ---------- Stage 2: Runtime ----------
FROM node:22-alpine AS runtime

WORKDIR /app

# Copy only production node_modules and built code
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/serviceAccountKey.json ./serviceAccountKey.json

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
 && adduser  -S nodejs -u 1001
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Start the compiled app
CMD ["node", "dist/main.js"]
