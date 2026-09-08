# BUILD PRODUCTION IMAGE

# Stage 1: build the Angular client (Angular 9 requires Node <= 16)
FROM node:16-alpine AS client-builder
WORKDIR /app/client
COPY ./client/package.json ./client/yarn.lock ./
RUN yarn install --frozen-lockfile
# the client imports shared interfaces from server/src/interfaces
COPY ./server/src/interfaces/ /app/server/src/interfaces/
COPY ./client/ ./
RUN npx ng build --prod

# Stage 2: compile the TypeScript server
FROM node:22-alpine AS server-builder
WORKDIR /app/server
COPY ./server/package.json ./server/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY ./server/ ./
RUN npx tsc

# Stage 3: runtime image with production deps only
FROM node:22-alpine AS dist
WORKDIR /app
ENV NODE_ENV=production
COPY ./server/package.json ./server/yarn.lock ./
RUN yarn install --production --frozen-lockfile && yarn cache clean
COPY --from=server-builder /app/server/dist .
COPY --from=client-builder /app/client/dist ./public
USER node
CMD ["node", "index.js"]
