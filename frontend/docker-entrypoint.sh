#!/bin/sh
set -e

# Генерируем config.js с переменными окружения
cat > /usr/share/nginx/html/config.js <<EOF
window.ENV = {
  VITE_API_URL: '${VITE_API_URL:-/api}'
};
EOF

echo "Generated runtime config:"
cat /usr/share/nginx/html/config.js

# Запускаем nginx
exec nginx -g 'daemon off;'
