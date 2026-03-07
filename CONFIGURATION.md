# Конфигурация проекта

Все настройки проекта управляются через файл `.env` в корне проекта.

## Изменение портов

Чтобы изменить порты приложения, отредактируйте файл `.env`:

```env
# Порты
DB_PORT=5432          # Порт PostgreSQL
API_PORT=9090         # Порт backend API
FRONTEND_PORT=3000    # Порт frontend
ADMINER_PORT=8080     # Порт Adminer (веб-интерфейс БД)

# URL API (используется фронтендом)
API_URL=http://localhost:9090
```

## Применение изменений

После изменения портов в `.env`:

### Вариант 1: Полная пересборка (рекомендуется)
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### Вариант 2: Перезапуск только нужных сервисов

Если изменили только `API_PORT` или `API_URL`:
```bash
docker-compose up -d backend frontend
```

Если изменили `FRONTEND_PORT`:
```bash
docker-compose up -d frontend
```

Если изменили `DB_PORT`:
```bash
docker-compose down db
docker-compose up -d db
```

## Важно!

- **Frontend** использует runtime конфигурацию - изменения `API_URL` применяются при перезапуске контейнера (не требуется пересборка)
- **Backend** читает переменные окружения при запуске
- **Database** требует пересоздания контейнера при изменении порта

## Пример: Изменение портов для другого окружения

Если вы хотите запустить проект на других портах (например, порты 9090 и 3000 уже заняты):

1. Откройте `.env`
2. Измените порты:
```env
API_PORT=8080
API_URL=http://localhost:8080
FRONTEND_PORT=4000
```
3. Перезапустите:
```bash
docker-compose up -d backend frontend
```

Теперь:
- Frontend доступен на `http://localhost:4000`
- Backend API на `http://localhost:8080`
- Frontend автоматически будет обращаться к API на порту 8080

## Проверка конфигурации

Чтобы проверить, какой URL использует frontend:
1. Откройте `http://localhost:3000` (или ваш FRONTEND_PORT)
2. Откройте DevTools (F12)
3. В консоли выполните: `window.ENV`
4. Вы увидите текущую конфигурацию

## Переменные окружения

Полный список переменных в `.env`:

```env
# Database
DB_USER=postgres
DB_PASSWORD=postgres_password_123
DB_NAME=DiplomEnglish
DB_PORT=5432

# API
API_PORT=9090
API_URL=http://localhost:9090

# Frontend
FRONTEND_PORT=3000

# Adminer
ADMINER_PORT=8080

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRY_HOURS=24

# Application
GIN_MODE=release

# Moodle Integration
MOODLE_ENABLED=true
MOODLE_TEST_MODE=false
MOODLE_BASE_URL=https://testlms.25-12.ru/
MOODLE_TOKEN=your_token_here
MOODLE_SERVICE=moodle_mobile_app
MOODLE_AUTO_CREATE=true
```
