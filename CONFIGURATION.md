# Конфигурация проекта

Проект настраивается через `.env` в корне репозитория.

## Основные переменные

```env
# Database
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=DiplomEnglish
DB_PORT=5432

# API
API_PORT=9090
API_URL=http://localhost:9090

# Frontend
FRONTEND_PORT=3000

# Adminer
ADMINER_PORT=8080
```

## Как это работает в Docker

- `backend` публикуется на `API_PORT`
- `frontend` публикуется на `FRONTEND_PORT`
- frontend внутри контейнера проксирует `/api` и `/uploads` в `backend`
- отдельный reverse proxy больше не нужен

## После изменения `.env`

Рекомендуемый перезапуск:

```bash
docker compose down
docker compose up --build -d
```

Если менялись только порты frontend или backend, обычно достаточно:

```bash
docker compose up --build -d frontend backend
```

## Пример смены портов

```env
API_PORT=8080
FRONTEND_PORT=4000
ADMINER_PORT=8081
DB_PORT=5433
```

После этого сервисы будут доступны так:

- Frontend: `http://localhost:4000`
- API: `http://localhost:8080`
- Adminer: `http://localhost:8081`
- PostgreSQL: `localhost:5433`

Frontend при этом продолжит обращаться к API через `http://localhost:4000/api`.
