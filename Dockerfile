# ══════════════════════════════════════════════════════════════
# Mailzy — Production Dockerfile
# Multi-stage build: Node builds → Nginx serves
# Image size: ~25MB final (alpine)
# ══════════════════════════════════════════════════════════════

# ── Stage 1: Build React App ──────────────────────────────────
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install deps first (layer caching — only reinstalls if package.json changes)
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build arguments — injected at docker build time
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set env vars for Vite build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build production bundle
RUN npm run build

# ── Stage 2: Serve with Nginx (only ~5MB image) ───────────────
FROM nginx:1.25-alpine AS production

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy our production nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Security: run nginx as non-root user
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

USER nginx

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
