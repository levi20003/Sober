// "Tedd a sajátoddá": a bevezetőből kivett, nem kötelező beállítások (cél, napi költség, nehéz helyzetek) egy kártyán,
// mindegyik egy-egy alulról felugró lapban. Ha minden megvan, vagy a felhasználó elrejti, a kártya eltűnik.
import { useState } from 'react';
import { ONB, SETUP, T, UX } from '../../content/index.js';
import { MAX_GOAL_DAYS } from '../../domain/schema.js';
import { parseHufInput } from '../../domain/savings.js';
import { Actions } from '../../domain/timelineReducer.js';
import { userError } from '../../lib/errors.js';
import { haptic } from '../../lib/haptics.js';
import { hasSeen, markSeen } from '../../hooks/usePrefs.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useToast } from '../../hooks/useToast.jsx';
import { useFormAction } from '../../hooks/useFormAction.js';
import { Icon } from '../icons/Icon.jsx';
import { Sheet } from '../Info.jsx';
import { CostInput, GoalPicker, TriggerPicker } from '../onboarding/Pickers.jsx';

function GoalSheet({ onClose }) {
  const { dispatch } = useTimeline();
  const [goal, setGoal] = useState(null);
  const [custom, setCustom] = useState('');
  const save = useFormAction(async () => {
    const n = goal === 'custom' ? Number(custom) : goal;
    if (!Number.isInteger(n) || n < 1 || n > MAX_GOAL_DAYS) throw userError(ONB.goalInvalid);
    await dispatch({ type: Actions.UPDATE_PROFILE, payload: { goalDays: n } });
    onClose(true);
  });
  return (
    <Sheet title={ONB.goalTitle} closeLabel={UX.close} onClose={() => onClose(false)}>
      <form className="stack" onSubmit={save.onSubmit}>
        <GoalPicker value={goal} custom={custom} onChange={setGoal} onCustom={setCustom} />
        <button type="submit" className="btn btn-primary btn-big" disabled={goal === null || save.busy}>{SETUP.save}</button>
      </form>
    </Sheet>
  );
}

function CostSheet({ onClose }) {
  const { dispatch } = useTimeline();
  const [cost, setCost] = useState('');
  const save = useFormAction(async () => {
    const amountHuf = parseHufInput(cost);
    if (Number.isNaN(amountHuf) || amountHuf < 1) throw userError(ONB.costInvalid);
    await dispatch({ type: Actions.SET_DAILY_COST, payload: { amountHuf, mode: 'all' } });
    onClose(true);
  });
  return (
    <Sheet title={ONB.costTitle} closeLabel={UX.close} onClose={() => onClose(false)}>
      <form className="stack" onSubmit={save.onSubmit}>
        <CostInput value={cost} onChange={setCost} />
        <button type="submit" className="btn btn-primary btn-big" disabled={!cost.trim() || save.busy}>{SETUP.save}</button>
      </form>
    </Sheet>
  );
}

function TriggerSheet({ onClose }) {
  const { dispatch } = useTimeline();
  const [list, setList] = useState([]);
  const save = useFormAction(async () => {
    await dispatch({ type: Actions.UPDATE_PROFILE, payload: { triggers: list } });
    onClose(true);
  });
  return (
    <Sheet title={ONB.triggersTitle} closeLabel={UX.close} onClose={() => onClose(false)}>
      <form className="stack" onSubmit={save.onSubmit}>
        <TriggerPicker selected={list} onToggle={(id) => setList((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))} />
        <button type="submit" className="btn btn-primary btn-big" disabled={list.length === 0 || save.busy}>{SETUP.save}</button>
      </form>
    </Sheet>
  );
}

export function SetupCard({ profile, savingsConfigured }) {
  const toast = useToast();
  const [open, setOpen] = useState(null);
  const [hidden, setHidden] = useState(() => hasSeen('setup-card'));
  const items = [
    { id: 'goal', label: SETUP.goal, icon: 'target', done: Boolean(profile.goalDays) },
    { id: 'cost', label: SETUP.cost, icon: 'savings', done: savingsConfigured },
    { id: 'triggers', label: SETUP.triggers, icon: 'wind', done: Boolean(profile.triggers?.length) },
  ];
  const doneCount = items.filter((i) => i.done).length;
  if (hidden || doneCount === items.length) return null;
  const close = (saved) => { setOpen(null); if (saved) { haptic(10); toast(T.saved_ok); } };
  return (
    <section className="card setup-card" aria-labelledby="setup-h">
      <div className="row-between">
        <h2 id="setup-h">{SETUP.title}</h2>
        <span className="pill">{SETUP.progress(doneCount, items.length)}</span>
      </div>
      <ul className="setup-list">
        {items.map((it) => (
          <li key={it.id}>
            <button type="button" className={`setup-item press${it.done ? ' done' : ''}`} disabled={it.done} onClick={() => setOpen(it.id)}>
              <span className="setup-icon"><Icon name={it.done ? 'check' : it.icon} size={20} /></span>
              <span className="setup-label">{it.label}</span>
              {!it.done && <Icon name="next" size={18} />}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn-link" onClick={() => { markSeen('setup-card'); setHidden(true); }}>{SETUP.notNow}</button>
      {open === 'goal' && <GoalSheet onClose={close} />}
      {open === 'cost' && <CostSheet onClose={close} />}
      {open === 'triggers' && <TriggerSheet onClose={close} />}
    </section>
  );
}
