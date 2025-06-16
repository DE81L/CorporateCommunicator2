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

