# Agent Guidelines

 - **Testing**: After making changes run the Jest test suite with `pnpm exec jest`. The project currently ships without Jest so the command fails with `Command "jest" not found`. Try running "pnpm run type-check"
- **Tooling**: Use `pnpm` for installing dependencies and running scripts.
- **Install**: Run `pnpm install` from the repository root to set up all
  workspace packages. Missing this step can cause errors like
  `Cannot find module 'nodemailer'` when starting the server.
- **Node version**: Node.js 20 or higher is required.
- **Pull Requests**: Include a summary of changes and testing results when creating PRs.
- **API**: The `/api/departments` endpoint should return a list of departments for the request modal.
- **Client errors**: Use `showError` from `client/src/lib/error-toast.ts` instead of `console.error`.
- **Admin panel**: The app lacks a dedicated admin UI. Build or integrate an admin dashboard to manage users, groups and settings as described in docs/admin-panel-notes.md.
- **API client**: Prefer `createApiClient()` for all `fetch` calls.
- **Push**: Register device tokens via `/api/notifications/register`. The server
  sends local notifications over WebSocket when new messages are stored.
- **Sidebar**: Record all sidebar related work in `docs/sidebar-actions.md`. This file was created to track every sidebar update.
Feel free to add new things to the guidelines. This may be your notes on the project. See `docs/DEVELOPER_CHECKLIST_RU.md` for a high level TODO list in Russian.

Note: Message bubbles use a lighter primary color for sent messages on the right and a darker gray for received messages on the left.

