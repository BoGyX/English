# Настройка проекта

## Конфигурация через .env

Все порты и URL настраиваются через файл `.env` в корне проекта.



### Как изменить порты

1. Отредактируйте `.env` файл
2. Пересобери контейнеры:
   
   docker-compose down
   docker-compose up --build


### Доступ к сервисам. ну у нас так как мтнимум

После запуска `docker-compose up`:

- **Frontend**: http://localhost:3000 (или значение `FRONTEND_PORT`)
- **API**: http://localhost:9090 (или значение `API_PORT`)
- **Swagger**: http://localhost:9090/swagger/index.html
- **Adminer**: http://localhost:8080 (или значение `ADMINER_PORT`)
- **PostgreSQL**: localhost:5433 (или значение `DB_PORT`)


### Важно

- Все изменения портов делайте только в `.env` файле
- После изменения `.env` нужна пересборка контейнеров
- `API_URL` должен совпадать с `API_PORT` для корректной работы
