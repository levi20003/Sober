# Privacy notice: Sobriety Counter (Józanság-számláló)

*Draft, updated 1 November 2026. A legal and expert review is required before a public launch (see [docs/CLINICAL-REVIEW.md](docs/CLINICAL-REVIEW.md)). The Hungarian version, [PRIVACY.md](PRIVACY.md), is the original.*

## In short

- **All your data stays on your own device.** There is no server that anything could reach.
- **No sign-up**, account, e-mail address or phone number.
- **No tracking**: no analytics, ads, cookies, web fonts or third-party code.
- **Your journal is encrypted** with your PIN or passphrase.
- **You can delete everything** in one step and **download your data** at any time.

## What does the app store?

Only what you type in yourself: your nickname, what you want to stay away from, your goal, hard situations, reasons, moods, gratitude notes, letters, your start date, daily cost and savings goal, daily check-ins, hard moments, slips, lessons and notes. All of it is **encrypted** and lives in your browser's storage (IndexedDB, or localStorage if that is unavailable).

Stored **unencrypted** (it is not personal content, and the lock screen needs it): the number of failed unlock attempts and the end of the wait time; the number of digits of a digits-only PIN (for the quick keypad; can be switched off in Settings; the PIN itself is never stored); the date of the last backup; whether reminders are on, their time and the day of the last one; and your display settings (theme, reduced motion, language, country, currency). Nothing from the journal is ever in these.

Not stored, not collected: name, e-mail, phone number, location, device identifier, IP address, usage statistics.

## How the encryption works ("zero-knowledge")

Everything happens on your device with the browser's built-in Web Crypto API. Your PIN and keys are never stored.

1. **Key derivation.** Your PIN or passphrase is turned into a key with PBKDF2-SHA-256, **600,000** iterations and a random per-device salt. It is deliberately slow, so every guess is expensive.
2. **Data key.** The journal is encrypted with a separate random 256-bit key (AES-256-GCM). The PIN-derived key locks that data key. The recovery code is a second, independent lock on the same data key.
3. **Storage.** The device only holds the salt, iteration count, random IVs and ciphertext. Any change to a single byte is detected.
4. **Unlock and lock.** Decryption happens in memory. On locking, after inactivity, or when you leave the page, the key and decrypted data are removed from memory.

In practice: nobody, including us, can read your journal without your PIN or recovery code. The price is that if you lose both, **the journal cannot be recovered**.

## Who can see my data?

- **Only you**, with your PIN or recovery code.
- We, the makers, **cannot technically access it**: there is no server. The web version's security rule (`connect-src 'none'`) even forbids the page from opening any network connection.
- **Single exception, Android app only:** at start and at most once a day the app sends one ordinary request that carries no data to GitHub's release page (`https://api.github.com/repos/levi20003/Sober/releases/...`) to find out whether a newer version exists. The request contains no personal data or identifier; GitHub can see your IP address as for any request. You can switch it off in Settings, and the security rule of the Android app allows only this one address. The web version sends no such request.
- **Feedback** is optional and manual: the "Send feedback" button opens a pre-filled public GitHub form in your browser. The app sends nothing by itself. Please never put personal data, a PIN or a recovery code in it.
- If someone has access to your unlocked device while the journal is open, they can see it too. That is why it auto-locks after inactivity (default 5 minutes) and can be locked immediately.

## How strong is the protection?

AES-256-GCM encryption, key from your PIN (PBKDF2, 600,000 rounds). Honestly: a **4–6 digit PIN** protects against everyday curiosity. Someone who copies your device's stored data and has serious computing power can bypass the wait and guess a 4-digit PIN in seconds, a 6-digit one in minutes. A longer passphrase (e.g. three words) is far stronger. The app does not accept very easy PINs (1234, 0000, …) and shows the strength as you type.

## Your rights and control

- **Backup:** encrypted backup file (openable only with the backup's PIN), or plain JSON/CSV (clearly labelled as not encrypted).
- **Delete everything** in one step in Settings. If you uninstall the Android app or clear the site data, the journal is gone too, so make an encrypted backup first.
- **Android:** `allowBackup="false"`: the journal is kept out of Google's cloud backup and device-to-device transfer.

## Not a medical device

The Sobriety Counter helps you track and support your journey. It does not treat, diagnose or cure, and does not replace professional help. In an emergency call your local emergency number; the app's "Help now" page lists helplines for Hungary, the UK, the US and a worldwide directory.
