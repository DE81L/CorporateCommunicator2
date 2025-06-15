# Видео-звонки через self-hosted Jitsi

## Архитектура

Клиент подключается к Jitsi Videobridge через WebSocket `xmpp-websocket` на домене, заданном переменной `JITSI_DOMAIN`.

```
клиент → JVB (wss) → конференция
```

## Структура компонентов

- `useJitsi` — хук для подключения и управления конференцией.
- `CallModal` — модальное окно со списком видео участников.
- `VideoTile` — обёртка над `<video>/<audio>` для автоматического attach/detach трека.

## Переменные окружения

- `JITSI_DOMAIN` — домен сервера Jitsi, например `meet.local.company`.

## Запуск Jitsi локально

```yaml
version: '3'
services:
  web:
    image: jitsi/web:stable
    restart: unless-stopped
    ports:
      - "8443:8443"
  prosody:
    image: jitsi/prosody:stable
    restart: unless-stopped
  jicofo:
    image: jitsi/jicofo:stable
    restart: unless-stopped
  jvb:
    image: jitsi/jvb:stable
    restart: unless-stopped
```

Поднимите сервис командой `docker-compose up -d` и укажите соответствующий `JITSI_DOMAIN` в файле `.env`.
