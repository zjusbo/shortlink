# BUILD PRODUCTION IMAGE

# build the builder image, which builds the project
FROM node:16-alpine AS builder
WORKDIR /app

COPY ./client/package.json ./client/yarn.lock ./client/
RUN cd client && yarn install --frozen-lockfile

COPY ./server/package.json ./server/yarn.lock ./server/
RUN cd server && yarn install --frozen-lockfile

COPY . .
RUN cd server && npm run build

# fetch the dist files to a clean nodeJS image
FROM node:20-alpine AS dist
WORKDIR /app
COPY ./server/package.json ./server/yarn.lock ./
RUN yarn install --production --frozen-lockfile
COPY --from=builder /app/server/dist .
