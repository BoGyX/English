# Настройка проекта

Все основные параметры задаются через `.env` в корне проекта.

## Быстрый запуск

```bash
docker compose up --build
```

## Доступ к сервисам

После запуска:

- Frontend: `http://localhost:3000` или значение `FRONTEND_PORT`
- API: `http://localhost:9090` или значение `API_PORT`
- Swagger: `http://localhost:9090/swagger/index.html`
- Adminer: `http://localhost:8080` или значение `ADMINER_PORT`
- PostgreSQL: `localhost:5432` или значение `DB_PORT`

## Как поменять порты

1. Измените значения в `.env`
2. Пересоберите контейнеры:

```bash
docker compose down
docker compose up --build
```

## Важно

- Frontend теперь сам публикует `FRONTEND_PORT`
- Отдельный `nginx` больше не используется
- Frontend ходит в backend через относительный путь `/api`
- Если меняете `API_PORT`, backend будет доступен на новом порту с хоста, а frontend продолжит работать через свой `/api` proxy
