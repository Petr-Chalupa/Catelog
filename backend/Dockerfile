FROM node:20-alpine AS builder
WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY backend/ ./backend/
RUN cd backend && npm run build

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/backend/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/backend/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]