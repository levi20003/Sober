# Security model

Status: v0.2.0 draft, 2026-10-29. Not externally audited yet. An independent review is a launch blocker (see [Launch checklist](#launch-checklist)).

## Goals and non-goals

| | |
|---|---|
| **Protect** | Journal contents (dates, moods, triggers, slips, lessons, notes, cost) at rest on the device, in backups, and against any network observer. |
| **Guarantee** | Zero data leaves the device unless the user explicitly downloads a file. |
| **Survive** | Wrong PIN, forgotten PIN (recovery code), corrupted record, quota exhaustion, missing IndexedDB. |
| **Not in scope** | An attacker who controls the unlocked device while the journal is open, malicious browser extensions, a compromised OS, or a compromised hosting origin serving modified code. |

## Architecture

```
            ┌────────────────────── browser origin ──────────────────────┐
 React UI (src/components, src/hooks) ──► appAuth state machine (src/auth/appAuth.js)
                     └─► VaultStore (src/storage/store.js) ──► Backend: IndexedDB → localStorage → Memory
                     │                                       key 'vault'      encrypted record
                     ▼                                       key 'vault.prev' previous good record
            crypto/vault.js (Web Crypto only)                key 'meta'       plaintext, non-sensitive
            └────────────────────────────────────────────────────────────┘
 Network: CSP connect-src 'none' on the page → no fetch/XHR/WebSocket/beacon is possible.
```

There is no server, no account and no third-party *service*. Since v0.6.0 the UI is React; the shipped bundle contains exactly three npm packages (react, react-dom, scheduler) plus this repository's code. Crypto, storage and the timeline logic remain framework-free and dependency-free. See [Supply chain](#supply-chain).

## Cryptography

Envelope encryption ([src/crypto/vault.js](../src/crypto/vault.js)):

| Element | Choice | Notes |
|---|---|---|
| Data key (DEK) | random AES-256-GCM | Generated once per vault. Kept in memory only as a **non-extractable** `CryptoKey`. |
| Payload | AES-256-GCM, random 96-bit IV per save, AAD `jozansag-szamlalo\|payload\|v1` | GCM tag gives integrity; tampering → `CORRUPTED`. |
| PIN slot | PBKDF2-HMAC-SHA-256, **600 000** iterations, 128-bit random salt → AES-256-GCM KEK wraps DEK (AAD `…\|dek\|v1`) | OWASP 2023 figure. Per-slot salt and iteration count are stored, so the parameters can be raised later without migration. |
| Iteration floor | Slots with < **100 000** iterations, or a KDF other than PBKDF2-SHA-256, are refused on open (`CORRUPTED`) | Stops a tampered record from silently lowering the brute-force cost. |
| Recovery slot | Same, 100 000 iterations; secret = 160-bit random code (32 Crockford base32 chars) | High-entropy secret, so the KDF cost matters little. |
| Secret normalisation | Unicode NFKC | `árvíztűrő` typed on different keyboards derives the same key. |

**Why PBKDF2 and not Argon2?** Web Crypto offers only PBKDF2. A WASM Argon2id would add a dependency and needs `'wasm-unsafe-eval'` in the CSP. It is a reasonable v2 upgrade once audited, since the slot format already records `kdf.name`.

**Why envelope encryption?**
1. A PIN change rewrites one 60-byte slot, not the whole journal.
2. The recovery code works without storing the PIN.
3. Deletion is effective: destroying the slots makes any leftover ciphertext useless ("crypto-shredding").

### Stored record

```json
{
  "format": 1,
  "revision": 42,
  "slots": {
    "pin":      { "kdf": { "name": "PBKDF2", "hash": "SHA-256", "iterations": 600000, "salt": "b64" }, "iv": "b64", "wrapped": "b64" },
    "recovery": { "kdf": { "...": "..." }, "iv": "b64", "wrapped": "b64" }
  },
  "payload": { "iv": "b64", "ct": "b64" }
}
```

The decrypted payload schema is documented in [DATA-SCHEMA.md](DATA-SCHEMA.md).

**Plaintext metadata** (`meta`): `failedAttempts`, `lockedUntil`, `reminders { enabled, time, lastShown }`. It reveals that the app is used, but nothing about the journal. `revision` reveals roughly how many saves were made. Both leaks are accepted and listed in PRIVACY.md.

## Lock state machine

[src/auth/appAuth.js](../src/auth/appAuth.js) is the only owner of the store's lifecycle:

| From | Action | To | Notes |
|---|---|---|---|
| `INITIALIZING` | `init()` | `FIRST_TIME_SETUP` / `LOCKED` | Opens the best backend. Decides based on whether a vault exists. An *unreadable* vault counts as existing, so it can never be overwritten by setup. |
| `FIRST_TIME_SETUP` | `setup(pin)` / `restoreBackup()` | `UNLOCKED` | Weak PIN → stays put with `error.code = WEAK_SECRET`. |
| `LOCKED` | `unlock` / `recover` / `restorePrevious` | `UNLOCKED` | Failure → stays `LOCKED`, with `error` (`WRONG_SECRET` + `retryAfterMs`, or `CORRUPTED` + `canRestorePrevious`). **Never modifies data.** |
| `UNLOCKED` | `lock(reason)` | `LOCKED` | `manual`, `inactivity` (configurable 1–120 min) or `pagehide`. Synchronous, so it completes before the page is frozen into the back/forward cache. |
| any | `resetAll()` | `FIRST_TIME_SETUP` | Zero-knowledge reset: wipe, then reopen a fresh backend. The lock screen requires typing `TÖRLÉS`. |

Actions are serialized (a double tap cannot create two vaults or interleave unlock and reset). Calling an action in the wrong state throws `INVALID_STATE`.

**In-memory key cleanup.** While unlocked, memory holds only a *non-extractable* DEK `CryptoKey` and the decrypted object. `lock()` drops both references. JavaScript cannot zero memory, so they are reclaimed by garbage collection. On tab close, the page's memory is released by the browser. Nothing key-related is ever written to any storage, including session storage (tested).

## Storage backends

| Backend | When | Atomicity | Notes |
|---|---|---|---|
| IndexedDB | default | one `readwrite` transaction | Readable by the service worker (reminders). Connections close on `versionchange` so another tab cannot block "delete all". `open()` times out after 5 s instead of hanging. |
| localStorage | IndexedDB missing, blocked or timing out | manual rollback of every key on failure | ~5 MB quota → `QUOTA` error, previous state intact. Unparseable JSON → `CORRUPTED` (never "missing"). Reminders scheduled by the service worker are unavailable on this backend; the in-app check-in prompt still works. |
| memory | neither works | n/a | `persistent: false` → permanent warning banner. |

If IndexedDB is empty but localStorage holds a vault (from an earlier fallback), localStorage is chosen, so a backend switch never hides a journal.

## Threats and mitigations

| Threat | Mitigation | Residual risk |
|---|---|---|
| Someone picks up the unlocked phone | Auto-lock after inactivity (1–120 min, default 5). One-tap "Zárolás". Decrypted state dropped on lock. | Exposure until auto-lock. |
| Someone opens the app on a locked phone | PIN required. Attempt throttling: 5 free attempts, then 15 s doubling up to 5 min. A correct PIN must also wait. | The throttle lives in plaintext `meta`, so an attacker with storage access can reset it. **It protects the UI only.** |
| **Offline brute force** of copied storage or a backup file | PBKDF2 at 600k iterations, per-slot salt. Blocklist of trivial PINs (repeats, sequences, top PINs such as 2580). Live strength note (`assessSecret`: weak / fair / strong). | **Product decision (2026-10-29): 4–6 digit PINs are allowed.** At roughly 10⁴ guesses/s on one GPU at this cost, a 4-digit PIN (10⁴) falls in about **a second**, and a 6-digit one (10⁶) in **minutes**. Such PINs protect against casual access and the on-screen PIN pad only. A 3–4 word passphrase is out of practical reach. The UI says so honestly; PRIVACY.md too. |
| Network exfiltration (bug, injected code, a future dependency) | Page CSP `default-src 'none'; connect-src 'none'`. No third-party origins. Asserted by `tests/pwa.test.js`. | Navigation-based exfiltration needs script injection first (see next row). |
| XSS via journal notes | No HTML parsing of data anywhere. DOM built with text nodes only (`ui/dom.js`). No `innerHTML`/`eval`, enforced by a test. `script-src 'self'`, no inline script. | — |
| Spreadsheet formula injection in CSV | Cells starting with `= + - @ \t \r` are prefixed with `'`. | — |
| Ciphertext tampering or bit rot | GCM authentication. Previous-good record (`vault.prev`) written atomically with every save. Restore UI on `CORRUPTED`. | Two consecutive corruptions → restore from a user-held encrypted backup. |
| Partial or failed write (quota, crash) | Single IndexedDB transaction for `vault` + `vault.prev`. In-memory state only advances after commit. | — |
| Rollback (attacker swaps in an old record) | Out of scope. It requires write access to storage, which already implies a device compromise. | Documented. |
| Forgotten PIN | 160-bit recovery code, shown once. It can be regenerated, and regenerating revokes the old code in `vault.prev` too. | Losing both the PIN and the code means the data is unrecoverable, by design. |
| Lock-screen disclosure via notifications | Neutral copy, checked by a test for words like *józan, alkohol, drog, sóvár*. `silent: true`. | The app name may still appear depending on the OS. |
| Home-screen disclosure | — | Icon label "Számláló" is neutral-ish. A "discreet name/icon" option is a backlog item, but needs a separate manifest per install. |
| Decrypted data in memory | Non-extractable DEK. Plaintext exists only in JS objects while unlocked. | JS cannot zero strings, so data stays until garbage-collected. A memory forensic attack on the live device is out of scope. |
| Deletion | Overwrite with random → delete keys → `deleteDatabase`. | Physical erasure is not guaranteed (browser LevelDB/SQLite files, SSD wear levelling). The key slots are gone, but remnants of an old slot plus a weak PIN could in theory be brute-forced. Mention in PRIVACY.md. |
| Compromised hosting or supply chain | Three runtime packages, exact-pinned with a lockfile; ≥14-day publish-age rule; `overrides` pins the build tool tree. Self-hosted bundle (no CDN). HSTS. Service-worker cache version = content hash of the build. | **Trust root is the origin.** Recommended: deploy from a signed tag, publish file hashes, enable 2FA on hosting. |

## Supply chain

| Rule | How |
|---|---|
| Few runtime packages | `react`, `react-dom` (+ `scheduler`). All crypto and storage uses the browser's Web Crypto / IndexedDB APIs directly. |
| Exact versions, lockfile | `--save-exact` + `package-lock.json`; install with `npm ci`. |
| No brand-new releases | Only versions published ≥ 14 days before adoption. On 2026-10-29, `vite@8.3.5` (8 days old) was rejected in favour of `8.3.4`, and `overrides` forces the whole tree onto it. |
| Audit | `npm audit`: 0 known vulnerabilities at adoption (runtime and dev). |
| Build cannot weaken the CSP | The CSP `<meta>` lives in `index.html` and survives the build. A dev-only plugin (`apply: 'serve'`) strips it for hot reload; a test asserts it never applies to builds, and the e2e asserts zero CSP violations on the production bundle. `assetsInlineLimit: 0` and no module-preload polyfill mean no inline scripts or `data:` assets. |
| No raw-HTML escape hatches | `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` are banned in `src/` by a test. React escapes all journal text. |

## Error model

| Code | Meaning | UI response |
|---|---|---|
| `VaultError.WRONG_SECRET` | GCM unwrap of a key slot failed | "Hibás PIN-kód…" plus the throttle |
| `VaultError.CORRUPTED` | DEK OK but payload fails the tag, JSON or schema check | Offer **restore previous copy** |
| `VaultError.UNSUPPORTED` | Record from a newer app version | Ask the user to update |
| `VaultError.WEAK_SECRET` | Too short or trivially guessable | Inline message |
| `VaultError.NO_CRYPTO` | No `crypto.subtle` (insecure context) | Message: https is required |
| `StorageError.UNAVAILABLE` | No IndexedDB (some private modes) | Falls back to a memory backend with a **persistent warning banner** |
| `StorageError.QUOTA` | Device full | Save rejected, previous state intact, user told to free space or export |

Every path above is covered by `tests/store.test.js` and `tests/crypto.test.js`.

## Launch checklist

- [ ] Independent security review of `src/crypto`, `src/storage`, CSP and service worker
- [x] PIN policy decided: 4+ digits allowed, with blocklist and honest strength note (2026-10-29)
- [ ] Optional hardening to evaluate: Argon2id (WASM) to raise the cost per guess for short PINs
- [ ] Serve only over HTTPS with the headers in `/_headers` ([DEPLOYMENT.md](DEPLOYMENT.md))
- [ ] PNG icons (192/512) for older Android launchers
- [ ] Clinical sign-off ([CLINICAL-REVIEW.md](CLINICAL-REVIEW.md))
- [ ] Legal review of PRIVACY.md (GDPR Art. 9 special-category data)
