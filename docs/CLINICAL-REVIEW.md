# Clinical and expert review framework

**Status: NOT REVIEWED. Public launch is blocked until every item in section 4 has a sign-off.**

The app handles people in vulnerable moments. Every user-facing string, the crisis flow and the slip flow must be reviewed by at least one **addictologist (addiktológus)** or **clinical psychologist (klinikai szakpszichológus)**. Ideally a person with lived experience of recovery reviews them too.

## 1. What to review, and where it lives

All copy is in one file: [`src/content/hu.js`](../src/content/hu.js). Reviewers can comment on it directly, by key.

| Area | Keys / location | Specific questions for the reviewer |
|---|---|---|
| Crisis screen | `HELPLINES`, `CRISIS_STEPS`, `URGE_WAVE`, `GROUNDING`, `BREATHING`, `T.crisis*`; components in `src/components/crisis/`; design in [SAFETY.md](SAFETY.md) | Is the order right (112 banner → talk lines → breathing)? Is "15–30 perc" for urge duration acceptable wording? Are the three breathing patterns (4-6, box, **4-7-8**) safe for people in withdrawal or with panic? |
| **Withdrawal safety** | `HELPLINES[0].when` mentions "súlyos elvonási tünetek" | **Critical:** alcohol and benzodiazepine withdrawal can be life-threatening. Is the 112 guidance prominent enough? Should a dedicated "elvonási tünetek" card be added? |
| Slip flow | `T.slip*`; `src/components/timeline/FreshStartModal.jsx` | Is "Megcsúszás" the right term (vs. "visszaesés", "botlás")? Is the "lesson" prompt helpful or burdensome right after a slip? Should the crisis screen be offered automatically after logging a slip? |
| High-risk moments | `RISK_MESSAGES`; logic in `src/domain/risk.js` | Are late night (22–05) and weekend (Fri 17:00 → Sun) the right windows? Is the personal-pattern message ("ez az időszak korábban nehéz volt neked") supportive or does it feel like surveillance? |
| Metrics framing | `T.totalSober*`, `T.heroCurrent`, `T.phase*`, `T.coped`, `T.sleep*` | **Implemented in v0.4.0:** total sober days is the hero number, with the current phase beside it; a new phase reads "Holnap kezdődik"/"Ma kezdődött", never a bare "0 nap". Please confirm. |
| Fresh start flow | `T.slip*`, `T.fresh*`; `src/components/timeline/FreshStartModal.jsx` | Is asking for a lesson *and* an intention right after a slip too much (both are optional)? Is `freshRetro` (a late-logged slip removes that one day) clear and kind enough? |
| Onboarding and disclaimer | `T.onboarding*`, `T.disclaimer`, `T.privacyPromise` | Does the disclaimer meet Hungarian consumer and health-claim rules? |
| Notifications | `NOTIFICATION` | Frequency and wording. Is once a day too much for some users? |
| Savings milestones | `SAVINGS_MILESTONES` in `content/hu.js` | Are the ideas appropriate, with no reward-by-consumption risk? Should amounts link to a goal rather than to purchases? Prices are approximate (2026). |
| Quick-log cards | `QUICK_TEMPLATES` in `src/domain/presets.js` | Right eight situations and moods? Should a negative mood card offer the crisis screen after saving? |
| Presets | `src/domain/presets.js` (moods, triggers, coping, outcomes) | Are any coping options inadvisable? Is anything important missing (e.g. "Elmentem egy csoportfoglalkozásra")? |

## 2. Language guardrails (automated)

[`tests/copy.test.js`](../tests/copy.test.js) fails the build if any user-facing source contains:

- failure, shame or punishment framing: *kudarc, bukás, elbukott, szégyen, gyenge, büntet…*
- reset framing: *nulláz, újraindul a számláló, elveszett napok*
- identity labels: *alkoholista, drogos, iszákos*
- medical claims: *gyógyít, meggyógyul, garantál*
- alcohol imagery: *üveg, pohár, palack, koccint*
- guilt-tripping check-ins: *ittál ma*
- *visszaes-* (pending the reviewer's decision on terminology)

It also checks that the disclaimer says "segít követni és támogatni" and "nem helyettesíti", and that notification text names nothing about recovery. Reviewers may add or remove terms. The list is the reviewer's tool, not a substitute for review.

## 3. Helpline verification

The full table, evidence and release rule are in [SAFETY.md §4](SAFETY.md#4-helplines-and-verification-status). In short:

| Line | Number | Status | Reviewer action |
|---|---|---|---|
| General emergency | 112 | official | — |
| S.O.S. Lelki Elsősegély (LESZ) | 116-123 | official | Test call; confirm hours |
| Drog Stop segélyvonal | 06-80-505-678 | **secondary sources only** | **Test call + confirm on drogstoponline.hu, or remove.** Confirm whether it also covers alcohol. |
| Kék Vonal | 116-111 | official | Confirm age-limit wording |
| Local AA/NA, family-member lines | — | not included | Supply if recommended |

## 4. Sign-off record

| Item | Reviewer (name, qualification) | Date | Decision / changes requested |
|---|---|---|---|
| Crisis flow & helplines | | | |
| Breathing patterns incl. 4-7-8 | | | |
| Drog Stop line (test call) | | | |
| Withdrawal safety guidance | | | |
| Slip flow & terminology | | | |
| Risk-moment messaging | | | |
| Metric framing ("0 nap" hero) | | | |
| Presets | | | |
| Notifications | | | |
| Disclaimer / legal boundary | | | |
| PRIVACY.md (legal, GDPR Art. 9) | | | |

After sign-off, set `REVIEW_STATUS` and `CONTENT_VERSION` in `hu.js`. Both are shown in Settings.

## 5. Legal boundary (non-negotiable)

- The app **"segít követni és támogatni"**. It never claims to treat, cure, diagnose or prevent anything.
- No dosage, tapering or medication content, ever.
- No success-rate claims in store listings or marketing.
- Store category: Health & Fitness / Lifestyle, **not** Medical. If medical claims are ever wanted, MDR classification must be assessed first.
