# Развёртывание CorporateCommunicator2 в production

Этот документ описывает примерную схему запуска без Electron.

## Используемые порты

- **5173** – dev-сервер Vite и production‑сервер Express.
- **8001** – Python WebSocket-сервер.

В продакшене Express и клиент работают на одном порту, значение задаётся `PORT`.

## Быстрый запуск

В каталоге `scripts` расположен файл `run-production.sh`. Он при отсутствии
готовой сборки вызывает `pnpm run build:prod`, устанавливает зависимости Python
из `requirements.txt` и затем поднимает Python WebSocket и Node.js API.

Сборка выполняется так:

```bash
pnpm run build:prod
```

Запускаем сервисы командой:

```bash
pnpm run start:prod
```
Скрипт автоматически создаёт виртуальное окружение Python и запускает Node.js.

Перед запуском при необходимости переопределите `DATABASE_URL`, `VITE_API_URL`
и `VITE_WS_URL`. Скрипт по умолчанию использует адрес `91.197.96.9`.

## Автозапуск через systemd

В каталоге `scripts/systemd` находятся шаблоны юнитов `cc2-node.service` и
`cc2-ws.service`. Их следует скопировать в `/etc/systemd/system/` и выполнить
`sudo systemctl daemon-reload`, после чего можно включить и запустить сервисы:

```bash
sudo systemctl enable cc2-node.service cc2-ws.service
sudo systemctl start cc2-node.service cc2-ws.service
```

Сервисы автоматически перезапускаются при сбоях и стартуют вместе с системой.

