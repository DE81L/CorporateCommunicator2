# Server Actions Log

- [2025-06-17] Добавлена реализация notifyUser через FCM и отправку email при ошибке.

- [2025-06-18] Изменены настройки tsconfig для режима NodeNext.
- [2025-06-18] Исправлена ошибка moduleResolution в tsconfig.server.json.
- [2025-06-16] Добавлены заглушки multer и nodemailer для работы без внешних зависимостей.
- [2025-06-19] Исправлена типизация req.file в роуте загрузки аватаров.
- [2025-06-20] Удалена зависимость от `Express.Multer`, тип `file` описан вручную.

- [2025-06-21] Добавлен скрипт `run-production.sh` и примеры unit-файлов systemd в каталоге scripts.
- [2025-06-22] Улучшен скрипт `run-production.sh`: установка зависимостей без `--prod`, одобрение build-скриптов и `pnpm prune` после сборки.
- [2025-06-23] Добавлен флаг `--es-module-specifier-resolution=node` в `run-production.sh` и unit-файле `cc2-node.service`.


- [2025-06-24] Добавлен скрипт `run-dev-server-pyws.sh` для локального запуска Node и Python без клиента.
- [2025-06-24] Скрипт run-production.sh теперь проверяет наличие dist/server/main.js и запускает Node только при его наличии.
- [2025-06-24] В tsconfig проектов server и shared снят флаг noEmit для генерации JS.

- [2025-06-25] Исправлены типы роутеров Express для успешной сборки.
- [2025-06-17] Скрипт run-production.sh завершает зависший python_ws_server перед запуском.
- [2025-06-26] Упрощены tsconfig проектов shared и server для commonjs-сборки.
- [2025-06-27] В tsconfig проектов server и shared включён skipLibCheck для устранения ошибок библиотек.
- [2025-06-28] Указан путь tsBuildInfoFile для проекта server, чтобы избежать конфликтов сборки.
- [2025-06-29] Конфигурация server/tsconfig.json наследует tsconfig.base.json для корректной работы алиасов.
- [2025-06-30] build:prod собирает клиент; Express раздаёт client/dist; start:prod использует порт 5173; run-production.sh собирает при отсутствии dist.
- [2025-07-01] Изменён tsconfig сервера на NodeNext для совместимости с "type": "module".

- [2025-07-02] Заменено "type" в server/package.json на "module" для корректной сборки.
- [2025-07-03] Возврат к CommonJS: tsconfig серверных проектов и package.json теперь используют CommonJS.
