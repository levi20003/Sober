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
import { HELPLINES, GROUNDING, URGE_WAVE, CRISIS_STEPS, RISK_MESSAGES, T } from '../../content/hu.js';
import { riskContexts } from '../../domain/risk.js';
import { splitHelplines } from '../../domain/helplines.js';
import { useModalDialog } from '../../hooks/useModalDialog.js';
import { EmergencyBanner, HelplineList } from './HelplineList.jsx';
import { BreathingExercise } from './BreathingExercise.jsx';

/**
 * @param {object}   props
 * @param {Function} props.onClose
 * @param {object[]} [props.events]  journal events, only when already unlocked (tailors the risk note)
 * @param {Date}     [props.now]
 * @param {object}   [props.clock]   injectable clock for the breathing exercise (tests)
 */
export function CrisisOverlay({ onClose, events = [], now = new Date(), clock }) {
  const ref = useRef(null);
  useModalDialog(ref, onClose);
  const { emergency, talk } = splitHelplines(HELPLINES);
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
        {emergency.map((line) => <EmergencyBanner key={line.id} line={line} />)}
        {risk && (
          <aside className="card card-soft" aria-label={RISK_MESSAGES[risk].title}>
            <h2 className="h3">{RISK_MESSAGES[risk].title}</h2>
            <p>{RISK_MESSAGES[risk].text}</p>
          </aside>
        )}
        <HelplineList lines={talk} />

        <section className="card" aria-labelledby="breathe-h">
          <h2 id="breathe-h">{T.crisisBreatheTitle}</h2>
          <BreathingExercise clock={clock} />
        </section>

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
