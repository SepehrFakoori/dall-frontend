# Dall frontend foundation

A React/TypeScript workspace with username/password sign-in, an editable personal account, a sample member directory, preferences, and a development component library at `/components`.

## Environments

| Environment | Frontend configuration | Backend base URL          | Build command            |
| ----------- | ---------------------- | ------------------------- | ------------------------ |
| Development | `.env.development`     | `http://localhost:8000`   | `pnpm build:development` |
| Staging     | `.env.staging`         | `https://staging.dall.ir` | `pnpm build:staging`     |
| Production  | `.env.production`      | `https://api.dall.ir`     | `pnpm build:production`  |

`pnpm dev` uses development. `pnpm build` defaults to production. After building, use `pnpm preview --mode staging` (or the corresponding mode) to preview that build. Use `pnpm demo` to run the standalone browser demo with username `demo` and password `Dall-Demo-2026`.

Set `BACKEND_BASE_URL` in each mode file. Use a mode-specific override such as `.env.development.local` for local work, or set the variable in the build environment. If a backend later adds a path, append it to its base URL and rebuild.

The browser calls its own origin at `/api/`. Vite and the packaged Nginx configuration forward the suffix to the selected backend. For example, the staging build forwards `/api/auth/session/` to `https://staging.dall.ir/auth/session/`. The backend must trust its frontend's HTTPS origin for CSRF-protected writes. For a static host, configure its gateway to forward the same path and send API requests there before applying the SPA fallback. Each build writes the corresponding Nginx location to `dist/api-location.conf`.

## Local development

Use Node 24 and pnpm 11.25.0. From `frontend/`:

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e
pnpm build
pnpm preview
```

Browser tests use an installed Google Chrome (`channel: chrome`). For CI, provision Chrome or change the project to bundled Chromium and run `pnpm exec playwright install chromium`. Test screenshots and traces are in ignored `test-results/`. Do not commit browser-local records or test artifacts.

## Boundaries and dependencies

- `src/app`: composition, nested data router, navigation, route errors. All feature pages are lazy chunks.
- `src/features/members`: canonical schema, typed asynchronous demo adapter, query keys, list, form and detail. `overview` consumes this public query interface. `settings` contains regional controls and explicitly labeled demo tools.
- `src/features/account` contains the sign-in and personal profile screens. `src/shared` provides the session context, account adapters, locale, UI primitives, and HTTP client.
- `src/styles`: semantic tokens followed by component/layout rules. No global server-state store.

React Router data mode provides URL state, route splitting, and navigation blockers. TanStack Query owns records and invalidation; React Hook Form + Zod own form state and field errors. Radix supplies focus-managed dialogs, menus, popovers, tabs, switches and tooltips. Native inputs and selects handle ordinary controls. Lucide is the sole icon library. Plain CSS avoids an additional styling runtime. TypeScript 6.0 is intentionally selected because the current stable TypeScript ESLint parser requires `<6.1`; latest TypeScript 7 is incompatible. Resolved stable versions are locked, with no peer-dependency errors.

Official references checked during setup: [React releases](https://react.dev/community/versioning-policy), [Vite setup](https://vite.dev/guide/), [Router data mode](https://reactrouter.com/api/data-routers/createBrowserRouter), [Query](https://tanstack.com/query/latest/docs/framework/react/overview), [React Hook Form](https://react-hook-form.com/get-started), and [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog).

## Extending the application

1. Add a business feature under `src/features/<module>` with its own schema, API adapter, query keys and pages. Reuse shared primitives instead of importing another feature's internal components.
2. Register a lazy child route in `src/app/router.tsx`, then a permission-aware navigation entry in `shell.tsx`. Guard direct routes as well as buttons. The server must independently authorize every read and write.
3. Put reusable interaction primitives in `shared/ui.tsx` (split into focused files as this grows). `shared/data-table.tsx` supplies the named, keyboard-focusable native table scroll region. Keep business-specific table cells and forms in their feature. Use the member directory as the initial table pattern: labeled selection, stable IDs, row actions, responsive scroll and pagination. Avoid abstracting a domain framework prematurely.
4. Add every UI message to `shared/i18n/messages.ts`. Persian is a complete typed dictionary; English is the fallback. `t()` interpolates named placeholders; `count()` uses `Intl.PluralRules`. Entity content is not translated. Use `<bdi>` or `dir="ltr"` for mixed-direction identifiers, emails and telephone numbers.

## Visual and regional conventions

The language preference sets HTML `lang` and `dir` and the Radix direction provider before paint. Persian uses RTL, and English uses LTR. Menus, tab keyboard navigation, drawers, and directional icons follow the interface. Names and notes can mix scripts. Email addresses and phone numbers use LTR. Persian uses the supplied self-hosted IRANSansX variable WOFF2. A Unicode-range face also selects it for Persian glyphs within English UI. The regular numeral variant preserves the independent numbering preference.

`styles/tokens.css` owns semantic surfaces, text, action and feedback colors, typography, 4px spacing scale, control heights, borders, elevation, layers, motion and density. Add semantic tokens before adding a new variant. Layout uses logical properties. Media-query boundaries are 720px and 1080px; custom properties cannot be substituted into native media query conditions. Dense tables scroll within their container on small screens. Forms collapse to one column.

Light/dark/system choice persists on this device; system changes are observed and the media listener is cleaned up. The development showcase demonstrates primitives and states. Native date controls use the browser's date-entry behavior; stored business dates remain ISO date-only strings. Presentation uses the independent calendar preference with UTC date-only formatting; timestamps use the selected time zone. Default interface language is English, time zone Asia/Tehran, calendar Gregorian, currency USD and digits Latin. Switching to Persian only changes language/direction. Currency examples use canonical decimal strings; no financial arithmetic or conversion is performed. Production financial contracts should use decimal strings or integer minor units end-to-end.

## Data, authentication and permissions

In the standalone demo (`VITE_API_MODE=mock`), open `/login` with username `demo` and password `Dall-Demo-2026`. A tab-local sample sign-in flag survives refresh. The sample profile and member directory stay in browser local storage. The public demo credentials and demo role switch exercise the UI only. Use sample data here.

Real account flows use the backend's Django session and CSRF cookies. The account adapter expects these browser-facing routes.

- `GET /api/auth/session/` bootstraps the CSRF cookie and returns the current user or null. The client rechecks the session on tab activation.
- `POST /api/auth/login/` accepts a username and password and establishes the Django session. The browser sends the HttpOnly session cookie automatically. The frontend reads Django's default `csrftoken` cookie and sends `X-CSRFToken` on writes.
- `PATCH /api/auth/profile/` accepts only `first_name`, `last_name`, and `email` for the signed-in user. The username remains the sign-in identifier. Updating this profile is independent of directory-management privileges.
- `POST /api/auth/logout/` clears the server session. Private routes return to sign-in, including after a profile write reports session expiry.

Django mode opens My account. The sample directory is available in the standalone demo. Integrating the member directory requires the selected organization, scoped permissions, and read/write endpoints for its fields.

Queries are fresh for 30 seconds. Only server 5xx read failures retry once; network/401/403 and mutations do not retry automatically. Submission is disabled while pending. Cache invalidation follows writes. Selection is limited to eligible rows on the current page and clears on URL changes. Search/status/sort changes reset the page; search replaces history, other controls create shareable entries. Search is local over a small dataset, so it needs no network debounce or virtualization. A real server-side list must include list parameters in its query key and debounce requests.

`shared/http.ts` exposes `reportError` through a `dall:error` event. Attach a production reporter to this sanitized code-only event. Do not log records, cookies, credentials or raw exception payloads.

## Docker and deployment

From `frontend/`:

```sh
docker build -t dall-frontend .
docker run --rm -p 8080:8080 dall-frontend
```

The image builds production by default. Choose staging with `docker build --build-arg FRONTEND_ENV=staging -t dall-frontend:staging .`. Nginx loads the API location generated by that build and serves the frontend on port 8080. For a containerized development build, configure a backend address reachable from the container because localhost refers to the container itself.

## Verification and limits

Run the commands above after changes. Unit/integration checks cover schemas, URL parsing, filtering, cancellation, API failure recovery, stable mutations and locale persistence. Browser tests cover member workflows, selection, guard behavior and responsive LTR/RTL light/dark layouts with axe checks. Automated accessibility checks supplement keyboard and visual inspection; they do not certify WCAG compliance.

Directory backend integration, production audit logging and scoped permission mapping remain integration work. Native date inputs use the browser's calendar. The small demo loads all directory records and keeps directory changes local. Docker must be built and smoke-tested on a host with Docker installed before release.
