# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies (including dev)
RUN apk add --no-cache python3 make g++ openssl

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy prisma schema and generate client
COPY prisma ./prisma

# Generate Prisma client after all dependencies are installed
RUN npx prisma generate

# Copy source code
COPY . .

# Build the NestJS application
RUN NODE_OPTIONS="--max-old-space-size=4096" yarn build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package.json yarn.lock ./

# Install production dependencies only
RUN yarn install --frozen-lockfile --production=true && yarn cache clean

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client for production
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

USER nestjs

# Expose port
EXPOSE 4000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/src/main.js"]
