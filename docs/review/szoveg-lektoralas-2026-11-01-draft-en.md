# Szövegek szakmai lektorálásra (2026-11-01-draft, en)

Generálta: `node scripts/review-export.mjs` – ne szerkeszd kézzel, a forrás a `src/content/` mappa.

Állapot: **Awaiting expert review**. Tájékoztató a lektornak: [LEKTOR-TAJEKOZTATO.md](LEKTOR-TAJEKOZTATO.md). A visszajelzést a CSV-fájl üres oszlopaiban kérjük (Rendben / Módosítandó / Javasolt szöveg / Megjegyzés).

Összesen 839 szöveg. A biztonságkritikus részek (krízisképernyő, megcsúszás, értesítés) vannak elöl.


## Krízisképernyő – légzőgyakorlat

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `BREATHING.slow-exhale.name` | Long exhale |  |
| `BREATHING.slow-exhale.description` | Make the out-breath longer than the in-breath. It can help calm the body. |  |
| `BREATHING.slow-exhale.steps.0.label` | Breathe in through your nose |  |
| `BREATHING.slow-exhale.steps.1.label` | Breathe out slowly through your mouth |  |
| `BREATHING.box.name` | Box breathing |  |
| `BREATHING.box.description` | Four equal parts. If you feel dizzy, just breathe simply and naturally. |  |
| `BREATHING.box.steps.0.label` | Breathe in |  |
| `BREATHING.box.steps.1.label` | Hold |  |
| `BREATHING.box.steps.2.label` | Breathe out |  |
| `BREATHING.box.steps.3.label` | Pause |  |
| `BREATHING.4-7-8.name` | 4-7-8 breathing |  |
| `BREATHING.4-7-8.description` | In for 4, hold for 7, out for 8. If holding feels uncomfortable or you feel dizzy, switch to "Long exhale". |  |
| `BREATHING.4-7-8.steps.0.label` | Breathe in through your nose |  |
| `BREATHING.4-7-8.steps.1.label` | Hold |  |
| `BREATHING.4-7-8.steps.2.label` | Breathe out slowly through your mouth |  |

## Krízisképernyő

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `CRISIS_STEPS.0` | If you can, move somewhere safer, or step away from the situation. |  |
| `CRISIS_STEPS.1` | Have a little water, or something to eat. |  |
| `CRISIS_STEPS.2` | Message or call someone you trust. |  |
| `CRISIS_STEPS.3` | Put the decision off for 20 minutes. Then check in with yourself again. |  |
| `GROUNDING.title` | 5-4-3-2-1: coming back to the present |  |
| `GROUNDING.steps.0` | Name 5 things you can see. |  |
| `GROUNDING.steps.1` | Name 4 things you can touch. |  |
| `GROUNDING.steps.2` | Name 3 sounds you can hear. |  |
| `GROUNDING.steps.3` | Name 2 smells you notice (or like). |  |
| `GROUNDING.steps.4` | Name 1 thing you can be grateful for right now. |  |

## Krízisképernyő – kockázati üzenetek

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `RISK_MESSAGES.personal.title` | This time of day has been hard for you before |  |
| `RISK_MESSAGES.personal.text` | Based on your journal, hard moments come more often around now. It is good that you are here. Do you have a plan for the next hour? | Akkor jelenik meg, ha ebben az órában korábban legalább két különböző napon nehéz pillanatot vagy megcsúszást rögzített. |
| `RISK_MESSAGES.lateNight.title` | It is late |  |
| `RISK_MESSAGES.lateNight.text` | Everything feels harder at night. Tiredness makes cravings stronger. A helpline is available right now: use the yellow button. | 22:00–05:00 között. |
| `RISK_MESSAGES.weekend.title` | The weekend |  |
| `RISK_MESSAGES.weekend.text` | Weekends can be a test for many people. A plan made in advance or a short walk can help. | Péntek 17:00-tól vasárnap éjfélig. |

## Krízisképernyő

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `T.helpButton` | I need help right now |  |
| `T.helpButtonShort` | Help now |  |
| `T.crisisReasons` | This is why you are doing it |  |
| `T.crisisCountry` | Country |  |
| `T.crisisCountryHint` | Choose where you are: helplines differ by country. |  |
| `T.crisisNeedsInternet` | Needs an internet connection |  |
| `T.crisisTitle` | We are here. Step by step. |  |
| `T.crisisIntro` | What you feel now will pass. Choose one of the options below. |  |
| `T.crisisCallTitle` | Talk to someone now |  |
| `T.crisisCall` | Call: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.crisisBreatheTitle` | Breathe with me |  |
| `T.crisisStart` | Start |  |
| `T.crisisStop` | Stop |  |
| `T.crisisPause` | Pause |  |
| `T.crisisResume` | Resume |  |
| `T.crisisRound` | Round 7 / 2026. október 1. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.crisisDone` | Well done. How do you feel now? |  |
| `T.crisisNowSteps` | What you can do now |  |
| `T.crisisBack` | Back |  |
| `T.crisisOffline` | This page works without internet. Calls do not need internet, only phone signal. |  |
| `T.crisisEmergencyLead` | In immediate danger, call straight away: |  |
| `T.crisisCopy` | Copy number |  |
| `T.crisisCopied` | Copied |  |
| `T.crisisCopyManual` | Select and copy the number |  |
| `T.crisisPatternLabel` | Breathing pattern |  |
| `T.crisisPaused` | Paused. You can continue any time. |  |
| `T.crisisEscHint` | You can also go back with the Esc key. |  |
| `URGE_WAVE.title` | A craving is like a wave |  |
| `URGE_WAVE.text` | It builds, peaks, then fades. Often it eases within 15–30 minutes. You do not have to do anything with it, just wait it out. Notice where you feel it in your body, and keep breathing. |  |

## Krízisképernyő – elvonási tünetek kártya (KIKAPCSOLVA, jóváhagyásra vár)

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `WITHDRAWAL.title` | Withdrawal symptoms: when do you need help straight away? | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |
| `WITHDRAWAL.intro` | Stopping alcohol or certain sedatives (benzodiazepines) suddenly can be dangerous. If you notice any of these in yourself or someone else, do not wait. | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |
| `WITHDRAWAL.signs.0` | A seizure or fit | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |
| `WITHDRAWAL.signs.1` | Confusion or disorientation | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |
| `WITHDRAWAL.signs.2` | Seeing or hearing things that are not there | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |
| `WITHDRAWAL.signs.3` | Severe shaking, a very fast heartbeat, high fever | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |
| `WITHDRAWAL.signs.4` | Chest pain or difficulty breathing | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |
| `WITHDRAWAL.action` | Call 112 (or your local emergency number), or ask someone to call for you. | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |
| `WITHDRAWAL.note` | If you plan to stop, it is worth talking to a doctor first (for example your GP or an addiction service). | Kikapcsolva (src/lib/features.js withdrawalCard=false); bekapcsolás csak szakmai jóváhagyással. |

## Krízisképernyő

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `HELPLINES.HU.emergency.name` | Emergency services | Szám: 112; ellenőrzés: official, 2026-10-26; forrás: https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_hu.htm |
| `HELPLINES.HU.emergency.hours` | Around the clock, free | Szám: 112; ellenőrzés: official, 2026-10-26; forrás: https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_hu.htm |
| `HELPLINES.HU.emergency.when` | If you or someone else is in immediate danger, or medical help is needed (e.g. severe withdrawal symptoms, a seizure, confusion). | Szám: 112; ellenőrzés: official, 2026-10-26; forrás: https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_hu.htm |
| `HELPLINES.HU.lesz.name` | S.O.S. Emotional First Aid Line (LESZ) | Szám: 116-123; ellenőrzés: official, 2026-10-29; forrás: https://www.sos116-123.hu |
| `HELPLINES.HU.lesz.hours` | Around the clock, free from within Hungary, anonymous | Szám: 116-123; ellenőrzés: official, 2026-10-29; forrás: https://www.sos116-123.hu |
| `HELPLINES.HU.lesz.when` | If you want to talk to someone who will listen, in any difficult moment. (Hungarian-speaking line.) | Szám: 116-123; ellenőrzés: official, 2026-10-29; forrás: https://www.sos116-123.hu |
| `HELPLINES.HU.drog-stop.name` | Drog Stop helpline | Szám: 06-80-505-678; ellenőrzés: multiple-secondary, 2026-10-29; forrás: https://drogstoponline.hu/telefonsegely/ |
| `HELPLINES.HU.drog-stop.hours` | Free to call | Szám: 06-80-505-678; ellenőrzés: multiple-secondary, 2026-10-29; forrás: https://drogstoponline.hu/telefonsegely/ |
| `HELPLINES.HU.drog-stop.when` | If you want to talk to someone about substance use, for yourself or a relative. (Hungarian-speaking line.) | Szám: 06-80-505-678; ellenőrzés: multiple-secondary, 2026-10-29; forrás: https://drogstoponline.hu/telefonsegely/ |
| `HELPLINES.HU.kek-vonal.name` | Kék Vonal (children and young people) | Szám: 116-111; ellenőrzés: official, 2026-10-26; forrás: https://kek-vonal.hu |
| `HELPLINES.HU.kek-vonal.hours` | Free, you do not have to give your name | Szám: 116-111; ellenőrzés: official, 2026-10-26; forrás: https://kek-vonal.hu |
| `HELPLINES.HU.kek-vonal.when` | If you are young (under 24) and would like to talk. (Hungarian-speaking line.) | Szám: 116-111; ellenőrzés: official, 2026-10-26; forrás: https://kek-vonal.hu |
| `HELPLINES.UK.uk-emergency.name` | Emergency services (UK) | Szám: 999; ellenőrzés: official, 2026-11-01; forrás: https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/ |
| `HELPLINES.UK.uk-emergency.hours` | Around the clock, free (112 also works) | Szám: 999; ellenőrzés: official, 2026-11-01; forrás: https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/ |
| `HELPLINES.UK.uk-emergency.when` | If you or someone else is in immediate danger, or medical help is needed. | Szám: 999; ellenőrzés: official, 2026-11-01; forrás: https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/ |
| `HELPLINES.UK.samaritans.name` | Samaritans | Szám: 116 123; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.samaritans.org |
| `HELPLINES.UK.samaritans.hours` | Around the clock, free | Szám: 116 123; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.samaritans.org |
| `HELPLINES.UK.samaritans.when` | If you want to talk to someone who will listen, about anything that is troubling you. | Szám: 116 123; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.samaritans.org |
| `HELPLINES.UK.frank.name` | FRANK | Szám: 0300 123 6600; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.talktofrank.com |
| `HELPLINES.UK.frank.hours` | Around the clock | Szám: 0300 123 6600; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.talktofrank.com |
| `HELPLINES.UK.frank.when` | Friendly, confidential advice about drugs. | Szám: 0300 123 6600; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.talktofrank.com |
| `HELPLINES.UK.drinkline.name` | Drinkline | Szám: 0300 123 1110; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.nhs.uk/live-well/alcohol-advice/alcohol-support/ |
| `HELPLINES.UK.drinkline.hours` | Weekdays 9am–8pm, weekends 11am–4pm (England) | Szám: 0300 123 1110; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.nhs.uk/live-well/alcohol-advice/alcohol-support/ |
| `HELPLINES.UK.drinkline.when` | If you are worried about your own or someone else's drinking. | Szám: 0300 123 1110; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.nhs.uk/live-well/alcohol-advice/alcohol-support/ |
| `HELPLINES.US.us-emergency.name` | Emergency services (US) | Szám: 911; ellenőrzés: official, 2026-11-01; forrás: https://www.911.gov |
| `HELPLINES.US.us-emergency.hours` | Around the clock, free | Szám: 911; ellenőrzés: official, 2026-11-01; forrás: https://www.911.gov |
| `HELPLINES.US.us-emergency.when` | If you or someone else is in immediate danger, or medical help is needed. | Szám: 911; ellenőrzés: official, 2026-11-01; forrás: https://www.911.gov |
| `HELPLINES.US.lifeline-988.name` | 988 Suicide & Crisis Lifeline | Szám: 988; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://988lifeline.org |
| `HELPLINES.US.lifeline-988.hours` | Around the clock, free; call or text | Szám: 988; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://988lifeline.org |
| `HELPLINES.US.lifeline-988.when` | If you are in emotional distress or crisis, or worried about someone else. | Szám: 988; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://988lifeline.org |
| `HELPLINES.US.samhsa.name` | SAMHSA National Helpline | Szám: 1-800-662-4357; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.samhsa.gov/find-help/helplines/national-helpline |
| `HELPLINES.US.samhsa.hours` | Around the clock, free, confidential | Szám: 1-800-662-4357; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.samhsa.gov/find-help/helplines/national-helpline |
| `HELPLINES.US.samhsa.when` | Treatment referrals and information about substance use and addiction. | Szám: 1-800-662-4357; ellenőrzés: multiple-secondary, 2026-11-01; forrás: https://www.samhsa.gov/find-help/helplines/national-helpline |
| `HELPLINES.INT.int-emergency.name` | Emergency number (EU and many other countries) | Szám: 112; ellenőrzés: official, 2026-11-01; forrás: https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_hu.htm |
| `HELPLINES.INT.int-emergency.hours` | Around the clock, free | Szám: 112; ellenőrzés: official, 2026-11-01; forrás: https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_hu.htm |
| `HELPLINES.INT.int-emergency.when` | If you or someone else is in immediate danger. If you are unsure which number works where you are, 112 is forwarded to the local emergency service in many places. | Szám: 112; ellenőrzés: official, 2026-11-01; forrás: https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_hu.htm |
| `HELPLINES.INT.findahelpline.name` | Find a Helpline: free, confidential helplines around the world | Szám: findahelpline.com; ellenőrzés: unverified, 2026-11-01; forrás: https://findahelpline.com |
| `HELPLINES.INT.findahelpline.hours` | Needs an internet connection | Szám: findahelpline.com; ellenőrzés: unverified, 2026-11-01; forrás: https://findahelpline.com |
| `HELPLINES.INT.findahelpline.when` | Choose your country to see helplines near you. | Szám: findahelpline.com; ellenőrzés: unverified, 2026-11-01; forrás: https://findahelpline.com |

## Megcsúszás és új szakasz

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `T.slipTitle` | A slip |  |
| `T.slipIntro` | This happens to many people on the way. It does not erase your path: every sober day you achieved stays, and a new chapter begins tomorrow. | A megcsúszás rögzítésekor, az űrlap tetején. |
| `T.slipDateLabel` | When did it happen? |  |
| `T.slipWhatLabel` | What led up to it? (optional) |  |
| `T.slipLessonLabel` | What would you take with you into the next chapter? (optional) |  |
| `T.slipIntentionLabel` | What will you pay attention to in the new chapter? (optional) |  |
| `T.slipConfirm` | Start a new chapter |  |
| `T.freshTitle` | A new chapter begins |  |
| `T.freshClosedLabel` | Closed chapter |  |
| `T.freshClosed` | 7 sober days. That stays yours. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.freshTotal` | Your total sober days: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.freshLessonSaved` | We saved your lesson. It will be in your journal. |  |
| `T.freshIntention` | What you will pay attention to: |  |
| `T.freshRetro` | You logged it afterwards, so that one day no longer counts as a sober day. All your other days stay. |  |
| `T.freshSameDay` | You already started a new chapter for this day. We added your latest thoughts. |  |
| `T.freshSplit` | This split an earlier chapter in two. Your other days are unchanged. |  |
| `T.freshKind` | Be kind to yourself today. One hard day does not overwrite your path so far. | A megcsúszás után, az összegző képernyőn. |
| `T.freshContinue` | Continue to the home screen |  |
| `T.slipSupport` | If it is hard right now, the "Help now" button is always here. |  |
| `T.freshOfferHelp` | If this is hard right now, you do not have to be alone with it. Would you like to talk to someone? | A megcsúszás után: felajánlja (nem nyitja meg magától) a krízisképernyőt. |
| `T.freshOfferHelpButton` | Open helplines |  |

## Értesítés (zárolt képernyőn is látszik)

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `NOTIFICATION.title` | A minute for you |  |
| `NOTIFICATION.body` | How is your day going? Drop in if you feel like it. |  |
| `NOTIFICATION.actionOpen` | Open |  |
| `NOTIFICATION.actionOff` | Turn reminders off |  |

## Bevezető

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `ONB.step` | 7 / 2026. október 1. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `ONB.progressLabel` | Step 7 of 2026. október 1. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `ONB.next` | Next |  |
| `ONB.back` | Back |  |
| `ONB.skip` | Skip |  |
| `ONB.start` | Let's start |  |
| `ONB.finish` | Go to the home screen |  |
| `ONB.help` | Help now |  |
| `ONB.mascotLabel` | Pötty, the mascot |  |
| `ONB.welcomeTitle` | Hi! This is your quiet, private place. |  |
| `ONB.welcomeText` | A few questions and we will make it yours. You can skip any question and change everything later. |  |
| `ONB.welcomeRestore` | I already have a backup from another device |  |
| `ONB.nickTitle` | What should I call you? |  |
| `ONB.nickText` | A nickname is enough. It stays on this device, encrypted. |  |
| `ONB.nickLabel` | Nickname |  |
| `ONB.nickPlaceholder` | e.g. Sam |  |
| `ONB.substancesTitle` | What would you like to stay away from? |  |
| `ONB.substancesText` | You can choose more than one. Nobody else sees this. |  |
| `ONB.otherLabel` | Other, in your own words |  |
| `ONB.startTitle` | How long has your journey been? |  |
| `ONB.startToday` | I start today |  |
| `ONB.startEarlier` | I started earlier |  |
| `ONB.startDateLabel` | Start of your journey |  |
| `ONB.startFuture` | A future date is not possible. Choose today or an earlier day. |  |
| `ONB.goalTitle` | What would be a good goal now? |  |
| `ONB.goalText` | It is not a race: a small step you can reach. |  |
| `ONB.goalOption` | 7 days | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `ONB.goalCustom` | My own goal |  |
| `ONB.goalCustomLabel` | How many days should your goal be? |  |
| `ONB.goalInvalid` | The goal can be between 1 and 3650 days. |  |
| `ONB.costTitle` | How much did you spend on it on an average day? |  |
| `ONB.costText` | An estimate is fine. We use it to work out how much you keep. Optional. |  |
| `ONB.costLabel` | Daily cost ($) |  |
| `ONB.costMonthly` | That is about 7 a month. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `ONB.costInvalid` | The daily cost must be a number between 0 and $1,000,000. |  |
| `ONB.triggersTitle` | Which situations are harder? |  |
| `ONB.triggersText` | If we know when you are more vulnerable, we can suggest better ideas. You can choose more than one. |  |
| `ONB.triggerShort.stress` | Stress |  |
| `ONB.triggerShort.loneliness` | Loneliness |  |
| `ONB.triggerShort.weekend` | Weekend |  |
| `ONB.triggerShort.social` | Parties |  |
| `ONB.triggerShort.fatigue` | Tiredness |  |
| `ONB.triggerShort.boredom` | Boredom |  |
| `ONB.triggerShort.conflict` | Arguments |  |
| `ONB.triggersCustomLabel` | My own situation |  |
| `ONB.triggerRemove` | Remove 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `ONB.triggersCustomAdd` | Add |  |
| `ONB.pinTitle` | Lock it with a PIN or passphrase |  |
| `ONB.pinText` | This encrypts everything you just entered. We cannot recover it for you, so you will get a recovery code. |  |
| `ONB.pinSaving` | Saving… |  |
| `ONB.recoveryTitle` | Your recovery code |  |
| `ONB.recoveryText` | This reopens your data if you forget your PIN. Save it, you only see it now. |  |
| `ONB.recoveryConfirm` | I saved it somewhere safe |  |
| `ONB.doneTitle` | Great work, 7! | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `ONB.doneText` | Your own place is ready. Every day counts. |  |
| `ONB.restartNote` | If you leave during the questions, we start again from the beginning next time. Until then nothing is saved. |  |
| `ONB.languageLabel` | Nyelv / Language |  |
| `ONB.noName` | Friend |  |
| `SETUP.nickLabel` | What should I call you? (optional) |  |
| `SETUP.title` | Make it yours |  |
| `SETUP.progress` | 7 / 2026. október 1. done | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `SETUP.goal` | Set a goal |  |
| `SETUP.cost` | How much did you spend on it a day? |  |
| `SETUP.triggers` | When is it harder? |  |
| `SETUP.notNow` | Not now |  |
| `SETUP.save` | Save |  |
| `SETUP.stats` | Statistics |  |
| `SETUP.nextBadge` | Next milestone |  |
| `SETUP.badgeIn` | in 7 days | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `SETUP.badgeDone` | All earned |  |
| `SETUP.goalLine` | 7 days to your goal | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `SETUP.thought` | Thought for today |  |
| `SETUP.moodLogged` | Today's mood |  |

## Bevezető, Krízisképernyő, Beállítások → Névjegy

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `T.disclaimer` | The Sobriety Counter helps you track and support your journey. It is not a medical device and does not replace professional help. | Határ-mondat: megjelenik a bevezetőben, a krízisképernyőn, a Névjegyben, a README-ben és az APK kiadási jegyzetében. |
| `T.privacyPromise` | All your data stays on this device, encrypted. No sign-up, no cloud, no tracking. |  |

## Bevezető

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `T.onboardingTitle` | Welcome. |  |
| `T.onboardingIntro` | This is a quiet, private place for your own journey. If a day is harder, it does not erase your path: every day you have achieved stays. |  |

## Főoldal

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `ENCOURAGEMENTS.e1.text` | Today, too, it matters that you are here. |  |
| `ENCOURAGEMENTS.e2.text` | One day at a time. That is the whole task. |  |
| `ENCOURAGEMENTS.e3.text` | You do not have to be perfect, it is enough to try again today. |  |
| `ENCOURAGEMENTS.e4.text` | Hard feelings are waves: they come, and they go. |  |
| `ENCOURAGEMENTS.e4.tags.0` | stress |  |
| `ENCOURAGEMENTS.e4.tags.1` | boredom |  |
| `ENCOURAGEMENTS.e5.text` | Asking for help takes courage. You can do it today, too. |  |
| `ENCOURAGEMENTS.e5.tags.0` | loneliness |  |
| `ENCOURAGEMENTS.e6.text` | I am with you at the weekend, too. Plan something pleasant. |  |
| `ENCOURAGEMENTS.e6.tags.0` | weekend |  |
| `ENCOURAGEMENTS.e6.tags.1` | social |  |
| `ENCOURAGEMENTS.e7.text` | You know what you need better today than yesterday. |  |
| `ENCOURAGEMENTS.e8.text` | Tiredness passes. Go to bed early today if you can. |  |
| `ENCOURAGEMENTS.e8.tags.0` | fatigue |  |
| `ENCOURAGEMENTS.e9.text` | An argument does not define you. Take three deep breaths. |  |
| `ENCOURAGEMENTS.e9.tags.0` | conflict |  |
| `ENCOURAGEMENTS.e10.text` | I am proud of every one of your days. |  |
| `GREETINGS.reggel` | Good morning |  |
| `GREETINGS.nap` | Hi |  |
| `GREETINGS.este` | Good evening |  |
| `GREETINGS.ejszaka` | Quiet night |  |
| `HOME.hello` | 7, 2026. október 1. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.appbarHello` | Hi, 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.totalLabel` | Your total sober days |  |
| `HOME.totalSub` | A slip does not erase them: all your sober days stay. |  |
| `HOME.newPhase` | A new chapter began today. Your path so far is kept. |  |
| `HOME.goalLabel` | Your goal |  |
| `HOME.goalProgress` | 7 / 2026. október 1. days | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.goalReached` | You reached your 7-day goal. Be proud of yourself! | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.goalNext` | What next? Suggestion: 7 days. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.goalSet` | Set a new goal |  |
| `HOME.goalNone` | Set a goal in Settings. |  |
| `HOME.savingsLabel` | You have kept |  |
| `HOME.savingsFun` | That is 7 × 2026. október 1. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.savingsSetup` | Enter your daily cost and we will work it out. |  |
| `HOME.moodTitle` | How are you today? |  |
| `HOME.moodHint` | Tap the one that is closest to how you feel right now. |  |
| `HOME.moodSaved` | Saved: 7. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.moodChange` | Change |  |
| `HOME.moodToday` | Today: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.moodIntensity` | How strong? |  |
| `HOME.moodNote` | A thought to go with it (optional) |  |
| `HOME.moodSave` | Save |  |
| `HOME.moodWeek` | Your week at a glance |  |
| `HOME.moodDonut` | Your moods this week |  |
| `HOME.moodMostCommon` | Most common: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.moodNoData` | No mood logged this week yet. |  |
| `HOME.energy` | Energy |  |
| `HOME.stress` | Tension |  |
| `HOME.outOf100` | out of 100 |  |
| `HOME.trendNone` | Not enough data yet. |  |
| `HOME.badgesTitle` | Milestones |  |
| `HOME.badgeLabel` | 7-day badge | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.badgeNext` | Next badge in 7 days | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.badgeAll` | You earned every badge. Incredible. |  |
| `HOME.thoughtsTitle` | Today's thoughts |  |
| `HOME.weekDays.0` | M |  |
| `HOME.weekDays.1` | T |  |
| `HOME.weekDays.2` | W |  |
| `HOME.weekDays.3` | T |  |
| `HOME.weekDays.4` | F |  |
| `HOME.weekDays.5` | S |  |
| `HOME.weekDays.6` | S |  |
| `HOME.weekSober` | sober day |  |
| `HOME.weekSlip` | slip |  |
| `HOME.helloBubble` | Thank you for sharing. I am here. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `HOME.pottyReact.positive` | I am glad! Enjoy your day. |  |
| `HOME.pottyReact.neutral` | Okay, that is fine too. One step at a time. |  |
| `HOME.pottyReact.hard` | Thank you for telling me. You do not have to do this alone. If you need it, the yellow button is always here. |  |
| `HOME.pottyReact.slip` | It happened, and it erases nothing. Every day you achieved is yours. A new chapter starts tomorrow. |  |
| `HOME.slipKind` | It was a hard day. You do not have to explain: your path so far is kept. |  |
| `TIPS.tip1.title` | Ride the wave |  |
| `TIPS.tip1.text` | A craving peaks within 10–20 minutes, then fades. Watch it go by like a wave. |  |
| `TIPS.tip1.tags.0` | stress |  |
| `TIPS.tip1.tags.1` | boredom |  |
| `TIPS.tip2.title` | Call someone |  |
| `TIPS.tip2.text` | A short call with a friend is sometimes worth more than any trick. |  |
| `TIPS.tip2.tags.0` | loneliness |  |
| `TIPS.tip3.title` | Plan the weekend |  |
| `TIPS.tip3.text` | Write down two things to look forward to on Friday and Saturday. |  |
| `TIPS.tip3.tags.0` | weekend |  |
| `TIPS.tip3.tags.1` | social |  |
| `TIPS.tip4.title` | Get some fresh air |  |
| `TIPS.tip4.text` | Ten minutes of walking lowers tension and takes your mind off it. |  |
| `TIPS.tip4.tags.0` | stress |  |
| `TIPS.tip4.tags.1` | fatigue |  |
| `TIPS.tip4.tags.2` | boredom |  |
| `TIPS.tip5.title` | Name the feeling |  |
| `TIPS.tip5.text` | When you say or write what you feel, it seems smaller. |  |
| `TIPS.tip5.tags.0` | conflict |  |
| `TIPS.tip5.tags.1` | stress |  |
| `TIPS.tip6.title` | Prepare ahead |  |
| `TIPS.tip6.text` | Think about what you will say if someone offers. A ready sentence helps. |  |
| `TIPS.tip6.tags.0` | social |  |
| `TIPS.tip7.title` | Rest more today |  |
| `TIPS.tip7.text` | Lack of sleep strengthens cravings. An early night is a step too. |  |
| `TIPS.tip7.tags.0` | fatigue |  |
| `TIPS.tip8.title` | Reward yourself |  |
| `TIPS.tip8.text` | Use a little of what you saved on a small joy. |  |

## Ünneplés (mérföldkő)

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `CELEBRATE.title` | 7 days! That is huge! | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `CELEBRATE.text` | Every single day was your decision. Congratulations! |  |
| `CELEBRATE.close` | Thank you |  |

## Gyors rögzítés

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `QUICK_ADD.title` | What are you logging? |  |
| `QUICK_ADD.items.checkin.label` | Mood |  |
| `QUICK_ADD.items.note.label` | Note |  |
| `QUICK_ADD.items.trigger.label` | Hard moment |  |
| `QUICK_ADD.items.urge.label` | I crave it now |  |
| `QUICK_ADD.slip` | I slipped |  |
| `QUICK_ADD.close` | Close |  |
| `T.quickTitle` | Quick log |  |
| `T.quickHint` | Tap to log. A note only if you want one. |  |
| `T.quickTriggerGroup` | Hard situation |  |
| `T.quickMoodGroup` | Mood |  |
| `T.quickIntensityLabel` | How strong? (optional) |  |
| `T.quickNoteLabel` | Note (optional, stays encrypted) |  |
| `T.quickSave` | Log it |  |
| `T.quickLogged` | Logged: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.sleepTrend` | Sleep quality (7 days) |  |
| `T.sleepBetter` | Better than the week before |  |
| `T.sleepSame` | Similar to the week before |  |
| `T.sleepWorse` | A little worse, and that is okay too. Look after yourself |  |
| `T.checkinPrompt` | How are you today? |  |
| `T.checkinDone` | You have already checked in today. Thank you for looking after yourself. |  |
| `T.moodLabel` | Mood |  |
| `T.sleepLabel` | How did you sleep? |  |
| `T.cravingLabel` | Craving today |  |
| `T.checkinTriggersLabel` | Was there a harder situation today? (optional) |  |
| `T.noteLabel` | Note (optional) |  |
| `T.triggerTitle` | A hard moment |  |
| `T.triggerIntro` | Good that you noticed. Logging it is a strength in itself. |  |
| `T.triggersLabel` | What set it off? |  |
| `T.copingLabel` | What helped? |  |
| `T.noteTitle` | Note |  |
| `T.noteEmpty` | Write something to save. |  |

## Idővonal

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `T.totalSober` | Total sober days |  |
| `T.totalSoberHint` | A slip does not erase them: all your sober days stay. |  |
| `T.heroCurrent` | Current chapter: 7 days · since 2026. október 1. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.phaseZero` | A new chapter began today. Your path so far is kept. |  |
| `T.phaseLabel` | Chapter 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.timelineTitle` | Your path |  |
| `T.timelineAria` | 7 chapters, 2026. október 1. sober days in total | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.phaseCardCurrent` | Current chapter |  |
| `T.phaseCardClosed` | Closed chapter |  |
| `T.phaseLessons` | What you took with you |  |
| `T.phaseIntentionsCurrent` | What you pay attention to |  |
| `T.phaseIntentionsClosed` | What you paid attention to |  |
| `T.phaseCounts` | 7 daily check-ins · 2026. október 1. hard moments you got through | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.phaseEntriesToggle` | Entries (7) | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.phaseStartsTomorrowBig` | Starts tomorrow |  |
| `T.phaseStartedToday` | Started today |  |
| `T.phaseDates` | 7 – 2026. október 1. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.typeLabels.checkin` | Daily check-in |  |
| `T.typeLabels.trigger` | Hard moment |  |
| `T.typeLabels.slip` | Slip: new chapter |  |
| `T.typeLabels.note` | Note |  |
| `TIMELINE_PAGE.title` | Timeline |  |
| `TIMELINE_PAGE.ranges.week` | Week |  |
| `TIMELINE_PAGE.ranges.month` | Month |  |
| `TIMELINE_PAGE.ranges.year` | Year |  |
| `TIMELINE_PAGE.chartTitle` | Your sober days |  |
| `TIMELINE_PAGE.chartDesc` | Sober days per day | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `TIMELINE_PAGE.soberDays` | 7 sober days | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `TIMELINE_PAGE.tooltip` | 7: 2026. október 1. sober days | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `TIMELINE_PAGE.moodTrend` | How your mood has changed |  |
| `TIMELINE_PAGE.patternsTitle` | What we noticed |  |
| `TIMELINE_PAGE.patternNone` | After a few entries, patterns show up here. All of it is calculated only on this device. |  |
| `TIMELINE_PAGE.patterns.weekend-stress` | You feel low more often at weekends. It is worth planning the weekend ahead. |  |
| `TIMELINE_PAGE.patterns.weekday-stress` | You feel low more often on weekdays. Maybe work or routine is weighing on you. |  |
| `TIMELINE_PAGE.patterns.most-common` | Lately your most common mood is: 7. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `TIMELINE_PAGE.logTitle` | Entries |  |
| `TIMELINE_PAGE.addEntry` | New entry |  |

## Megtakarítás

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `FUN_ITEMS.pizza.label` | pizzas |  |
| `FUN_ITEMS.cinema.label` | cinema tickets |  |
| `FUN_ITEMS.coffee.label` | coffees |  |
| `FUN_ITEMS.book.label` | good books |  |
| `FUN_ITEMS.icecream.label` | ice creams |  |
| `FUN_ITEMS.bike.label` | bike tune-ups |  |
| `FUN_ITEMS.trip.label` | weekend trips |  |
| `SAVINGS_MILESTONES.coffee.label` | A coffee with a friend |  |
| `SAVINGS_MILESTONES.cinema.label` | A cinema ticket |  |
| `SAVINGS_MILESTONES.book.label` | A good book |  |
| `SAVINGS_MILESTONES.gym.label` | A month at the gym |  |
| `SAVINGS_MILESTONES.dinner.label` | A dinner for two |  |
| `SAVINGS_MILESTONES.shoes.label` | New running shoes |  |
| `SAVINGS_MILESTONES.trip.label` | A weekend trip |  |
| `SAVINGS_MILESTONES.wellness.label` | A long weekend at a spa hotel |  |
| `SAVINGS_MILESTONES.holiday.label` | A holiday |  |
| `SAVINGS_MILESTONES.million.label` | A big, important goal: you decide what for |  |
| `SAVINGS_PAGE.title` | Savings |  |
| `SAVINGS_PAGE.perMonthTitle` | By month |  |
| `SAVINGS_PAGE.monthRow` | 7: 2026. október 1. days, 3 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `SAVINGS_PAGE.goalTitle` | Your savings goal |  |
| `SAVINGS_PAGE.goalProgress` | 7: 2026. október 1.% | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `SAVINGS_PAGE.goalSet` | Set a goal |  |

## Eszközök

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `CHALLENGE_CATALOG.water.text` | Drink plenty of water today |  |
| `CHALLENGE_CATALOG.walk.text` | Walk for ten minutes outdoors |  |
| `CHALLENGE_CATALOG.walk.tags.0` | stress |  |
| `CHALLENGE_CATALOG.walk.tags.1` | boredom |  |
| `CHALLENGE_CATALOG.call.text` | Call someone you love |  |
| `CHALLENGE_CATALOG.call.tags.0` | loneliness |  |
| `CHALLENGE_CATALOG.breathe.text` | Three deep breaths, slowly |  |
| `CHALLENGE_CATALOG.breathe.tags.0` | stress |  |
| `CHALLENGE_CATALOG.breathe.tags.1` | conflict |  |
| `CHALLENGE_CATALOG.sleep.text` | Go to bed half an hour earlier today |  |
| `CHALLENGE_CATALOG.sleep.tags.0` | fatigue |  |
| `CHALLENGE_CATALOG.plan.text` | Write down a pleasant plan for the weekend |  |
| `CHALLENGE_CATALOG.plan.tags.0` | weekend |  |
| `CHALLENGE_CATALOG.plan.tags.1` | social |  |
| `CHALLENGE_CATALOG.tidy.text` | Tidy a small corner at home |  |
| `CHALLENGE_CATALOG.tidy.tags.0` | boredom |  |
| `CHALLENGE_CATALOG.thanks.text` | Thank someone for something |  |
| `CHALLENGE_CATALOG.thanks.tags.0` | loneliness |  |
| `CHALLENGE_CATALOG.thanks.tags.1` | conflict |  |
| `CHALLENGE_CATALOG.stretch.text` | Stretch for five minutes |  |
| `CHALLENGE_CATALOG.stretch.tags.0` | fatigue |  |
| `CHALLENGE_CATALOG.stretch.tags.1` | stress |  |
| `CHALLENGE_CATALOG.note.text` | Write down what you are glad about today |  |
| `TOOLS.title` | Tools |  |
| `TOOLS.urgeTitle` | I really want to right now |  |
| `TOOLS.urgeText` | A craving is a wave: it peaks, then fades. Ten minutes, and I will walk you through. |  |
| `TOOLS.urgeStart` | Start |  |
| `TOOLS.urgePause` | Pause |  |
| `TOOLS.urgeResume` | Resume |  |
| `TOOLS.urgeAgain` | Again |  |
| `TOOLS.urgeBreathe` | Breathe with me: in for 4, out for 6. |  |
| `TOOLS.urgeLevels.rising` | The wave is rising now. This is the hardest part. |  |
| `TOOLS.urgeLevels.peak` | It is at its peak. Stay here, it is about to turn. |  |
| `TOOLS.urgeLevels.falling` | It is easing already. Can you feel it? |  |
| `TOOLS.urgeLevels.done` | The ten minutes are up. |  |
| `TOOLS.urgeDistractions.0` | Drink plenty of water |  |
| `TOOLS.urgeDistractions.1` | Step outside for fresh air |  |
| `TOOLS.urgeDistractions.2` | Call someone |  |
| `TOOLS.urgeDistractions.3` | Splash cold water on your face |  |
| `TOOLS.urgeDistractions.4` | Tidy one drawer |  |
| `TOOLS.urgeDistractions.5` | Listen to a song you love |  |
| `TOOLS.urgeAsk` | Has it passed? |  |
| `TOOLS.urgePassed` | Yes, it passed |  |
| `TOOLS.urgeStill` | Still going |  |
| `TOOLS.urgeVictory` | You did it! The wave passed, and you are still here. |  |
| `TOOLS.urgeStillText` | That is okay. You can start another ten minutes, or ask for help with the yellow button. |  |
| `TOOLS.urgeReasons` | This is why you are doing it |  |
| `TOOLS.challengesTitle` | Today's mini challenges |  |
| `TOOLS.challengeDone` | Done |  |
| `TOOLS.challengeDo` | I did it |  |
| `TOOLS.challengeStreak` | 7 days this week | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `TOOLS.challengeTotal` | So far you did something for yourself on 7 days. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `TOOLS.challengeSkipNote` | If you skip a day, the streak is not erased. The next small step can light the flame again. |  |
| `TOOLS.gratitudeTitle` | Gratitude journal |  |
| `TOOLS.gratitudeText` | Write down one to three things you are glad about today. |  |
| `TOOLS.gratitudeLabel` | Thing 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `TOOLS.gratitudeSave` | Write it down |  |
| `TOOLS.gratitudeEmpty` | Your gratitude wall is still empty. |  |
| `TOOLS.letterTitle` | A letter to yourself |  |
| `TOOLS.letterText` | Write yourself a letter: from you now to your later self. It stays encrypted, and shows up in a hard moment or at a milestone. |  |
| `TOOLS.letterLabel` | Text of the letter |  |
| `TOOLS.letterWhen` | When should it appear? |  |
| `TOOLS.letterWhenHard` | In a hard moment |  |
| `TOOLS.letterWhenMilestone` | At the next milestone |  |
| `TOOLS.letterSave` | Put it away |  |
| `TOOLS.letterSaved` | The letter is put away. |  |
| `TOOLS.letterOpen` | A letter from you |  |
| `TOOLS.letterEmpty` | You have not written a letter yet. |  |
| `TOOLS.breatheTitle` | Take a breath |  |
| `TOOLS.breatheText` | Let the blob guide you: it grows as you breathe in, and shrinks as you breathe out. |  |
| `TOOLS.reasonsTitle` | My reasons |  |
| `TOOLS.reasonsText` | Why are you doing this? They also show up on the help page and in the craving wave. |  |
| `TOOLS.reasonAdd` | New reason |  |
| `TOOLS.reasonLabel` | A reason that matters to you |  |
| `TOOLS.reasonsEmpty` | No reasons written down yet. One sentence is enough. |  |
| `TOOLS.reminderTitle` | Reminder |  |

## Beállítások

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `SETTINGS_PAGE.title` | Settings |  |
| `SETTINGS_PAGE.profile` | About you |  |
| `SETTINGS_PAGE.nickname` | Nickname |  |
| `SETTINGS_PAGE.substances` | What you stay away from |  |
| `SETTINGS_PAGE.goal` | Your goal (days) |  |
| `SETTINGS_PAGE.triggers` | Hard situations |  |
| `SETTINGS_PAGE.appearance` | Appearance |  |
| `SETTINGS_PAGE.theme` | Theme |  |
| `SETTINGS_PAGE.themeOptions.system` | Follow system |  |
| `SETTINGS_PAGE.themeOptions.light` | Light |  |
| `SETTINGS_PAGE.themeOptions.dark` | Dark |  |
| `SETTINGS_PAGE.motion` | Reduce motion |  |
| `SETTINGS_PAGE.motionHint` | Turns off animations and confetti. |  |
| `SETTINGS_PAGE.update` | Updates |  |
| `SETTINGS_PAGE.version` | Version: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `SETTINGS_PAGE.updateCheck` | Check for updates |  |
| `SETTINGS_PAGE.updateChecking` | Checking… |  |
| `SETTINGS_PAGE.updateNone` | You have the latest version. |  |
| `SETTINGS_PAGE.updateReady` | A new version is ready. I will apply it as soon as you finish what you are doing. |  |
| `SETTINGS_PAGE.updateApply` | Update now |  |
| `SETTINGS_PAGE.updateApkText` | At start and at most once a day the app checks GitHub for a newer Android version (a single anonymous request; GitHub only sees the IP address and the time, nothing from your journal). If there is one, you get a notice; Android always asks you to approve the install, and the new version installs over the old one, keeping your data. |  |
| `SETTINGS_PAGE.updateApkError` | Could not check just now (no network?). I will try again later. |  |
| `SETTINGS_PAGE.updateApkReady` | A new Android version is available. |  |
| `SETTINGS_PAGE.updateApkDownload` | Download the new version |  |
| `SETTINGS_PAGE.updateApkAuto` | Check for new versions once a day over the internet |  |
| `SETTINGS_PAGE.updateApkAutoHint` | When off, the app sends no network requests and only checks with the button. |  |
| `SETTINGS_PAGE.updateApkLink` | Open the download page |  |
| `SETTINGS_PAGE.updateUnsupported` | This browser does not support automatic updates. |  |
| `SETTINGS_PAGE.language` | Nyelv / Language |  |
| `SETTINGS_PAGE.languageHint` | The app reloads when you switch. Your data does not change. |  |
| `SETTINGS_PAGE.country` | Country (helplines) |  |
| `SETTINGS_PAGE.currency` | Currency |  |
| `SETTINGS_PAGE.currencyHint` | Only affects how amounts are shown, it does not convert them. The app reloads when you switch. |  |
| `SETTINGS_PAGE.feedback` | Feedback |  |
| `SETTINGS_PAGE.feedbackText` | Found a bug or have an idea? We open a pre-filled GitHub form. The app sends nothing by itself, and please do not put personal data in it. |  |
| `SETTINGS_PAGE.feedbackButton` | Send feedback |  |
| `T.storageVolatile` | Heads up: your browser does not allow persistent storage (e.g. private mode), so your data disappears when the tab is closed. Make an encrypted backup. |  |
| `T.deleteEntry` | Delete entry |  |
| `T.deleteEntryConfirm` | Are you sure you want to delete this entry? |  |
| `T.exportEncrypted` | Download an encrypted backup |  |
| `T.exportEncryptedInfo` | Can only be opened with your PIN or recovery code. Use it to move your journal to another device. |  |
| `T.exportJson` | Export as JSON (not encrypted) |  |
| `T.exportCsv` | Export as CSV (for spreadsheets, not encrypted) |  |
| `T.exportPlainWarning` | This file is NOT encrypted: anyone with access can read it. Download it anyway? |  |
| `T.importEncrypted` | Restore an encrypted backup |  |
| `T.importEncryptedInfo` | It replaces the current journal. You need the backup's PIN, or if you forgot it, your recovery code (you then set a new PIN). |  |
| `T.deleteAll` | Delete all data |  |
| `T.deleteAllInfo` | Permanently erases everything on this device in one step. It cannot be undone. |  |
| `T.deleteAllConfirm` | Are you sure you want to delete all data on this device? This cannot be undone. |  |
| `T.deleted` | All data deleted. |  |

## Zárolás és helyreállítás

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `T.pinLabel` | Choose a PIN (at least 4 digits) or a passphrase |  |
| `T.pinConfirmLabel` | Repeat the PIN |  |
| `T.pinHint` | This encrypts your journal. A longer passphrase (e.g. three words) protects far better than a short number. We cannot recover it for you, so you will get a recovery code. |  |
| `T.pinMismatch` | The two PINs do not match. |  |
| `T.recoveryTitle` | Your recovery code |  |
| `T.recoveryIntro` | If you forget your PIN, this code lets you open your journal again. Write it down and keep it somewhere safe. You only see it now. |  |
| `T.recoveryConfirm` | I wrote it down and it is safe |  |
| `T.lockTitle` | Welcome back |  |
| `T.unlockButton` | Open |  |
| `T.forgotPin` | I forgot my PIN |  |
| `T.recoveryCodeLabel` | Recovery code |  |
| `T.lockNow` | Lock |  |

## Előzetes verzió tájékoztató

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `PREVIEW.badge` | Preview version |  |
| `PREVIEW.text` | This app is still in development and its content has not yet been reviewed by a professional. It is not a medical device and does not replace professional help. If things get hard, the yellow button is always available. |  |
| `PREVIEW.feedback` | Send feedback |  |

## Frissítés

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `UPDATE.apkBanner` | A new Android version is available. |  |
| `UPDATE.apkApply` | Download |  |
| `UPDATE.banner` | A new version is available. |  |
| `UPDATE.apply` | Update |  |
| `UPDATE.later` | Later |  |
| `UPDATE.applied` | Updated. Good to see you again! |  |
| `UPDATE.toast` | A new version has been downloaded. I will update automatically the next time it locks. |  |

## Választható listák (hangulat, helyzet, megküzdés)

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `PRESETS.TRIGGERS.stress` | Stress (work, study) |  |
| `PRESETS.TRIGGERS.weekend` | Weekend |  |
| `PRESETS.TRIGGERS.loneliness` | Loneliness |  |
| `PRESETS.TRIGGERS.boredom` | Boredom |  |
| `PRESETS.TRIGGERS.conflict` | Conflict, arguments |  |
| `PRESETS.TRIGGERS.social` | Social event, party |  |
| `PRESETS.TRIGGERS.social-pressure` | Peer pressure, being offered |  |
| `PRESETS.TRIGGERS.routine` | Habit, routine (e.g. after work) |  |
| `PRESETS.TRIGGERS.celebration` | Celebration, good news |  |
| `PRESETS.TRIGGERS.fatigue` | Tiredness, lack of sleep |  |
| `PRESETS.TRIGGERS.money` | Money worries |  |
| `PRESETS.TRIGGERS.place` | A familiar place |  |
| `PRESETS.TRIGGERS.people` | Certain people |  |
| `PRESETS.TRIGGERS.anger` | Anger, disappointment |  |
| `PRESETS.TRIGGERS.evening` | Evening, night-time hours |  |
| `PRESETS.COPING.walk` | I walked or exercised |  |
| `PRESETS.COPING.called` | I called someone |  |
| `PRESETS.COPING.breathing` | Breathing exercise |  |
| `PRESETS.COPING.drink-other` | I had something else to eat or drink |  |
| `PRESETS.COPING.left` | I left the situation |  |
| `PRESETS.COPING.waited` | I waited for it to pass |  |
| `PRESETS.COPING.wrote` | I wrote down what I feel |  |
| `PRESETS.COPING.shower` | Shower, cold water |  |
| `PRESETS.OUTCOMES.coped` | I got through it |  |
| `PRESETS.OUTCOMES.hard` | It was hard, but I am past it |  |
| `PRESETS.OUTCOMES.ongoing` | Still going |  |
| `PRESETS.MOODS.excited` | Excited |  |
| `PRESETS.MOODS.cheerful` | Cheerful |  |
| `PRESETS.MOODS.grateful` | Grateful |  |
| `PRESETS.MOODS.energetic` | Energetic |  |
| `PRESETS.MOODS.sensitive` | Sensitive |  |
| `PRESETS.MOODS.confused` | Confused |  |
| `PRESETS.MOODS.bored` | Bored |  |
| `PRESETS.MOODS.stressed` | Stressed |  |
| `PRESETS.MOODS.angry` | Angry |  |
| `PRESETS.MOODS.unsure` | Unsure |  |
| `PRESETS.MOODS.hurt` | Hurt |  |
| `PRESETS.MOODS.guilty` | Guilty |  |
| `PRESETS.SUBSTANCES.alcohol` | Alcohol |  |
| `PRESETS.SUBSTANCES.tobacco` | Smoking |  |
| `PRESETS.SUBSTANCES.gambling` | Gambling |  |
| `PRESETS.SUBSTANCES.drugs` | Drugs |  |
| `PRESETS.SUBSTANCES.pills` | Medication misuse |  |
| `PRESETS.SUBSTANCES.other` | Other |  |
| `PRESETS.SLEEP_LEVELS.1` | Very poor |  |
| `PRESETS.SLEEP_LEVELS.2` | Poor |  |
| `PRESETS.SLEEP_LEVELS.3` | Fair |  |
| `PRESETS.SLEEP_LEVELS.4` | Good |  |
| `PRESETS.SLEEP_LEVELS.5` | Very good |  |
| `PRESETS.CRAVING_LEVELS.0` | None |  |
| `PRESETS.CRAVING_LEVELS.1` | Mild |  |
| `PRESETS.CRAVING_LEVELS.2` | Fair |  |
| `PRESETS.CRAVING_LEVELS.3` | Strong |  |
| `PRESETS.QUICK_TEMPLATES.q-tired` | Tiredness / Exhaustion |  |
| `PRESETS.QUICK_TEMPLATES.q-stress` | A stressful day |  |
| `PRESETS.QUICK_TEMPLATES.q-social` | Peer pressure |  |
| `PRESETS.QUICK_TEMPLATES.q-evening` | An evening habit |  |
| `PRESETS.QUICK_TEMPLATES.q-lonely` | Loneliness |  |
| `PRESETS.QUICK_TEMPLATES.q-calm` | Calm / Balanced |  |
| `PRESETS.QUICK_TEMPLATES.q-hopeful` | Hopeful |  |
| `PRESETS.QUICK_TEMPLATES.q-anxious` | Anxious |  |

## Képernyőolvasó-szövegek

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `A11Y.mainNav` | Main navigation |  |
| `A11Y.quickAdd` | Quick log |  |
| `A11Y.avatar` | Your mood and Settings |  |
| `A11Y.moodGroup` | How are you today? |  |
| `A11Y.skipLink` | Skip to content |  |

## Általános felület

| Kulcs | Szöveg | Kontextus |
|---|---|---|
| `MISC.loading` | Loading… |  |
| `MISC.details` | Details |  |
| `MISC.savingsTab` | Savings |  |
| `MISC.remindersOn` | Reminder turned on. |  |
| `MISC.remindersOff` | Reminder turned off. |  |
| `MISC.entryDeleted` | Entry deleted. |  |
| `MISC.backupFile` | Backup file |  |
| `MISC.backupPin` | PIN of the backup |  |
| `MISC.haveBackup` | I already have a backup from another device |  |
| `MISC.pinField` | PIN |  |
| `MISC.pinChangedKept` | The PIN has changed. Your journal is kept. |  |
| `MISC.pinChanged` | The PIN has changed. |  |
| `MISC.previousRestored` | The earlier copy has been restored. |  |
| `MISC.backupRestored` | The backup has been restored. |  |
| `MISC.importConfirm` | The backup will replace the current journal. Continue? |  |
| `MISC.importFileLabel` | Backup file (encrypted backup or JSON export) |  |
| `MISC.importPinLabel` | PIN of the backup (for an encrypted backup) |  |
| `MISC.contentVersion` | Content version: 7 · 2026. október 1. | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `MISC.goalPlaceholder` | e.g. a new bike |  |
| `MISC.goalAmountInvalid` | Enter a positive amount. |  |
| `MISC.costRangeInvalid` | The daily cost must be a number between 0 and $1,000,000. |  |
| `MISC.entry.sleep` | Sleep |  |
| `MISC.entry.craving` | Craving |  |
| `MISC.entry.situation` | Situation |  |
| `MISC.entry.intensity` | Strength |  |
| `MISC.entry.coping` | What helped |  |
| `MISC.entry.lesson` | Lesson |  |
| `MISC.entry.intention` | Paying attention to |  |
| `MISC.trendAria` | 7: 7-day trend | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `MISC.badgeLocked` |  (not reached yet) |  |
| `MISC.dayWord` | days |  |
| `MISC.urgeTimer` | 7 seconds left | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `MISC.urgeTry` | Try this |  |
| `MISC.reasonDelete` | Delete: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `MISC.notSupportedNotifications` | This browser does not support notifications. |  |
| `MISC.file.unreadable` | The file cannot be read (damaged or in the wrong format). |  |
| `MISC.export.types.checkin` | Daily check-in |  |
| `MISC.export.types.trigger` | Hard moment |  |
| `MISC.export.types.slip` | Slip, new chapter |  |
| `MISC.export.types.note` | Note |  |
| `MISC.export.types.urge` | Craving wave |  |
| `MISC.export.types.challenge` | Daily challenge |  |
| `MISC.export.types.gratitude` | Gratitude |  |
| `MISC.export.types.letter` | Letter |  |
| `MISC.export.header.0` | Date |  |
| `MISC.export.header.1` | Time |  |
| `MISC.export.header.2` | Type |  |
| `MISC.export.header.3` | Mood |  |
| `MISC.export.header.4` | Sleep |  |
| `MISC.export.header.5` | Craving |  |
| `MISC.export.header.6` | Triggers |  |
| `MISC.export.header.7` | Strength |  |
| `MISC.export.header.8` | Coping |  |
| `MISC.export.header.9` | Outcome |  |
| `MISC.export.header.10` | Lesson |  |
| `MISC.export.header.11` | Note |  |
| `MISC.export.header.12` | Details |  |
| `MISC.export.urge` | 7 min, passed | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `MISC.export.letterMilestone` | at a milestone (7 days) | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `MISC.export.letterHard` | in a hard moment |  |
| `NAV_TABS.home.label` | Home |  |
| `NAV_TABS.home.title` | Home |  |
| `NAV_TABS.timeline.label` | Timeline |  |
| `NAV_TABS.timeline.title` | Timeline |  |
| `NAV_TABS.savings.label` | Savings |  |
| `NAV_TABS.savings.title` | Savings |  |
| `NAV_TABS.tools.label` | Tools |  |
| `NAV_TABS.tools.title` | Tools |  |
| `NAV_TABS.settings.label` | Settings |  |
| `NAV_TABS.settings.title` | Settings |  |
| `T.appName` | Sobriety Counter |  |
| `T.secretStrength.weak` | Basic protection: it can be guessed from a stolen backup file within minutes. A longer passphrase is recommended. |  |
| `T.secretStrength.fair` | Fair protection. |  |
| `T.secretStrength.strong` | Strong protection. |  |
| `T.startDateLabel` | When did your journey begin? |  |
| `T.dailyCostLabel` | Daily cost you save this way ($, optional) |  |
| `T.dailyCostHint` | An estimate is fine. You can change it any time. |  |
| `T.createButton` | Let's start |  |
| `T.copy` | Copy |  |
| `T.copied` | Copied |  |
| `T.newPinLabel` | New PIN |  |
| `T.recoverButton` | Restore access |  |
| `T.resetTitle` | I have neither the PIN nor the recovery code |  |
| `T.resetInfo` | Your journal is encrypted so that nobody but you, not even us, can open it. Without the PIN and the recovery code the entries cannot be recovered. If you wish, you can start over: this permanently erases everything on this device. |  |
| `T.resetBackupHint` | If you have an encrypted backup file and remember its PIN, you can restore it after the erase. |  |
| `T.resetConfirmLabel` | To confirm, type in capitals: DELETE |  |
| `T.resetWord` | DELETE |  |
| `T.resetButton` | Erase all data permanently and start over |  |
| `T.resetWordMismatch` | The confirmation word does not match. Nothing was erased. |  |
| `T.corruptedText` | The saved journal looks damaged. An earlier, intact copy exists. Restore it? The latest change may be lost. |  |
| `T.restorePrevious` | Restore the earlier copy |  |
| `T.navHome` | Home |  |
| `T.navJournal` | Journal |  |
| `T.navLog` | Log |  |
| `T.navSettings` | Settings |  |
| `T.currentPhase` | Current chapter |  |
| `T.currentPhaseSince` | since 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.days` | 7 days | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.longestPhase` | Longest chapter |  |
| `T.saved` | Money saved |  |
| `T.savingsCurrentPhase` | In this chapter: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.savingsPerMonth` | At the current pace, about 7 a month | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.savingsAchieved` | That already covers: |  |
| `T.savingsNext` | Next idea: 7, about 2026. október 1. to go | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.savingsAllMilestones` | You have passed every idea. You decide what to spend it on. |  |
| `T.savingsEstimate` | An estimate based on your daily cost; prices are only indicative. |  |
| `T.savingsChanged` | The daily cost changed along the way: every day is counted at the amount that applied then. |  |
| `T.savingsGoal` | Your own goal |  |
| `T.savingsGoalRemaining` | 7 to go | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.savingsGoalReached` | You have the money for it. You deserve it. |  |
| `T.savingsPhase` | Saved in this chapter: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.costTitle` | Daily cost |  |
| `T.costNow` | Currently: 7 / day | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.costNewLabel` | New daily amount ($) |  |
| `T.costModeLegend` | What does the change apply to? |  |
| `T.costModeFrom` | It changed from now on: earlier days keep the old amount |  |
| `T.costModeAll` | I am correcting it retroactively: my earlier estimate was off |  |
| `T.costFromLabel` | From this date |  |
| `T.costSave` | Save amount |  |
| `T.costHistoryTitle` | Amounts over time |  |
| `T.costHistoryRow` | 7: 2026. október 1. / day | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `T.costSavedFrom` | Saved. Earlier days keep their value. |  |
| `T.costSavedAll` | Saved. The whole period is now counted with the new amount. |  |
| `T.goalTitle` | Savings goal (optional) |  |
| `T.goalLabelLabel` | What are you saving for? |  |
| `T.goalAmountLabel` | Goal amount ($) |  |
| `T.goalSave` | Save goal |  |
| `T.goalClear` | Remove goal |  |
| `T.savedSetup` | Enter your daily cost in the settings and you can see your savings here. |  |
| `T.coped` | Hard moments you got through |  |
| `T.actionCheckin` | Daily check-in |  |
| `T.actionTrigger` | Log a hard moment |  |
| `T.actionSlip` | I slipped |  |
| `T.actionNote` | Note |  |
| `T.save` | Save |  |
| `T.cancel` | Cancel |  |
| `T.saved_ok` | Saved. |  |
| `T.intensityLabel` | How strong was it? (1–5) |  |
| `T.outcomeLabel` | How did it turn out? |  |
| `T.journalTitle` | Journal |  |
| `T.journalEmpty` | No entries yet. Your journal starts with the first daily check-in. |  |
| `T.lessonsTitle` | What you take with you |  |
| `T.settingsTitle` | Settings |  |
| `T.savingsSection` | Savings |  |
| `T.journeySection` | Your path |  |
| `T.journeyStartLabel` | Start of your journey |  |
| `T.remindersSection` | Reminders |  |
| `T.remindersLabel` | Gentle daily reminder |  |
| `T.remindersTimeLabel` | Time |  |
| `T.remindersInfo` | The notification text is neutral ("A minute for you"), so it reveals nothing on a lock screen. It works without a server, so not every browser supports exact timing; then you get a gentle nudge when you open the app. |  |
| `T.remindersDenied` | The browser did not allow notifications. You can change that in the browser settings. |  |
| `T.securitySection` | Security |  |
| `T.autoLockLabel` | Auto-lock after this many minutes of inactivity |  |
| `T.changePin` | Change PIN |  |
| `T.oldPinLabel` | Current PIN |  |
| `T.newRecovery` | Create a new recovery code |  |
| `T.newRecoveryInfo` | The old code stops working. |  |
| `T.dataSection` | Your data |  |
| `T.aboutSection` | About and privacy |  |
| `T.errGeneric` | Something did not work. Your data is safe; please try again. |  |
| `T.errWrongPin` | That is not the right PIN. |  |
| `UX.info` | Good to know |  |
| `UX.gotIt` | Got it |  |
| `UX.later` | Later |  |
| `UX.dontAsk` | Do not ask again |  |
| `UX.close` | Close |  |
| `UX.helpLogin` | Help signing in |  |
| `UX.showSecret` | Show |  |
| `UX.hideSecret` | Hide |  |
| `UX.erase` | Delete |  |
| `UX.pinPad` | PIN keypad |  |
| `UX.privacyTitle` | Privacy |  |
| `UX.pinInfoTitle` | What is the PIN for? |  |
| `UX.savingsInfoTitle` | How it is calculated |  |
| `UX.goalInfoTitle` | The goal |  |
| `UX.backupDueTitle` | Back up your journal |  |
| `UX.backupDueText` | It has been a while since your last encrypted backup. If the phone is lost or breaks, the journal goes with it. A backup takes half a minute. |  |
| `UX.backupNow` | Back up now |  |
| `UX.copyBackup` | Copy the encrypted backup |  |
| `UX.copyBackupDone` | Copied. Paste it somewhere safe (e.g. a note or an e-mail to yourself). |  |
| `UX.pasteBackup` | Or paste the backup text |  |
| `UX.pasteBackupPlaceholder` | The copied backup text |  |
| `UX.trustedTitle` | Trusted person |  |
| `UX.trustedName` | Name |  |
| `UX.trustedPhone` | Phone number |  |
| `UX.trustedSave` | Save |  |
| `UX.trustedClear` | Remove |  |
| `UX.trustedCall` | Call 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `UX.trustedInvalid` | Enter a valid phone number (digits, + and spaces only). |  |
| `UX.trustedCrisis` | Someone you trust |  |
| `UX.quickPin` | Quick PIN keypad |  |
| `UX.quickPinInfo` | The lock screen shows a number pad and opens by itself after the last digit. For this, the number of digits in your PIN (not the PIN itself) is stored unencrypted on the device. Switched off, even the length is not visible. |  |
| `UX.moreSettings` | More |  |
| `UX.storageErrorTitle` | The journal is not available right now |  |
| `UX.storageErrorText` | The phone's storage is not responding, so we neither open nor overwrite your journal. Please try again a little later. The helplines are available in the meantime. |  |
| `UX.retry` | Try again |  |
| `UX.clipboardWarning` | Copied. Once you have saved it (e.g. in a password manager), copy something else so the code does not stay on the clipboard. |  |
| `UX.backupDoneTitle` | Backup created and verified |  |
| `UX.backupSavedDevice` | Saved to the place you chose, as "7". | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `UX.backupSavedDownload` | Downloaded as "7" (usually to your Downloads folder). | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `UX.backupEncryptedNote` | The file is encrypted: it opens only with your PIN or your recovery code. We read it back and checked that it is intact. |  |
| `UX.backupElsewhere` | Tip: keep a copy somewhere else too (e.g. your own email or cloud), so it survives losing the phone. |  |
| `UX.backupShare` | Share or send elsewhere |  |
| `UX.backupCancelled` | The backup was cancelled; no file was created. |  |
| `UX.plainSavedNote` | Note: this file is NOT encrypted. Anyone with access can read it; do not share it, and delete it when you no longer need it. |  |
| `UX.restoreForgotPin` | I forgot my PIN: restore with the recovery code |  |
| `UX.restoreNewPin` | New PIN for this device |  |
| `UX.restoreNewPin2` | New PIN again |  |
| `UX.phoneChangeTitle` | Changing phones |  |
| `UX.phoneChangeSteps.0` | On the old phone: Settings → Data → "Encrypted backup". Choose a place (e.g. Drive or email to yourself), or share it. |  |
| `UX.phoneChangeSteps.1` | Install the app on the new phone (from the same place) and open it. |  |
| `UX.phoneChangeSteps.2` | On the first screen: "I have a backup from another device" → pick the file and enter your PIN. |  |
| `UX.phoneChangeSteps.3` | If you forgot the PIN, you can restore with the recovery code instead and set a new PIN. |  |
| `UX.phoneChangeSteps.4` | Once everything is on the new phone, you can delete the journal on the old one with Settings → "Delete all data". |  |
| `UX.secureScreen` | Screenshot protection |  |
| `UX.secureScreenInfo` | When on, the phone does not allow screenshots of the app, and its content is hidden in the recent apps list. Downside: you cannot send a screenshot to yourself or your supporter either. |  |
| `UX.debugSignedWarning` | This install was signed with a temporary (developer) key. A later release will not install over it as an update: before switching, make an encrypted backup, and restore the journal from it after removing the old app. |  |
| `UX.helplinesVerified` | Contact details last checked: 7 | Változó szöveg; minta (7, 2026. október 1., 3, 2) értékekkel. |
| `UX.offlineNote` | The attempt limit only protects the PIN typed on screen. Someone who obtains the phone's stored data or a backup file can try guesses by machine, so a longer passphrase is much safer. |  |
| `UX.welcomeInfo` | What is this app? |  |
| `UX.welcomeInfoText` | A few questions and we will make it yours. You can skip any question and change everything later. If you leave during the questions, we start over, and nothing is saved until then. |  |
