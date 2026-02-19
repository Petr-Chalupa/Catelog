FROM node:20-alpine AS builder
WORKDIR /app

COPY backend/package*.json .
RUN npm ci

COPY backend/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json .
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/openapi.yaml .

EXPOSE 3000
CMD ["node", "dist/index.js"]