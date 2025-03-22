FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

# Copy application code
COPY --chown=nodejs:nodejs . .

# Set environment variables for Cloud Run
ENV PORT=8080
ENV NODE_ENV=production

# Don't use hard-coded Firebase credentials in the Dockerfile
# These should be set as environment variables at runtime
# or use a secrets management solution

# Use non-root user
USER nodejs

# Healthcheck to ensure the app is running properly
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O - http://localhost:$PORT/health || exit 1

# Expose the port
EXPOSE 8080

# Start the server
CMD ["node", "src/server.js"]