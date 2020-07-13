# BUILD PRODUCTION IMAGE

# build the builder image, which builds the project
FROM node:12-alpine AS builder
WORKDIR /app

COPY ./client/package.json ./client/
RUN cd client && yarn install --dev

COPY ./server/package.json ./server/
RUN cd server && yarn install --dev

COPY . .
RUN cd server && npm run build

# fetch the dist files to a clean nodeJS image
FROM node:12-alpine AS dist
WORKDIR /app
COPY ./server/package.json ./
RUN yarn install --production
COPY --from=builder /app/server/dist .

