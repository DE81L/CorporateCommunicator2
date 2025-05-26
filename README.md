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
- Python 3 (required only when using the `-pyws` flag)

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

To verify that WebRTC connectivity works in your environment run the P2P
connection check script. Node does not include WebRTC APIs by default. Install
the optional `werift-webrtc` dependency if you want to run the check under Node
without built‑in WebRTC support:

```bash
pnpm add -w werift-webrtc
```

```bash
pnpm run check:p2p
```

The script merges any `STUN_SERVER`, `VITE_STUN_SERVER` or `TURN_SERVER`
values from the environment with Google’s public STUN server and the list in
`scripts/stun-servers.json`. Candidate gathering is awaited before signalling
to improve reliability. The checker automatically appends `?transport=udp` to
each ICE server URL and prints candidate types for easier debugging.

## Environment variables

Copy `.env.example` to `.env` and fill in the required values before running the application.

The `LOG_LEVEL` environment variable controls server log verbosity. Leaving it
unset uses `info` level logging. Set `LOG_LEVEL=debug` for detailed WebSocket
traces when troubleshooting connection issues.

To enable push notifications set the `FCM_SERVER_KEY` in `.env` with your
Firebase Cloud Messaging server key.

Set `VITE_STUN_SERVER` in `.env` to override the STUN server used by the client
for peer connections. Use `VITE_STUN_SERVER=none` to disable STUN entirely when
both peers are on the same local network.

During development you can pass `-localp2p` to `pnpm run dev` to temporarily
disable STUN/TURN and force local peer discovery:

```bash
pnpm run dev -localp2p
```

Pass `-pyws` to start the Python WebSocket server which mirrors the Node
implementation. When this flag is used the Node WS server will not start:

```bash
pnpm run dev -pyws
```
On Windows the script uses `py -3` to launch Python automatically.
The Python implementation handles signaling events and broadcasts user status
just like the Node version.

