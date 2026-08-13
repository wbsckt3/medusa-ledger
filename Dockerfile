FROM node:20-alpine
WORKDIR /app
COPY packages/core ./packages/core
COPY packages/api ./packages/api
WORKDIR /app/packages/api
ENV PORT=8080
EXPOSE 8080
CMD ["node", "src/server.js"]
