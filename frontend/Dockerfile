FROM node:24-alpine AS development-dependencies-env
ARG APP_BASE_PATH=/kahoot-builder
ENV APP_BASE_PATH=$APP_BASE_PATH
ENV VITE_API_PATH=$APP_BASE_PATH/api
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:24-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM node:24-alpine AS build-env
ARG APP_BASE_PATH=/kahoot-builder
ENV APP_BASE_PATH=$APP_BASE_PATH
ENV VITE_API_PATH=$APP_BASE_PATH/api
COPY . /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
WORKDIR /app
RUN npm run build

FROM node:24-alpine
COPY ./package.json package-lock.json /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
CMD ["npm", "run", "start"]
