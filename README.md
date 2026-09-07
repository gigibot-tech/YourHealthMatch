# YourHealthMatch

Matching-first telemedicine for international patients and practices. Patients describe language, insurance, specialty, and location; the app ranks practices, then books, waitlists, or opens another system (Doctolib, Doctena, and similar). Video is a plugin, not the product.

## Patient beginning

1. **Role** (`/`) — patient or doctor (start onboarding, or skip onboarding for the Greifswald demo clinic).
2. **Profile** (`/patient/requirements`) — language, match requirements, and booking apps you already use. Language and systems are not separate tabs.
3. **Match** (`/patient/match`) — ranked practices from your profile; edit requirements from that page. Waitlist if none; shortcuts into other apps.
4. **Book → confirm → dashboard** — pick a slot the doctor opened, then join video only when the appointment allows it.

Doctors land on the queue (`/doctor/dashboard`), then practice profile and schedule.

## Develop

```bash
npm install
npm run dev          # SvelteKit at http://localhost:5173
npm test             # Vitest
npm run build        # static output in build/
```

Desktop shell (after a web build or with the Vite dev server):

```bash
npm run tauri:dev
```

Agora token API (optional, same as before): set `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE`, then `npx netlify dev` or the Express backend.

## Deploy (Netlify)

- Build: `npm run build` → publish `build/`
- Functions: `netlify/functions` (`/api/interest`, Agora `/api/*`)
- SPA fallback: `/*` → `/index.html`

## Layout

- `src/` — SvelteKit app (domain, application services, routes)
- `src-tauri/` — Tauri v2 desktop wrapper
- `public/` — previous vanilla portal (cancellation policy still lives here)
- `legacy-src/` — previous React Native TypeScript sources
- `backend/` — Express / Docker API for local token testing
