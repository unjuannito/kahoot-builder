# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
ARG APP_BASE_PATH=/
ENV APP_BASE_PATH=${APP_BASE_PATH}
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine AS backend-build
WORKDIR /app/backend
RUN apk add --no-cache python3 make g++ linux-headers
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN apk add --no-cache dumb-init python3 make g++ linux-headers fontconfig ttf-dejavu \
    && fc-cache -f

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev && npm cache clean --force
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --omit=dev && npm cache clean --force

COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=frontend-build /app/frontend/build ./frontend/build

RUN apk del python3 make g++ linux-headers \
    && mkdir -p /app/data \
    && chown -R node:node /app

VOLUME ["/app/data"]
EXPOSE 3000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "backend/dist/server.js"]
