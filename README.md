# Light the diya — Annakut Mahotsav 2026

One page, in English and Gujarati. It opens on an unlit diya. The visitor
brings out a burning fuljadi, touches it to the wick, and the fireworks begin.

- Live site: <https://sanketsh4h.github.io/light-diya/>
- This is the `light-diya` branch of
  [thebaylabs/social-awareness](https://github.com/thebaylabs/social-awareness).
  The full Digital Outreach site (Bhulkao, Yuvako, the games, scenarios and
  prasangs) is on that repository's `main` branch; none of it is here.

> Gujarati text is an unreviewed draft, and the footer says so.

## What the page does

1. **Unlit diya.** The page shows the diya, the line "Light the diya to begin
   Annakut Mahotsav" and a **Light the diya** button.
2. **Fuljadi.** The button brings out a burning fuljadi above the word
   "harmony". Drag it anywhere on the screen; when its tip reaches the wick,
   the diya lights.
3. **Fireworks.** Lighting the diya starts the fireworks and shows "The diya
   is lit. Welcome."

Things to know:

- **Keyboard:** Enter or Space on the button brings out the fuljadi. Enter or
  Space again lights the diya; Escape puts the fuljadi away.
- **Reduced motion:** for visitors whose device asks for less motion, one
  press lights the diya, with no fuljadi and no fireworks.
- **Lit for the tab:** once lit, the diya stays lit until the tab is closed.
  Reloading shows the lit diya without replaying the fireworks. Open a new tab
  to light it again.
- **Other addresses:** any address other than the home page shows "Page not
  found" with a link back.

## Run it on your computer

You need Node.js 26 (see `.nvmrc`).

```bash
npm install
npm run dev
```

Then open the address it prints (normally <http://localhost:5173/>).

## Change the text

All visible text is in `locales/en.json` and `locales/gu.json`. Both files
have the same keys; change the text on the right of each line and keep the key
on the left. A unit test fails if a key is missing from either file.

Settings that are not translated (the organisation name, the copyright
holder, whether a translation has been reviewed) are in `src/config/site.ts`.

## For developers

### Stack

React, TypeScript and Vite, with React Router for the one page and its
not-found page. No backend and no third-party requests: production builds
carry a Content-Security-Policy that allows only the site's own origin.

### Scripts

| Command                | What it does                                       |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Dev server with hot reload                         |
| `npm run build`        | Type check, build to `dist/`, copy to `404.html`   |
| `npm run preview`      | Serve the built site                               |
| `npm run lint`         | ESLint, including the "no text in components" rule |
| `npm run format:check` | Prettier                                           |
| `npm run typecheck`    | TypeScript only                                    |
| `npm test`             | Unit tests (Vitest)                                |
| `npm run test:e2e`     | Browser tests (Playwright) on phone and desktop    |

### Layout

| Path                              | What is there                                     |
| --------------------------------- | ------------------------------------------------- |
| `src/pages/Intro.tsx`             | The page: diya, title and fireworks               |
| `src/components/DiyaLighting.tsx` | The lighting ritual and its keyboard support      |
| `src/components/Fuljadi.tsx`      | The fuljadi and its sparks                        |
| `src/components/DiyaLamp.tsx`     | The diya drawing, unlit and lit                   |
| `src/components/Fireworks.tsx`    | The fireworks canvas                              |
| `src/components/diya-lit.ts`      | Remembers for the tab that the diya has been lit  |
| `src/components/Layout.tsx`       | Header (logo, language switch), main area, footer |
| `src/i18n/`                       | Language detection, storage and lookup            |
| `locales/`                        | Interface text                                    |
| `tests/e2e/`                      | Browser tests                                     |

### Tests

The browser tests treat an automated browser as having already lit the diya,
so most of them start with it lit. `tests/e2e/intro.spec.ts` hides that flag
and goes through the lighting itself: by dragging, by keyboard, and with
reduced motion. Every page is also checked with axe for accessibility
violations, for horizontal overflow, and for requests that leave the site.

## Hosting

Every push to `light-diya` runs `.github/workflows/pages.yml`, which lints,
type checks, runs the unit tests, builds with the repository name as the base
path and deploys to GitHub Pages.

The live site is served from a copy of this branch at
[sanketsh4h/light-diya](https://github.com/sanketsh4h/light-diya), because
GitHub Pages is not switched on for thebaylabs/social-awareness. To deploy
there, push the branch to that repository as well.

To serve the site from a sub-path anywhere else, build with
`BASE_PATH=/your-path/ npm run build`. The build copies `index.html` to
`404.html` so that static hosts send unknown addresses to the app.
