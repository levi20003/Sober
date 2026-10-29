# Józanság-számláló

A private, offline-first, Hungarian-language PWA that **helps track and support** a person's sobriety journey. It is not a medical device.

- **Local-first, zero-server:** no account, no cloud, no analytics, no third-party code. A CSP with `connect-src 'none'` makes network exfiltration impossible from the page.
- **Encrypted from day one (zero-knowledge):** AES-256-GCM envelope encryption, a key derived from a 4+ digit PIN or passphrase (PBKDF2 600k, per-device salt), and a recovery code. An explicit `FIRST_TIME_SETUP → LOCKED ⇄ UNLOCKED` state machine locks on inactivity and `pagehide`. Storage is IndexedDB → localStorage → memory.
- **No punishing resets:** an append-only event timeline driven by a pure reducer. A slip ("Újrakezdés") archives the current phase as a growth block, with its lesson and an intention for the next phase, and opens a new one. The home screen leads with *total* sober days, a visual timeline bar and the current phase; a brand-new phase never shows a bare "0 nap".
- **One-tap crisis overlay** (`<CrisisOverlay/>`, a modal `<dialog>` over the current screen, so an unfinished form survives) on every screen, including before setup and while locked, and offline. It has a 112 banner, the S.O.S. 116-123, Drog Stop and Kék Vonal lines (`tel:` links), and a clock-driven breathing exercise (4-6, box, 4-7-8; reduced-motion and wake-lock aware). It also offers grounding and urge-surfing guidance tailored to late nights, weekends and the user's own hard hours. A static HTML fallback keeps the helplines up even if a JS module fails or JS is disabled. See [docs/SAFETY.md](docs/SAFETY.md).
- **HUF savings that stay honest:** the daily cost is effective-dated, so a price change "from today" never re-values past days, while "correct everything" re-values on purpose. The home screen shows tangible alcohol-free milestones and an optional personal goal.
- **Quick log in 2 taps:** preset cards ("Stresszes nap", "Társasági nyomás", "Esti szokás", "Nyugodt / Kiegyensúlyozott", …) → "Rögzítés". Intensity and an encrypted note are optional; no typing is required.
- **Data ownership:** encrypted backup, CSV (UTF-8 BOM, `;`) and JSON export, and single-step delete-all.

## Run

React 19 PWA built with Vite. The shipped app has **3 runtime packages** (react, react-dom, scheduler). Every package is pinned to an exact version that was at least two weeks old when added (see [docs/SECURITY-MODEL.md](docs/SECURITY-MODEL.md#supply-chain)).

```bash
npm ci            # exact versions from package-lock.json
npm run dev       # Vite dev server (CSP relaxed for hot reload only)
npm test          # Vitest: 152 tests (logic + jsdom component tests, offline crisis, property tests)
npm run build     # → dist/ (CSP kept, service worker generated with a content-hash version)
npm run serve     # serve dist/ with production security headers on http://127.0.0.1:8080
npm run e2e       # build + 20-step end-to-end run in real Chromium (Playwright)
```

## Layout

```
index.html (+ static no-JS crisis fallback), vite.config.js, public/ (manifest, icons, _headers, noscript.css)
src/
  main.jsx, App.jsx     bootstrap, providers, routing, lock-aware layout
  hooks/                useTimeline, useCrisis, useAuth, useBreathing, useHashRoute, useToast, useFormAction, useModalDialog
  components/           crisis/ (CrisisOverlay, BreathingExercise, HelplineList, CrisisButton),
                        timeline/ (TimelineView, PhaseCard, TimelineBar, FreshStartModal),
                        savings/, screens/, QuickLog, PinFields, ui primitives
  sw/sw.template.js     service worker; filled in at build time (scripts/precache.js)
  crypto/vault.js       Web Crypto envelope encryption, recovery codes
  auth/appAuth.js       lock state machine (setup/unlock/recover/lock/reset), lifecycle auto-lock
  storage/backends.js   IndexedDB (atomic) → localStorage (rollback) → memory, typed StorageError
  storage/store.js      VaultStore: create/unlock/save/recover/backup/wipe, throttling, prev-copy
  domain/schema.js      payload schema, validation, migration
  domain/timeline.js    phases, phase summaries & stats derived from events (no-reset logic)
  domain/timelineReducer.js  the only way the timeline changes (append-only, frozen, effects)
  state/timelineStore.js     reducer → encrypted save → subscribers (persist-then-commit)
  domain/savings.js     effective-dated HUF savings, milestones, goal, input parsing & formatting
  domain/risk.js        late-night / weekend / personal-pattern detection
  domain/breathing.js   clock-driven breathing engine + controller (pure, tested)
  domain/helplines.js   tel: links, display/dial consistency, copy fallback
  domain/export.js      CSV (BOM, formula-safe) & JSON export/import
  domain/presets.js     mood / trigger / coping presets
  content/hu.js         ALL user-facing copy + helplines (single review surface)
  reminders.js          server-less, neutral, one-tap-opt-out reminders
tests/                  Vitest suites; tests/components/ = jsdom component tests
scripts/                dev server, e2e
docs/                   security model, schema, clinical review, user testing, deployment
PRIVACY.md              user-facing privacy notice (Hungarian)
```

## Documentation

- [PRIVACY.md](PRIVACY.md): privacy notice (HU)
- [docs/SAFETY.md](docs/SAFETY.md): crisis support design, helpline verification, release rule
- [docs/SECURITY-MODEL.md](docs/SECURITY-MODEL.md): crypto, threat model, residual risks, launch checklist
- [docs/DATA-SCHEMA.md](docs/DATA-SCHEMA.md): payload schema and phase-counting rules
- [docs/CLINICAL-REVIEW.md](docs/CLINICAL-REVIEW.md): expert review scope, open questions, sign-off table
- [docs/USER-TESTING.md](docs/USER-TESTING.md): coping-focused test protocol
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): hosting and release steps

## Status

v0.6.0, functional prototype (React). **Not for public release** until the clinical sign-off and an independent security review are done (see the launch checklist in SECURITY-MODEL.md).
