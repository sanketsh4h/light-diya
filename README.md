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

1. **Unlit diya.** The page shows only the diya, the line "Light the diya to
   begin Annakut Mahotsav" and a **Light the diya** button.
2. **Fuljadi.** The button brings out a burning fuljadi. Drag it anywhere on
   the screen; when its tip reaches the wick, the diya lights.
3. **Waiting for the others.** Once the diya is lit, a bar appears under it
   with "Let's wait for others to light their diya" and a count such as
   "37 of 100 diyas lit". It fills as other people light their diyas on their
   own devices. The bar is not shown before the diya is lit.
4. **Welcome and fireworks.** When 100 different devices have lit their diya,
   the fireworks start and the title "Annakut Mahotsav 2026", "Atmiyata" and
   "True happiness lies in living in harmony" appear, on every device that is
   waiting. These lines are out of sight until then, though screen readers can
   read them at any time.

Things to know:

- **Keyboard:** Enter or Space on the button brings out the fuljadi. Enter or
  Space again lights the diya; Escape puts the fuljadi away.
- **Reduced motion:** for visitors whose device asks for less motion, one
  press lights the diya, with no fuljadi and no fireworks. The bar and the
  welcome work the same.
- **Every visit:** each time the page is opened or reloaded, the diya is
  unlit again. A device is still counted only once.
- **After the 100th diya:** anyone who lights their diya later sees the
  welcome and the fireworks straight away.
- **Other addresses:** any address other than the home page shows "Page not
  found" with a link back.

## The shared count

The count of lit diyas is kept in a Firebase Firestore database. **Until the
two Firebase settings below are given to the build, the site has no waiting
bar: lighting the diya shows the welcome and the fireworks at once.**

### How it works

- When a diya is lit, the device adds one empty document to Firestore, named
  by a random 20-character id that the device keeps in its browser storage:
  `diyaRounds/annakut-2026/lights/<id>`. The id says nothing about the device
  or its owner, and nothing else is sent.
- While waiting, the page asks Firestore for the number of documents every
  few seconds (less often after a while, and rarely when the tab is in the
  background). It stops asking once the count reaches 100.
- The goal (100) and the name of the count (`annakut-2026`) are `DIYA_GOAL`
  and `DIYA_ROUND` in `src/config/site.ts`.

### Set it up

1. In the [Firebase console](https://console.firebase.google.com/), create a
   project (or pick one), and create a Firestore database in it.
2. Add these security rules. In a project used only for this page, they can
   be the whole rules file. In a project that other sites also use, add only
   the `match /diyaRounds/...` block to that project's existing rules, or
   their rules will be replaced.

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // One empty document per device that has lit its diya. Anyone may add
       // their own and count them; nobody may read, change or delete one.
       match /diyaRounds/{round}/lights/{device} {
         allow list: if true;
         allow create: if device.matches('^[a-z0-9]{20}$')
           && request.resource.data.size() == 0;
         allow get, update, delete: if false;
       }
     }
   }
   ```

3. Register a web app in the project (Project settings → Your apps) and copy
   its `apiKey` and `projectId`. They are not secret: they end up in the
   site's code, and the rules above are what protect the data.
4. Give them to the build as `API_KEY` and `PROJECT_ID`:
   - **GitHub Pages:** repository variables (Settings → Secrets and variables
     → Actions → Variables), then run the deploy workflow again.
   - **Your computer:** copy `.env.example` to `.env.local` and fill it in.

### Start the count again

After a rehearsal, either delete the `diyaRounds/annakut-2026/lights`
collection in the Firebase console, or change `DIYA_ROUND` in
`src/config/site.ts` and deploy again.

### Limits

- The count trusts the browser. Someone who knows how could add documents
  without lighting a diya; there is no sign-in to prevent it.
- Each waiting device reads the count about once every 3 to 8 seconds.
  Firestore's free plan allows 50,000 reads a day, which is about 100 people
  waiting for an hour. For a larger crowd or a longer wait, use the
  pay-as-you-go plan, where this costs a few cents.

## Run it on your computer

You need Node.js 26 (see `.nvmrc`).

```bash
npm install
npm run dev
```

Then open the address it prints (normally <http://localhost:5173/>).

Without Firebase settings, the dev server pretends: once you light the diya,
"other people" light theirs over about 15 seconds, so you can see the bar
fill and the welcome appear.

## Change the text

All visible text is in `locales/en.json` and `locales/gu.json`. Both files
have the same keys; change the text on the right of each line and keep the key
on the left. A unit test fails if a key is missing from either file.

Settings that are not translated (the organisation name, the copyright
holder, whether a translation has been reviewed) are in `src/config/site.ts`.

## For developers

### Stack

React, TypeScript and Vite, with React Router for the one page and its
not-found page. The only request that leaves the site is to Firestore, for
the shared count, through its REST API (no Firebase code is loaded).
Production builds carry a Content-Security-Policy that allows the site's own
origin and, when Firebase is configured, `firestore.googleapis.com`.

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
| `src/crowd/`                      | The shared count, its polling and the waiting bar |
| `src/components/Layout.tsx`       | Header (logo, language switch), main area, footer |
| `src/i18n/`                       | Language detection, storage and lookup            |
| `locales/`                        | Interface text                                    |
| `tests/e2e/`                      | Browser tests                                     |

### Tests

The site plays no opening fade-in or fireworks in an automated browser, where
a page mid-fade would fail colour-contrast checks. `tests/e2e/intro.spec.ts`
hides that flag and goes through the lighting as a visitor does: by dragging,
by keyboard, and with reduced motion. The test build has made-up Firebase
settings, and `tests/e2e/fake-crowd.ts` answers its Firestore requests, so the
waiting bar is tested without anything leaving the test. Every page is also checked with axe for accessibility
violations, for horizontal overflow, and for requests that leave the site.

## Hosting

Every push to `light-diya` runs `.github/workflows/pages.yml`, which lints,
type checks, runs the unit tests, builds with the repository name as the base
path and deploys to GitHub Pages. It passes the repository variables `API_KEY`
and `PROJECT_ID` to the build (see [The shared count](#the-shared-count)).

The live site is served from a copy of this branch at
[sanketsh4h/light-diya](https://github.com/sanketsh4h/light-diya), because
GitHub Pages is not switched on for thebaylabs/social-awareness. To deploy
there, push the branch to that repository as well.

To serve the site from a sub-path anywhere else, build with
`BASE_PATH=/your-path/ npm run build`. The build copies `index.html` to
`404.html` so that static hosts send unknown addresses to the app.
