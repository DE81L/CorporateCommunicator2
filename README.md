# Corporate Communicator 2

This repository contains a monorepo setup for a corporate messaging application. It includes:
- Please note that some features are still under active development. Audio and video calls are currently stubbed and do not establish real connections.

- **client** – React frontend built with Vite
- **server** – Express API backend
- **electron** – Electron desktop wrapper
- **shared** – Shared TypeScript utilities

## Prerequisites

- Node.js 20 or later
- [pnpm](https://pnpm.io/) package manager

## Getting started

Install dependencies for all workspaces:

```bash
pnpm install
```

Start the development environment (server, client and electron will run concurrently):

```bash
pnpm dev
```

## Building

To create production builds for all packages run:

```bash
pnpm build
```

## Testing

Tests are written with Jest and located in the `tests/` directory. Run them with:

```bash
pnpm exec jest
```

## Environment variables

Copy `.env.example` to `.env` and fill in the required values before running the application.

The `LOG_LEVEL` environment variable controls server log verbosity. Leaving it
unset uses `info` level logging. Set `LOG_LEVEL=debug` for detailed WebSocket
traces when troubleshooting connection issues.

For email notifications of offline messages configure the `SMTP_*` variables in
`.env`.

