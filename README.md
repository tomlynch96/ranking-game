# Party Rank 🏆

A mobile-friendly multiplayer party game. Everyone gets a **secret target rank**
and writes a category ("most likely to survive on Mars"). The group ranks each
other, a Borda-count consensus decides the final order, and you score by landing
as close to your secret target as possible. Once per round someone gets a
**sabotage mission**: sink their mark to last place for double points.

4–10 players (3 minimum), one phone each. Share a link or a 4-letter room code.

## How it's built

- **Vite + React** single-page app, mobile-first UI, drag-and-drop ranking
  (dnd-kit, with ▲▼ buttons as a fallback).
- **Firebase Realtime Database** for multiplayer sync. There is no server:
  all game logic lives in pure reducer functions (`src/game/engine.js`) that
  clients apply through Firebase transactions. The host's device drives timers
  and phase changes; if the host drops, another player's device automatically
  takes over.
- Timers: ~40s to write a category, 25–45s to vote (scales with player count).
  AFK players get a fallback category auto-filled; missing ballots are simply
  excluded (the neutral treatment).

> **Note:** this repo is already wired to the `ranking-game-44c68` Firebase
> project (the web config is baked into `src/firebase.js` — it's public by
> design). To point it at a different Firebase project, create a `.env` from
> `.env.example`; those values take precedence. Either way, the database
> **rules** must be published (step 3 below / `database.rules.json`).

## 1. Firebase setup (one-time, ~5 minutes)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and
   **Add project** (any name, Analytics not needed).
2. In the left sidebar: **Build → Realtime Database → Create database**.
   Pick the region closest to your players and start in **locked mode**.
3. Go to the **Rules** tab of the Realtime Database and paste the contents of
   [`database.rules.json`](database.rules.json), then **Publish**. (Or deploy
   them with the CLI in step 3 below.)
4. Project overview → click the **`</>` (Web)** icon to register a web app
   (no hosting checkbox needed yet). You'll be shown a `firebaseConfig` object.
5. In this repo: `cp .env.example .env` and fill in the values from that config:

   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.europe-west1.firebasedatabase.app
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_APP_ID=1:1234:web:abcd
   ```

   `VITE_FIREBASE_DATABASE_URL` is shown at the top of the Realtime Database
   page — make sure it's the full `https://...firebasedatabase.app` URL.

## 2. Run locally

```bash
npm install
npm run dev
```

Open the printed URL. To test multiplayer on your own, open extra
private/incognito windows (each browser profile is a separate player).

## 3. Deploy (Firebase Hosting)

```bash
npm run build
npx firebase-tools login
npx firebase-tools deploy --only hosting,database --project YOUR_PROJECT_ID
```

`firebase.json` is already set up (hosting serves `dist/`, and the database
rules deploy from `database.rules.json`). Your game will be live at
`https://YOUR_PROJECT_ID.web.app` — send anyone the link and they can join.

Any static host (Netlify, Vercel, GitHub Pages) works too — only the Realtime
Database needs to be Firebase. Set the same `VITE_FIREBASE_*` variables in the
host's build environment.

## Tests

```bash
npm test
```

Runs the game-engine unit tests (Borda count, scoring, sabotage, phase
transitions, AFK handling).

## Notes & limitations

- The database rules allow anyone to read/write under `games/*` — fine for a
  casual party game with unguessable 4-letter room codes, but don't store
  anything sensitive. Secret targets are hidden in the UI, not cryptographically
  (a determined cheater with dev tools could peek — at their own social peril).
- Finished games are simply abandoned in the database; they're tiny (a few KB).
  You can periodically delete old entries under `games/` in the Firebase console
  if you like.
