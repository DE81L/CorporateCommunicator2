# Admin Panel Overview

The current administrator role lacks a dedicated interface. Only minimal features like editing wiki pages or removing groups are available. Administrators must use the same screens as regular users or even edit the database directly.

Key shortcomings:

- No user management UI (create, change roles, reset passwords, disable accounts)
- No content or group moderation tools
- No overview of logs or metrics
- Admin functions are visually indistinguishable from regular UI elements

## Suggested Improvements

Consider adding a separate admin section or panel:

1. **FastAPI-Admin integration** – ready-made admin interface for CRUD operations, though it primarily targets Tortoise ORM.
2. **Build a custom admin SPA** – using templates like `vue-fastapi-admin` or other Vue admin themes.
3. **Dedicated `/admin` pages** – extend the existing Vue app with hidden routes visible only to admins.

Focus features:

- User management (view, filter, create, change roles, deactivate)
- Content control (moderate messages or files)
- System settings (toggle registration, global messages, logos)

The admin panel should provide clear separation from the regular UI and group all administrative tasks in one place.
