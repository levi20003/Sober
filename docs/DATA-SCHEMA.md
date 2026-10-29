# Decrypted payload schema (v1)

Source of truth: [src/domain/schema.js](../src/domain/schema.js). Validation runs on every save, unlock and import, so invalid data never reaches storage.

```js
{
  schemaVersion: 2,
  profile:  { journeyStart: 'YYYY-MM-DD' },
  settings: {
    costHistory: [{ from: 'YYYY-MM-DD', dailyCostHuf: 0..1_000_000 }],  // effective-dated, strictly ascending
    savingsGoal?: { label: 1..60 chars, amountHuf: 1..100_000_000 },
    autoLockMinutes: 1..120,
  },
  events:   Event[]   // sorted by date, then time
}
```

## Savings (HUF)

Source: [src/domain/savings.js](../src/domain/savings.js).

- **Money saved = Σ over every sober day of the daily cost in effect on that day.** The cost on day *d* comes from the entry with the latest `from ≤ d`. Days before the first entry use the first entry's cost, so moving the journey start earlier still values those days.
- Computed with interval arithmetic (phases × cost segments). This is checked against a day-by-day reference implementation over 300 random histories. All amounts are integer forints and exact.
- **Changing the cost** (`SET_DAILY_COST`) offers two explicit intents:
  - `mode: 'from'` (default, "Mostantól"): prices changed. The new amount applies from the chosen date (≤ today). **Earlier days keep their value**, and later entries are replaced.
  - `mode: 'all'` ("Visszamenőleg javítom"): the original estimate was wrong. The whole period is re-valued.

  The history is compacted, so an entry equal to the cost already in effect is dropped. Before v2, a single number re-valued all past days on every edit, which invented or erased money.
- Same rules as the timeline: a slip never erases money already saved, except that a late-logged slip removes that one day at that day's price.
- `perMonth` = current daily × 30.44 and `perYear` = current daily × 365 are projections, labelled "kb.".
- **Milestones** (`SAVINGS_MILESTONES` in `content/hu.js`) are ascending, alcohol-free ideas with approximate prices. The UI shows the last achieved one and the next one, with the remaining amount. The optional personal goal shows progress capped at 100 %.

## Events: the timeline is the source of truth

There is no stored `daysSober` counter and no stored phase. All metrics are **derived** from events, so they can never contradict the journal.

| `type` | Fields (besides `id`, `date`, `at`, optional `note` ≤ 2000 chars) | Meaning |
|---|---|---|
| `checkin` | `mood?` (preset id), `sleep?` 1–5, `craving?` 0–3, `triggers[]?` | Daily check-in |
| `trigger` | `triggers[]`, `intensity?` 1–5, `coping[]`, `outcome?` (`coped`, `hard`, `ongoing`) | Difficult moment (quick log never invents an intensity) |
| `slip` | `lesson?` (for the phase it closes), `intention?` (for the phase it opens), `triggers[]?` | Fresh start (újrakezdés). **Deletes nothing.** |
| `note` | `note` (required) | Free reflection |

All free text (`note`, `lesson`, `intention`) is optional except on `note`, at most 2000 characters, and stored only inside the encrypted payload.

Preset ids live in [src/domain/presets.js](../src/domain/presets.js). Labels can be reworded after clinical review without a data migration. New presets (e.g. `social-pressure`, `routine`) only add ids.

## How the timeline changes: the reducer

Every change goes through [`timelineReducer(data, action, { now })`](../src/domain/timelineReducer.js), which returns `{ data, effects }`:

| Action | Effect |
|---|---|
| `LOG_CHECKIN` / `LOG_TRIGGER` / `LOG_NOTE` | Appends one validated event. Future dates are rejected. |
| `FRESH_START` | Appends a `slip` event. `effects` describe the archived phase (`closedPhase {start, end, days, lessons}`), the new phase (`openedPhase {start, intentions}`), `totalBefore`/`totalAfter`, and flags: `newPhase` (false for a 2nd slip on the same day), `retroactive` (logged after the day), `splitEarlierPhase` (a late slip inside an already closed phase). |
| `DELETE_ENTRY` | The **only** removal path, used solely on an explicit user request (mistake or privacy). Deleting a slip merges its phases back. |
| `SET_DAILY_COST` | Updates `costHistory` (`mode: 'from' \| 'all'`, `from ≤ today`). Events untouched. |
| `SET_SAVINGS_GOAL` | Sets or clears (`goal: null`) the personal goal. |

Guarantees (tested, including property tests over 300 random journeys):
- **Append-only, structurally shared, deep-frozen.** Earlier events keep their identity, and attempts to mutate them throw.
- **Persist-then-commit.** [`createTimelineStore`](../src/state/timelineStore.js) encrypts and saves first (`VaultStore.save`, on IndexedDB or localStorage). Subscribers see the new state only after the write succeeded. Dispatches are serialized.

## Phases: derived, never stored

```
journeyStart          slip D1                 slip D2            today
     │── phase 1 ──────│✕│── phase 2 ───────────│✕│── phase 3 ──────│
     start=journeyStart   start=D1+1               start=D2+1
```

Each phase carries `start`, `end` (exclusive = closing slip date, `null` if current), `days`, `lessons[]` (from the slip that closed it), `intentions[]` (from the slip that opened it), and, via `phaseSummaries`, its `entries[]`, `checkins` and `coped` counts. The slip day's entries belong to the phase it closed.

Phases are recomputed from events instead of being stored. Stored day counts would be a second source of truth, and a late-logged slip would make them wrong. Instead, **closed phases are provably stable**: their values never change as time passes (tested), and only the current phase grows.

## Counting rules (fresh start, no reset)

- A day counts once it is **completed**: phase days = calendar days in `[start, end ?? today)`.
- A slip day is not a sober day. **Every other day is always kept.**
- `totalSoberDays` = the sum of all phases. Invariant (property-tested): `totalSoberDays + past slip days = days since journeyStart`.
- Logging **today's** slip changes nothing already counted. Logging an **earlier** day's slip later removes exactly that one day, because it had been counted as sober until then. The UI says so explicitly (`freshRetro`). The copy therefore promises "a slip never erases your sober days", **never** "the total never decreases".
- Savings = `totalSoberDays × dailyCostHuf`, so the same rule applies to money.
- Several slips on one day open one phase. Consecutive slip days produce 0-day phases.
- Dates are local calendar keys, so DST and late-night entries never shift counts.

## Migration

`migrate()` applies one step per version (`MIGRATIONS[n]: vn → vn+1`). Shipped steps are never edited, so old backups keep migrating identically. Newer versions are refused with a "please update the app" message instead of being misread.

| Step | Change | Guarantee (tested) |
|---|---|---|
| v1 → v2 | `settings.dailyCostHuf` → `settings.costHistory: [{ from: journeyStart, dailyCostHuf }]` | Every savings figure is identical before and after. Existing encrypted vaults migrate on unlock and are re-saved as v2. v1 JSON exports still import. |

Optional fields added without a version bump (older payloads stay valid): `slip.intention`, `checkin.triggers`, optional `trigger.intensity`, new preset ids.
