# Создание установщика для Electron

Этот документ описывает процесс сборки Windows-установщика для Electron-версии проекта.

1. Установите зависимости в папке `electron`:
   ```bash
   pnpm install
   ```
2. Сначала соберите основную часть Electron:
   ```bash
   pnpm --filter ccnew-electron run build
   ```
3. Затем выполните команду для сборки установщика:
   ```bash
   pnpm --filter ccnew-electron run pack
   ```
   В результате в папке `electron/dist` появится готовый `.exe` файл установщика.
