# Safety design: crisis support ("Most segítségre van szükségem")

Status: v0.6.0 (React), 2026-10-29. **Pending clinical sign-off** ([CLINICAL-REVIEW.md](CLINICAL-REVIEW.md)).

The crisis module is the most safety-critical part of the app. A person opening it may be in acute distress, in withdrawal, or at risk. This document records what the module guarantees, why it is built this way, and what still needs expert confirmation.

## 1. Legal and clinical boundary

- The app **"segít követni és támogatni"** ("helps track and support"). It is **not a medical device, does not treat or cure**, and does not replace a doctor, psychologist or addictologist. This disclaimer is shown on the crisis screen itself, in the static fallback, during setup and in Settings.
- No content about medication, dosage or tapering. No success claims.
- The tone is enforced by `tests/copy.test.js` (no blame, shame, reset, identity labels or medical claims).

## 2. Access guarantees

| Guarantee | How | Verified by |
|---|---|---|
| **One tap from every screen**, including first-run setup and the lock screen, with no PIN needed | `<CrisisButton/>` (a plain link to `#/segitseg`) in the sticky header of every screen opens `<CrisisOverlay/>`, a modal `<dialog>` layered over the current screen. Unfinished input underneath is kept; Esc, "Vissza" or Back closes it. | e2e: tapped from the setup screen before any data exists; the half-typed PIN is intact afterwards |
| From the home screen without opening the app | Manifest shortcut "Segítség most" (long-press the icon) | `tests/pwa.test.js` |
| **Works offline** | The build-generated service worker precaches every emitted file. Calls are `tel:` links (phone network, not internet). | e2e: offline → crisis overlay, all four `tel:` links, breathing animation. jsdom: with `fetch`/XHR/WebSocket stubbed to fail, every helpline is an accessible `tel:` link whose click is not intercepted (`tests/components/CrisisOverlay.test.jsx`) |
| **Works when storage, encryption or the journal are broken** | The crisis components import nothing from `storage/`, `crypto/` or `auth/` | `tests/crisis.test.js` (import-graph check) |
| **Works when the JS bundle fails to load** | Static helpline fallback in `index.html`, revealed by a CSS-only timer after 2.5 s (no inline script, so the CSP stays strict) | e2e: the bundle request is aborted → fallback visible |
| **Works with JavaScript disabled** | The same fallback, shown immediately via `<noscript>` CSS (`!important`, because Vite links the main stylesheet after it) | e2e: JS disabled |
| Displayed number = dialled number | `displayMatchesTel()` for every line | `tests/crisis.test.js` |
| Fallback HTML stays in sync with the app's helpline list | Every `tel:` and number from `HELPLINES` must appear in `index.html` | `tests/crisis.test.js` |
| Desktop / tablet without telephony | "Szám másolása" button (shown only on `hover:hover` + `pointer:fine` devices). If the clipboard is blocked, it selects the number for manual copying. | `tests/crisis.test.js` |
| Easy exit | "Vissza" in the header and at the bottom, plus `Esc` | e2e |
| **Nothing about a crisis visit is recorded** | No logging, analytics or storage write anywhere in the module. Calls are plain links. | Code review; `connect-src 'none'` CSP |

## 3. Screen order (rationale)

1. **Immediate danger: 112**, as a separate bordered banner, not one option among many. The guidance names medical warning signs, including severe withdrawal (alcohol and benzodiazepine withdrawal can be life-threatening).
2. **A person to talk to:** S.O.S. 116-123 (primary, highlighted), the Drog Stop addiction line, and Kék Vonal (under 24).
3. **Tailored note** for late nights, weekends, or the user's own recurring hard hours (the last only when the journal is already unlocked; nothing is decrypted for this).
4. **Self-soothing:** breathing exercise, urge-as-a-wave, concrete next steps, 5-4-3-2-1 grounding.
5. Offline note and disclaimer.

## 4. Helplines and verification status

| Line | Number | `verification` | Evidence (2026-10-29) | Before public launch |
|---|---|---|---|---|
| Általános segélyhívó | 112 | official | EU emergency number | — |
| S.O.S. Lelki Elsősegély Telefonszolgálat (LESZ) | 116-123 | official | National S.O.S. line run by LESZ: free, 24/7, anonymous, domestic calls only (several press and directory sources, LESZ-linked pages) | Test call |
| Drog Stop segélyvonal | 06-80-505-678 | **multiple-secondary** | Five independent secondary sources agree it is a free line, some marked "Non-Stop" (PTE university page, municipal and helpline directories). The operator's own site could not be reached from the build environment. One directory lists a different number (13-770), which is **not used**. | **Required:** a test call plus confirmation on drogstoponline.hu. Hours are deliberately not claimed in the UI. |
| Kék Vonal | 116-111 | official | Free, anonymous, for under-24s | Test call |

**Release rule:** a wrong number on this screen is a P0 incident. Every release requires a test call to each number, then an update to `verified` in `src/content/hu.js`. Numbers rated `multiple-secondary` must be upgraded to `official` or removed before public launch.

## 5. Breathing exercise

- **Patterns:** *Hosszú kilégzés* 4-6 (default: an extended exhale, generally the gentlest), *Négyzetlégzés* 4-4-4-4, and *4-7-8*. The 4-7-8 description says to switch to the default if the hold feels uncomfortable or causes dizziness.
- **Engine:** `src/domain/breathing.js` computes the state from elapsed clock time, not from counted timer ticks. Phones throttle timers when the screen dims or the tab is in the background, and a tick counter would drift or stall. This engine shows the correct phase as soon as it runs again (unit tested).
- **Explicit step `kind`** (`in`, `hold`, `out`) drives the animation. Clinicians can reword any label without breaking it.
- **Pause / resume** freezes the circle exactly where it is. Paused time does not count.
- **Screen Wake Lock** keeps the display on while the exercise runs (where supported), so the phone doesn't dim mid-breath.
- **`prefers-reduced-motion`:** the circle stays static, while the step label (announced politely to screen readers) and the countdown keep guiding (e2e).
- No audio, no vibration (they could reveal the activity to people nearby). Both are candidates for an opt-in later.

## 6. Open safety questions for the clinical reviewer

1. Is 4-7-8 appropriate during withdrawal or panic, or should it be removed or moved behind a caution?
2. Should a dedicated **withdrawal warning card** appear above the talk lines (symptoms that require 112 or 104)?
3. Should the crisis screen be offered automatically after logging a slip?
4. Should local AA/NA meeting finders or a family-member line be added?
5. Wording of the risk notes for late nights, weekends and personal patterns.

## 7. Change checklist for this module

- [ ] Any change to `HELPLINES` updates the `index.html` fallback (a test fails otherwise)
- [ ] `npm test && npm run e2e` pass (the e2e covers offline, reduced motion, module failure and no-JS)
- [ ] Helpline number/label layout is checked on a phone (the e2e measures overlap and overflow)
- [ ] Copy changes go through clinical review
