# User-testing framework

The focus is on **whether the app helps people cope in hard moments**, not on how pretty it is. Visual polish questions are deliberately last.

## Ethics first

- Recruit through treatment providers or peer groups that agree to it, never by cold outreach. Participants must be **18+** and not in acute crisis.
- Informed consent in Hungarian. Participants can stop at any time and need not explain why.
- **Never ask participants to recall or describe their substance use.** Scenarios are hypothetical, and participants use **dummy data** on a test device, never their real journal.
- A clinician or trained peer worker is present or on call. Participants get the helpline card (116-123) at the end of every session.
- Record no names in notes. Use pseudonyms. Keep no recordings without separate consent.

## Research questions

1. **Crisis reach:** in a simulated "hard moment", can people reach a helpline or breathing exercise in **≤ 1 tap and ≤ 5 seconds** from any screen, including the lock screen?
2. **Slip experience:** after logging a slip, do people feel the app *kept* their progress, or that they "lost" something?
3. **Logging friction:** can a check-in be done in **< 20 seconds** and a difficult moment in **< 40 seconds**, without typing?
4. **Coping transfer:** do preset coping options remind people of strategies they would actually use?
5. **Trust:** do people believe their data stays on the device, and can they explain the PIN and recovery code in their own words?
6. **Tone:** does any wording feel judgmental, clinical, cold or patronising?

## Task script (60 minutes, moderated, think-aloud)

| # | Scenario (read aloud) | Measure | Success |
|---|---|---|---|
| 1 | "It's 23:40 on a Friday. You feel a strong urge and want to talk to someone." Start on the lock screen. | Taps and seconds to the `tel:` link | ≤ 1 tap, ≤ 5 s |
| 2 | "You'd rather not call. Try something to calm down for a minute." | Finds and starts breathing; completes ≥ 2 rounds | Unassisted |
| 3 | "Set up the app for yourself." (dummy data) | Completes onboarding; explains the recovery code back | Correct explanation |
| 4 | "Log how today went." | Time to complete the check-in | < 20 s |
| 5 | "Earlier, a conflict at work made things hard, but you went for a walk." | Time; presets used vs. typing | < 40 s, no typing |
| 6 | "Imagine you had a drink yesterday. Record it." | Emotional response (SAM scale, before and after); quote | Post-task valence ≥ pre-task |
| 7 | "What happened to your progress?" | Can they find total days and savings unchanged? | Yes, without prompting |
| 8 | "You're getting a new phone. Take your journal with you." | Finds the encrypted backup | Unassisted |
| 9 | "You want everything gone from this phone, now." | Taps to delete-all | ≤ 3 taps + 1 confirmation |

## Post-session measures

- **Short coping-confidence check** (5-point): "Ha most jönne egy nehéz pillanat, tudnám, mit tegyek az alkalmazásban."
- **Tone probe:** show five key strings (slip intro, slip after, phase zero, risk message, notification). For each, ask "how did this make you feel?" (free text and a 5-point scale).
- **Trust probe:** "Ki láthatja, amit ide beírsz?" Code the answer as correct, partially correct or incorrect.
- SUS (System Usability Scale), **last**, Hungarian version.

## Field pilot (after moderated rounds, with clinical approval)

The app has no analytics by design, so a pilot relies on **opt-in, participant-initiated** sharing:

- At week 2 and week 6, participants complete a short questionnaire and may *choose* to share a CSV export with the study team.
- Measures: check-in days per week, number of difficult moments logged with `coped` vs. `hard`, slip-flow re-engagement (did they keep logging after a slip?), and qualitative interviews.
- **Never add telemetry to the app for research.** Use a separate study build if ever needed, with its own ethics approval.

## Accessibility checks (each round)

- Screen reader pass (TalkBack and VoiceOver) through tasks 1, 4 and 6
- 200 % text zoom, `prefers-reduced-motion` (breathing falls back to a static circle and countdown)
- Large touch targets (≥ 48 px) used with one hand while walking
