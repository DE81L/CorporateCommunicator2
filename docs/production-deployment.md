# Развёртывание CorporateCommunicator2 в production

Этот документ описывает примерную схему запуска без Electron. 

## Используемые порты

- **5173** – dev-сервер Vite для клиента (только в режиме разработки).
- **3000/4000** – Node.js API-сервер. Значение задаётся переменной `PORT`.
- **8001** – Python WebSocket-сервер.

## Быстрый запуск

В каталоге `scripts` расположен файл `run-production.sh`. Он собирает только
модули `shared` и `server`, устанавливает зависимости Python из
`requirements.txt` и затем поднимает Python WebSocket и Node.js API.

Сборка выполняется так:

```bash
pnpm -r --filter 'shared...' run build
pnpm -r --filter 'server...' run build
```

Запускаем сервисы командой:

```bash
pnpm run start:prod
```
Скрипт автоматически создаёт виртуальное окружение Python и запускает Node.js
с флагом `--es-module-specifier-resolution=node`.

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

