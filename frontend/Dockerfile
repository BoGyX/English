FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package файлы
COPY package*.json ./
RUN npm ci

# Копируем исходники
COPY . .

# Устанавливаем переменную окружения для сборки
ARG VITE_API_URL=http://localhost:9090/api
ENV VITE_API_URL=$VITE_API_URL

# Собираем приложение
RUN npm run build

# Финальный образ с nginx
FROM nginx:alpine

# Копируем собранное приложение
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфиг nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем entrypoint скрипт
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
