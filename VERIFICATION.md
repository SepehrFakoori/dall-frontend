# Verification — 16 November 2026

Executed locally with Node 24.22.1 and pnpm 11.25.0.

| Check                         | Result                                        |
| ----------------------------- | --------------------------------------------- |
| TypeScript strict check       | Passed (`pnpm typecheck`, also part of build) |
| ESLint                        | Passed, zero warnings                         |
| Prettier                      | Passed                                        |
| Vitest                        | 5 files, 12 tests passed                      |
| Playwright / installed Chrome | 11 workflows passed                           |
| axe                           | 52 page scans, zero violations                |
| Environment builds            | Development, staging and production passed    |
| Dependency peers              | No issues                                     |
| Production Vite build         | Passed, lazy feature chunks generated         |
| Docker image build/runtime    | Not run: Docker is not installed on this host |

Browser coverage includes directory search, status filters, pagination, selection and confirmed bulk deactivation; inline required and duplicate validation; submission failure with retained input and successful retry; create/edit/detail; unsaved navigation protection; request failure/recovery; read-only UI and direct route guarding; language/calendar/theme controls; mobile navigation closing after selection; keyboard dialog opening, Escape dismissal and focus return.

The directory was checked at 1440, 820 and 390px in English/LTR and Persian/RTL, each with light and dark tokens (12 combinations). Overview, new-member form, detail and settings were checked at 1440 and 390px across both languages/themes (32 additional combinations). Every combination ran axe and checked document overflow. Screenshots and failure traces are generated in ignored `test-results/`.

The account workflows check rejected credentials, protected deep links, session restoration, profile validation and persistence, and sign-out. Login and account each ran axe in English and Persian at 390 and 1440px. Direction checks cover page layout, mixed-script names, email, portaled menus, and keyboard navigation. The restore workflow checks retry and write permissions. HTTP tests cover caller-supplied headers, same-origin CSRF handling, malformed JSON and permission errors with an empty JSON value.

Visual inspection included the actual rendered overview, directory and preferences, plus browser screenshots of tablet LTR, mobile RTL, form and detail layouts. Keyboard dialog interaction was also manually exercised in the preview browser. Corrections included light-theme contrast, containing visually hidden table text, hiding the long RTL skip link fully until focused, and closing the mobile drawer after navigation.

Configuration checks covered a clean checkout, the three mode files, process-variable precedence, and an optional upstream path. A synthetic unlisted `VITE_` variable stayed out of the browser bundle. The development server denied HTTP access to the mode file. Git ignore checks covered the working files, unrelated files in `env/`, and the sample exception.

The account form browser check covers keeping a draft when a user cancels navigation. Deployment against the live backends and a Docker image smoke test remain unverified. See [README](README.md).

The 40 Iconsax Outline symbols matched the upstream path geometry. Chrome rendered every symbol from the production sprite in two different text colors. Browser tests checked that the sign-in arrow rendered and mirrored in Persian while the password visibility icon retained its orientation at 390px and 1440px. All three builds included the sprite and its upstream license.
