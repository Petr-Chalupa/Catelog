FROM node:24-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_VAPID_PUBLIC_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_VAPID_PUBLIC_KEY=$VITE_VAPID_PUBLIC_KEY

WORKDIR /app/frontend
COPY frontend/package*.json .
RUN npm ci

COPY frontend/ .
COPY backend/openapi.yaml ../backend/
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]