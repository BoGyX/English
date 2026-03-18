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

# Создаем скрипт для генерации runtime конфига
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'cat > /usr/share/nginx/html/config.js <<EOF' >> /entrypoint.sh && \
    echo 'window.ENV = {' >> /entrypoint.sh && \
    echo '  VITE_API_URL: '"'"'${VITE_API_URL:-http://localhost:9090/api}'"'"'' >> /entrypoint.sh && \
    echo '};' >> /entrypoint.sh && \
    echo 'EOF' >> /entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
