# Build do frontend (React 18 + TypeScript/Vite) e serviço via Nginx.
# Estágio 1: build do bundle de produção
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Estágio 2: Nginx enxuto servindo o SPA + proxy de /api
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
