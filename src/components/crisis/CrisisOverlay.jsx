// <CrisisOverlay />: "Most segítségre van szükségem".
//
// A full-screen modal <dialog> layered over whatever the user was doing (their
// unfinished form stays intact underneath). Safety properties (docs/SAFETY.md):
//  - no dependency on storage, crypto or auth (enforced by tests/crisis.test.js),
//    so it works before setup, while locked, and if the vault is damaged
//  - precached by the service worker → fully offline; calls use tel: links
//  - order: immediate danger → a person to talk to → self-soothing → grounding
//  - Esc, "Vissza" or the browser Back button closes it; nothing is recorded

import { useRef } from 'react';
import { COUNTRIES, helplinesFor, GROUNDING, URGE_WAVE, CRISIS_STEPS, RISK_MESSAGES, T, UX } from '../../content/index.js';
import { riskContexts } from '../../domain/risk.js';
import { splitHelplines } from '../../domain/helplines.js';
import { useModalDialog } from '../../hooks/useModalDialog.js';
import { usePrefs } from '../../hooks/usePrefs.js';
import { EmergencyBanner, HelplineList } from './HelplineList.jsx';
import { BreathingExercise } from './BreathingExercise.jsx';

/**
 * @param {object}   props
 * @param {Function} props.onClose
 * @param {object[]} [props.events]  journal events, only when already unlocked (tailors the risk note)
 * @param {string[]} [props.reasons] the user's own reasons (profile), only when already unlocked
 * @param {Date}     [props.now]
 * @param {object}   [props.clock]   injectable clock for the breathing exercise (tests)
 */
export function CrisisOverlay({ onClose, events = [], reasons = [], trusted = null, now = new Date(), clock }) {
  const ref = useRef(null);
  useModalDialog(ref, onClose);
  const [prefs, setPrefs] = usePrefs();
  const { emergency, talk } = splitHelplines(helplinesFor(prefs.country));
  const risk = riskContexts(now, events)[0];

  return (
    <dialog ref={ref} className="crisis-overlay" aria-labelledby="crisis-h">
      <header className="topbar">
        <span className="brand">{T.appName}</span>
        <div className="topbar-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{T.crisisBack}</button>
        </div>
      </header>
      <main className="screen crisis">
        <h1 id="crisis-h">{T.crisisTitle}</h1>
        <p className="lead">{T.crisisIntro}</p>
        <fieldset className="chips country-picker">
          <legend>{T.crisisCountry}</legend>
          <div className="chip-row">
            {COUNTRIES.map((c) => (
              <label className="chip" key={c.id}>
                <input type="radio" name="country" value={c.id} checked={prefs.country === c.id} onChange={() => setPrefs({ country: c.id })} />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
          <p className="hint">{T.crisisCountryHint}</p>
        </fieldset>
        {emergency.map((line) => <EmergencyBanner key={line.id} line={line} />)}
        {risk && (
          <aside className="card card-soft" aria-label={RISK_MESSAGES[risk].title}>
            <h2 className="h3">{RISK_MESSAGES[risk].title}</h2>
            <p>{RISK_MESSAGES[risk].text}</p>
          </aside>
        )}
        {trusted && (
          <section className="card" aria-labelledby="trusted-h">
            <h2 id="trusted-h">{UX.trustedCrisis}</h2>
            <a className="btn btn-call btn-primary" href={`tel:${trusted.phone.replace(/[^\d+]/g, '')}`}><span className="call-number">{trusted.phone}</span><span>{trusted.name}</span></a>
          </section>
        )}
        <HelplineList lines={talk} />

        <section className="card" aria-labelledby="breathe-h">
          <h2 id="breathe-h">{T.crisisBreatheTitle}</h2>
          <BreathingExercise clock={clock} />
        </section>

        {reasons.length > 0 && (
          <section className="card card-soft" aria-labelledby="reasons-h">
            <h2 id="reasons-h">{T.crisisReasons}</h2>
            <ul className="steps">{reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          </section>
        )}
        <section className="card"><h2>{URGE_WAVE.title}</h2><p>{URGE_WAVE.text}</p></section>
        <section className="card">
          <h2>{T.crisisNowSteps}</h2>
          <ul className="steps">{CRISIS_STEPS.map((s) => <li key={s}>{s}</li>)}</ul>
        </section>
        <section className="card">
          <h2>{GROUNDING.title}</h2>
          <ol className="steps">{GROUNDING.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        </section>

        <p className="hint center">{T.crisisOffline}</p>
        <p className="hint center disclaimer">{T.disclaimer}</p>
        <button type="button" className="btn btn-ghost" onClick={onClose}>{T.crisisBack}</button>
      </main>
    </dialog>
  );
}
