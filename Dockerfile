FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code (will be overridden by mount in development)
COPY . .

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001 -G nodejs

USER nextjs
EXPOSE 3000

# Command will be overridden in docker-compose for building
CMD ["pnpm", "run", "start"]
