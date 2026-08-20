# Portfolio Platform

This workspace contains a Next.js portfolio frontend and independently deployable Python services.
See [the service catalog](docs/SERVICES.md) for service boundaries and local setup.

## Frontend

Copy `.env.example` to `.env.local`, install dependencies with `npm ci`, then run `npm run dev`.

Run `npm run lint`, `npm run typecheck`, and `npm run build` before opening a pull request.

## Security

Apply [secure_contact_submissions.sql](scripts/secure_contact_submissions.sql) before enabling the contact endpoint. If needed, explicitly expose the `public` schema in Supabase Data API settings first.
Set `CONTACT_RATE_LIMIT_SALT` to a high-entropy secret. Only enable `TRUST_PROXY_HEADERS` behind a proxy that overwrites forwarding headers.
Configure explicit `ALLOWED_ORIGINS` for every Python service. Analytics are opt-in and collect no IP address or location.
