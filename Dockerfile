FROM node:22-bookworm-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=4317
ENV HOSTNAME=0.0.0.0
EXPOSE 4317

CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "4317"]
