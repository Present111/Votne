FROM node:20-alpine

WORKDIR /usr/src/app

# Copy file package để install deps
COPY package*.json ./
RUN npm install

# Copy toàn bộ source
COPY . .

# Đọc PORT từ env, default 8081
ENV PORT=8081
EXPOSE 8081

CMD ["node", "server.js"]
