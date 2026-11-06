FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run lint && npm test && npm run build

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache ffmpeg
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/server.js ./server.js
EXPOSE 3001
CMD ["node", "server.js"]
