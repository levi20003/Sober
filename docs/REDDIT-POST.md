# Reddit / community post (draft)

Before posting: read the community's rules on self-promotion and ask the moderators for permission where required. Do not claim it treats or cures anything. Be upfront that it is a **preview**, that it has **not been reviewed by a professional yet**, and that it is a **free, no-account, no-tracking** hobby project. Do not post in crisis-support communities as promotion.

## English

**Title:** I built a free, private, offline sobriety counter and would love honest feedback (preview, no account, no tracking)

**Body:**

Hi all. I made a small app to help track and support a sobriety journey, and I would really value feedback from people who have been through this, before I take it further.

What makes it different:
- **Private by design:** everything stays on your phone, encrypted with your PIN. No account, no cloud, no analytics, no ads. It works offline.
- **A slip does not wipe your progress:** the main number is your *total* sober days. A slip starts a "new chapter" instead of a zero, and you can note what you would take with you.
- **A big yellow "Help now" button on every screen** with helplines (UK, US, Hungary, worldwide directory), a breathing exercise, and a 10-minute "ride the craving wave" timer.
- Daily mood check-in with 12 little characters, milestones, savings counter, gratitude notes, a letter to your future self, light/dark theme, English and Hungarian.

It is a **preview**: it has not been reviewed by a clinician yet, it is **not a medical device**, and it does not replace professional help. The helplines for the UK/US were checked against public sources but I have not test-called them.

Try it (no install, any phone): https://levi20003.github.io/Sober/ (Android APK and install guide: https://levi20003.github.io/Sober/telepites.html)

What I would love to hear: Is the tone right? Anything that felt judgmental or awkward? What is missing? Is the first-run setup too long? Reply here, or use the in-app "Send feedback" button (it opens a form on GitHub, which needs a free GitHub account): https://github.com/levi20003/Sober/issues/new?template=feedback.yml

Source is open: https://github.com/levi20003/Sober

## Magyar

**Cím:** Ingyenes, privát, offline józanság-számláló. Őszinte véleményt kérek (előzetes verzió, nincs regisztráció, nincs követés)

**Szöveg:** Hasonló az angolhoz: minden adat csak a telefonon marad, titkosítva; a megcsúszás nem nulláz (új szakasz); a „Segítség most” gomb minden oldalon elérhető; 10 perces hullámlovaglás-időzítő; hangulatnapló 12 figurával; megtakarítás-számláló. **Előzetes verzió, szakember még nem lektorálta, nem orvosi eszköz.** Kipróbálás telepítés nélkül: https://levi20003.github.io/Sober/ . Visszajelzés: https://github.com/levi20003/Sober/issues/new?template=feedback.yml

## Likely questions (prepared answers)

- *Is my data sent anywhere?* No. The web version cannot open network connections (enforced by the page's security policy). The Android app makes one data-free request per minute to GitHub to check for updates; it can be switched off.
- *What if I forget my PIN?* Use the recovery code shown once at setup. Without both, the journal cannot be recovered; that is the price of real encryption.
- *Why not on Google Play / the App Store?* It is a preview. The web version also installs to the home screen on iPhone and Android.
- *Who made it / is it clinical?* A solo hobby project; a review by an addiction specialist is planned before any wider release.
