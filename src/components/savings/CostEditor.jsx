// Daily cost editor. "From now on" and "correct everything" are different intents
// and are named plainly; see domain/savings.js updateCostHistory.

import { useState } from 'react';
import { T } from '../../content/hu.js';
import { formatHuf, parseHufInput } from '../../domain/savings.js';
import { Actions } from '../../domain/timelineReducer.js';
import { formatDateHu, toDateKey } from '../../domain/dates.js';
import { MAX_GOAL } from '../../domain/schema.js';
import { userError } from '../../lib/errors.js';
import { useTimeline } from '../../hooks/useTimeline.js';
import { useFormAction } from '../../hooks/useFormAction.js';
import { useToast } from '../../hooks/useToast.jsx';
import { Field } from '../ui.jsx';

export function CostEditor() {
  const { snapshot, dispatch } = useTimeline();
  const toast = useToast();
  const [mode, setMode] = useState('from');
  const today = toDateKey();
  const { savings, data } = snapshot;

  const { onSubmit, busy } = useFormAction(async (fd, form) => {
    const amountHuf = parseHufInput(fd.get('amount'));
    if (Number.isNaN(amountHuf)) throw userError('A napi költség 0 és 1 000 000 Ft közötti szám legyen.');
    await dispatch({ type: Actions.SET_DAILY_COST, payload: { amountHuf, mode, from: fd.get('from') || today } });
    toast(mode === 'all' ? T.costSavedAll : T.costSavedFrom);
    form.reset();
    setMode('from');
  });

  return (
    <div className="stack">
      <form className="stack" onSubmit={onSubmit} aria-busy={busy || undefined}>
        <p>{T.costNow(formatHuf(savings.daily))}</p>
        <Field label={T.costNewLabel} hint={T.dailyCostHint}>
          <input type="text" name="amount" className="input" inputMode="numeric" autoComplete="off" required placeholder="pl. 2500" />
        </Field>
        <fieldset className="chips">
          <legend>{T.costModeLegend}</legend>
          <label className="check"><input type="radio" name="mode" value="from" checked={mode === 'from'} onChange={() => setMode('from')} /><span>{T.costModeFrom}</span></label>
          <label className="check"><input type="radio" name="mode" value="all" checked={mode === 'all'} onChange={() => setMode('all')} /><span>{T.costModeAll}</span></label>
        </fieldset>
        {mode === 'from' && (
          <Field label={T.costFromLabel}>
            <input type="date" name="from" className="input" defaultValue={today} max={today} min={data.profile.journeyStart} />
          </Field>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>{T.costSave}</button>
      </form>
      {savings.history.length > 1 && (
        <details>
          <summary>{T.costHistoryTitle}</summary>
          <ul className="cost-history">
            {savings.history.map((e) => <li key={e.from}>{T.costHistoryRow(formatDateHu(e.from), formatHuf(e.dailyCostHuf))}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}

export function GoalEditor() {
  const { snapshot, dispatch } = useTimeline();
  const toast = useToast();
  const goal = snapshot.data.settings.savingsGoal;
  const { onSubmit, busy } = useFormAction(async (fd) => {
    const amountHuf = parseHufInput(fd.get('amount'), MAX_GOAL);
    if (Number.isNaN(amountHuf) || amountHuf < 1) throw userError('Adj meg egy pozitív összeget forintban.');
    await dispatch({ type: Actions.SET_SAVINGS_GOAL, payload: { goal: { label: fd.get('label'), amountHuf } } });
    toast(T.saved_ok);
  });
  const clear = async () => {
    await dispatch({ type: Actions.SET_SAVINGS_GOAL, payload: { goal: null } });
    toast(T.saved_ok);
  };
  return (
    <details open={Boolean(goal)}>
      <summary>{T.goalTitle}</summary>
      <form className="stack" onSubmit={onSubmit} aria-busy={busy || undefined} key={goal ? `${goal.label}|${goal.amountHuf}` : 'none'}>
        <Field label={T.goalLabelLabel}>
          <input type="text" name="label" className="input" maxLength={60} defaultValue={goal?.label ?? ''} placeholder="pl. új bicikli" required />
        </Field>
        <Field label={T.goalAmountLabel}>
          <input type="text" name="amount" className="input" inputMode="numeric" defaultValue={goal ? String(goal.amountHuf) : ''} required />
        </Field>
        <div className="actions">
          <button type="submit" className="btn" disabled={busy}>{T.goalSave}</button>
          {goal && <button type="button" className="btn btn-ghost" onClick={clear}>{T.goalClear}</button>}
        </div>
      </form>
    </details>
  );
}
