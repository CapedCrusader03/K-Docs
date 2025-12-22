# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript (optional, but good practice)
# The server runs with ts-node, so we don't strictly need to build
# But we'll keep the source for now

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for ts-node)
RUN npm ci && npm cache clean --force

# Copy source code from builder
COPY --from=builder /app/src ./src

# Expose port
EXPOSE 1234

# Start the server
CMD ["npm", "run", "start"]

