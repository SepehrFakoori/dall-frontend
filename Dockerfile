FROM node:24-alpine AS build
WORKDIR /app
RUN npm install --global pnpm@11.25.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG FRONTEND_ENV=production
ARG BACKEND_BASE_URL
ARG VITE_API_URL
RUN pnpm run "build:${FRONTEND_ENV}" && mv dist/api-location.conf /tmp/api-location.conf

FROM nginxinc/nginx-unprivileged:1.28-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /tmp/api-location.conf /etc/nginx/api-location.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
USER 101
