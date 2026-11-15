# Список дел: Express и PostgreSQL

Приложение реализует персональный список дел для Moodle-логина `jojiiikol`. Сервер написан на Node.js 22 и Express 5, данные хранятся в PostgreSQL 17. Интерфейс позволяет добавлять задачи, фильтровать их по `runId`, менять название и состояние, удалять и повторно загружать данные.

## Архитектура и данные

`app.js` собирает Express. Маршруты вызывают `AuthService` и `TaskService`, а `TaskRepository` выполняет параметризованные SQL-запросы через `pg`. Таблица `tasks` создаётся миграцией при старте.

| Поле API | Столбец PostgreSQL | Тип |
|---|---|---|
| `id` | `id` | `uuid` |
| `ownerLogin` | `owner_login` | `varchar(255)` |
| `title` | `title` | `varchar(200)` |
| `done` | `done` | `boolean` |
| `runId` | `run_id` | `varchar(64)` |
| `createdAt` | `created_at` | `timestamptz` |

Все `/api/`-маршруты требуют JWT в заголовке `Authorization: Bearer <token>`. Токен содержит роль `owner` или `reviewer`, подписывается `JWT_SECRET` и истекает через три календарных месяца. `/api/session/` показывает роль, автора и срок действия. `/login/` остаётся публичным. Приложение устанавливает `ownerLogin=jojiiikol`, UUID, время и начальное `done=false`.

## Запуск

Скопируйте конфигурацию, укажите ФИО, замените пароли и создайте `JWT_SECRET` командой `openssl rand -hex 32`:

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
```

Выпустите разные токены создателя и преподавателя:

```bash
npm run token:issue -- owner
npm run token:issue -- reviewer
```

Интерфейс доступен на `http://localhost:3000`. Для HTTPS нужен reverse proxy с сертификатом. Остановка: `docker compose down`. Повторная инициализация БД: `docker compose down -v`, затем `docker compose up -d --build`.

Пример проверки API:

```bash
curl http://localhost:3000/login/
curl -H 'Authorization: Bearer STUDENT_TOKEN' http://localhost:3000/api/author/
curl -H 'Authorization: Bearer STUDENT_TOKEN' http://localhost:3000/api/session/
curl -H 'Authorization: Bearer STUDENT_TOKEN' -H 'Content-Type: application/json' \
  -d '{"title":"Итоговая работа 24.10.2026: jojiiikol","runId":"manual"}' \
  http://localhost:3000/api/tasks/
```

## Доступ преподавателя

Compose создаёт роль `todo_teacher` с подключением к учебной БД и `SELECT`, `INSERT`, `UPDATE`, `DELETE` для `tasks`, без административных прав. Реквизиты БД и JWT роли `reviewer` передаются преподавателю лично. Оба JWT разрешают учебный CRUD, но `/api/session/` различает владельца и преподавателя.

## Сравнение размещения БД

Проверено 15.11.2026 по официальным страницам.

| Вариант | Условия и ограничения | Итог |
|---|---|---|
| [Timeweb Cloud DBaaS](https://timeweb.cloud/services/dbaas) | Российский managed PostgreSQL, от 180 ₽/мес.; публичный IPv4 оплачивается отдельно; минимум 1 CPU, 1 ГБ RAM, 8 ГБ NVMe | Подходит для сдачи и независимого SQL-доступа; выбранный отечественный вариант |
| [Supabase Free](https://supabase.com/pricing) | Бесплатно, PostgreSQL, 500 МБ данных, два активных проекта; пауза после недели неактивности | Денег не требует, но перед проверкой необходимо гарантированно разбудить проект |
| [Neon Free](https://neon.com/blog/neon-free-plan-1-gb-per-project) | Бесплатно, PostgreSQL, 1 ГБ на проект и 100 CU-часов ежемесячно | Удобен для учебного проекта, но serverless-режим может дать задержку холодного старта |

Compose переносим на сервер. Для сдачи нужен постоянный HTTPS и проверка с внешней сети.

## Проверка

```bash
npm ci
npm test
npm audit --omit=dev
```
