# Структура базы данных

Этот файл генерируется автоматически командой `pnpm run db:docs` и описывает текущую схему PostgreSQL.

## announcements
Объявления для всех сотрудников.

| Поле       | Тип                               | Ограничения | По умолчанию                          |
|------------|----------------------------------|-------------|---------------------------------------|
| id         | integer                           | PK          | nextval('announcements_id_seq')       |
| title      | text                              | NOT NULL    | -                                     |
| content    | text                              | NOT NULL    | -                                     |
| created_at | timestamp without time zone      | NOT NULL    | now()                                 |

## departments
Справочник отделов и подразделений.

| Поле     | Тип                          | Ограничения | По умолчанию                       |
|----------|-----------------------------|-------------|------------------------------------|
| id       | integer                     | PK          | nextval('departments_id_seq')      |
| name     | text                        | NOT NULL    | -                                  |
| parent_id| integer                     |             | -                                  |

## group_members
Связующая таблица пользователей и групп.

| Поле     | Тип      | Ограничения | По умолчанию                       |
|----------|---------|-------------|------------------------------------|
| id       | integer | PK          | nextval('group_members_id_seq')    |
| group_id | integer |             | -                                  |
| user_id  | integer |             | -                                  |
| is_admin | integer |             | 0                                  |

**FK:**
- group_id → groups.id
- user_id → users.id

## groups
Групповые чаты и каналы.

| Поле          | Тип      | Ограничения | По умолчанию                  |
|---------------|---------|-------------|-------------------------------|
| id            | integer | PK          | nextval('groups_id_seq')      |
| name          | text    | NOT NULL    | -                             |
| description   | text    |             | -                             |
| creator_id    | integer |             | -                             |
| is_announcement | integer |             | 0                             |
| is_explanation | integer |             | 0                             |

UNIQUE: name

**FK:**
- creator_id → users.id

## jobs
Должности сотрудников.

| Поле        | Тип      | Ограничения | По умолчанию                 |
|-------------|---------|-------------|------------------------------|
| id          | integer | PK          | nextval('jobs_id_seq')       |
| name        | text    | NOT NULL    | -                            |
| department_id | integer |             | -                            |

**FK:**
- department_id → departments.id (ON DELETE SET NULL)

## messages
Чат-сообщения.

| Поле       | Тип                               | Ограничения | По умолчанию                      |
|------------|----------------------------------|-------------|-----------------------------------|
| id         | integer                           | PK          | nextval('messages_id_seq')        |
| sender_id  | integer                           | NOT NULL    | -                                |
| receiver_id| integer                           |             | -                                |
| group_id   | integer                           |             | -                                |
| content    | text                              | NOT NULL    | -                                |
| timestamp  | timestamp without time zone      | NOT NULL    | now()                            |
| is_read    | integer                           |             | 0                                |
| status     | text                              | NOT NULL    | 'pending'                        |

**FK:**
- sender_id → users.id

## requests
Заявки от пользователей.

| Поле                  | Тип                               | Ограничения | По умолчанию                       |
|-----------------------|----------------------------------|-------------|------------------------------------|
| id                    | integer                           | PK          | nextval('requests_id_seq')         |
| sender_id             | integer                           | NOT NULL    | -                                  |
| receiver_department_id| integer                           | NOT NULL    | -                                  |
| cabinet               | text                              |             | -                                  |
| phone                 | text                              |             | -                                  |
| is_urgent             | boolean                           |             | false                              |
| deadline              | timestamp without time zone      |             | -                                  |
| task_id               | integer                           | NOT NULL    | -                                  |
| comment               | text                              |             | -                                  |
| who_accepted          | integer                           |             | -                                  |
| taken_at              | timestamp without time zone      |             | -                                  |
| grade                 | integer                           |             | -                                  |
| review_text           | text                              |             | -                                  |
| finished_at           | timestamp without time zone      |             | -                                  |
| status                | text                              | NOT NULL    | 'новая'                            |
| created_at            | timestamp without time zone      | NOT NULL    | now()                              |

**FK:**
- sender_id → users.id
- receiver_department_id → subdivisions.id
- task_id → tasks_catalog.id
- who_accepted → users.id

## subdivisions
Структура подразделений.

| Поле       | Тип                               | Ограничения | По умолчанию                        |
|------------|----------------------------------|-------------|-------------------------------------|
| id         | integer                           | PK          | nextval('subdivisions_id_seq')      |
| name       | text                              | NOT NULL    | -                                   |
| description| text                              |             | -                                   |
| parent_id  | integer                           |             | -                                   |
| created_at | timestamp without time zone      | NOT NULL    | now()                               |
| updated_at | timestamp without time zone      | NOT NULL    | now()                               |

## tasks_catalog
Список типов задач.

| Поле   | Тип      | Ограничения | По умолчанию                    |
|--------|---------|-------------|---------------------------------|
| id     | integer | PK          | nextval('tasks_catalog_id_seq') |
| name   | text    | NOT NULL    | -                               |
| category | text  | NOT NULL    | -                               |

## users
Пользователи системы.

| Поле         | Тип      | Ограничения | По умолчанию              |
|--------------|---------|-------------|---------------------------|
| id           | integer | PK          | nextval('users_id_seq')   |
| username     | text    | NOT NULL    | -                         |
| email        | text    | NOT NULL    | -                         |
| password     | text    | NOT NULL    | -                         |
| first_name   | text    | NOT NULL    | -                         |
| last_name    | text    | NOT NULL    | -                         |
| isonline     | integer |             | 0                         |
| avatarurl    | text    |             | -                         |
| department_id| integer |             | -                         |
| job_title    | text    |             | -                         |
| language     | text    |             | 'en'                      |
| is_admin     | boolean | NOT NULL    | false                     |

**FK:**
- department_id → departments.id

## wiki_categories
Категории wiki.

| Поле       | Тип                               | Ограничения | По умолчанию                           |
|------------|----------------------------------|-------------|----------------------------------------|
| id         | integer                           | PK          | nextval('wiki_categories_id_seq')      |
| name       | text                              | NOT NULL    | -                                      |
| description| text                              |             | -                                      |
| parent_id  | integer                           |             | -                                      |
| created_at | timestamp without time zone      | NOT NULL    | -                                      |
| updated_at | timestamp without time zone      | NOT NULL    | -                                      |

## wiki_entries
Статьи wiki.

| Поле          | Тип                               | Ограничения | По умолчанию                          |
|---------------|----------------------------------|-------------|---------------------------------------|
| id            | integer                           | PK          | nextval('wiki_entries_id_seq')        |
| title         | text                              | NOT NULL    | -                                     |
| content       | text                              | NOT NULL    | -                                     |
| creator_id    | integer                           |             | -                                     |
| created_at    | timestamp without time zone      | NOT NULL    | -                                     |
| updated_at    | timestamp without time zone      | NOT NULL    | -                                     |
| last_editor_id| integer                           |             | -                                     |
| category      | text                              |             | -                                     |

**FK:**
- creator_id → users.id
- last_editor_id → users.id

## Связи между таблицами

- group_members.group_id → groups.id
- group_members.user_id → users.id
- groups.creator_id → users.id
- jobs.department_id → departments.id
- messages.sender_id → users.id
- requests.receiver_department_id → subdivisions.id
- requests.sender_id → users.id
- requests.task_id → tasks_catalog.id
- requests.who_accepted → users.id
- users.department_id → departments.id
- wiki_entries.creator_id → users.id
- wiki_entries.last_editor_id → users.id

