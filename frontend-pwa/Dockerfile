FROM node:20-slim AS build
WORKDIR /app

COPY frontend-pwa/package*.json ./frontend-pwa/
RUN cd frontend-pwa && npm install

COPY backend/openapi.yaml ./backend/
COPY frontend-pwa/ ./frontend-pwa/

WORKDIR /app/frontend-pwa
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/frontend-pwa/dist /usr/share/nginx/html
COPY frontend-pwa/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]