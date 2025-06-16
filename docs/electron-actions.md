# Electron Actions Log

This file tracks all changes related to the Electron wrapper and packaging.

- [2025-06-09] Добавлена конфигурация electron-builder и скрипт `pack` для создания Windows-установщика.

- [2025-06-18] Обновлена конфигурация TypeScript для поддержки import.meta в electron.
- [2025-06-18] Добавлена заглушка openDoom в web-polyfills.
- [2025-06-18] Обновлена конфигурация tsconfig в electron для корректной работы путей.
- [2025-06-19] Указан baseUrl в tsconfig для корректной работы путей.
- [2025-06-20] Исправлен импорт типов в хуке `useLogin.ts`, теперь используются относительные пути.

- [2025-06-24] Electron исключён из зависимостей корневого пакета и не запускается в `pnpm run dev`.
