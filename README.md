# Corporate Communicator 2

Проект состоит из нескольких пакетов: серверной части, клиента и Electron-оболочки.

## Установка

```bash
pnpm install
```

## Запуск в разработке

```bash
pnpm run dev
```

Для запуска только серверных служб (Node и Python WS) без клиента используйте:

```bash
pnpm run dev:server-pyws
```

## Сборка

```bash
pnpm run build
```

Для развёртывания в production используйте:

```bash
pnpm run build:prod
pnpm run start:prod
```

## Запуск тестов

Информация о тестах описана в [docs/test-run.md](docs/test-run.md). Кратко:

```bash
pnpm exec jest
```

