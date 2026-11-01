// Mérföldkövek (jelvények) és célhaladás. A józan napok összes számából dolgozik (sosem csökken egy megcsúszástól),
// így egy megcsúszás után sem tűnnek el az elért jelvények.

export const MILESTONE_DAYS = [1, 3, 7, 14, 30, 90, 180, 365];

/** Standard goals offered at onboarding; "custom" is any 1–3650. */
export const GOAL_OPTIONS = [7, 30, 90, 365];
const GOAL_LADDER = [7, 14, 30, 60, 90, 180, 365, 730, 1095];

/** All badges with their state, the next one and how many days are left to it. */
export function milestoneStatus(totalDays, days = MILESTONE_DAYS) {
  const badges = days.map((d) => ({ days: d, achieved: totalDays >= d }));
  const achieved = badges.filter((b) => b.achieved);
  const next = badges.find((b) => !b.achieved) ?? null;
  return {
    badges,
    latest: achieved.at(-1)?.days ?? null,
    next: next?.days ?? null,
    remaining: next ? next.days - totalDays : 0,
    progressToNext: next ? (totalDays - (achieved.at(-1)?.days ?? 0)) / (next.days - (achieved.at(-1)?.days ?? 0)) : 1,
  };
}

/**
 * The highest milestone reached that has not been celebrated yet (celebrated = highest one
 * already shown), or null. Nothing is celebrated twice, and earlier ones are not replayed.
 */
export function uncelebratedMilestone(totalDays, lastCelebrated = 0, days = MILESTONE_DAYS) {
  const reached = days.filter((d) => totalDays >= d && d > lastCelebrated);
  return reached.length ? reached.at(-1) : null;
}

/** "12 / 30 nap": progress to the personal goal, plus a suggestion once it is reached. */
export function goalProgress(totalDays, goalDays) {
  if (!goalDays) return null;
  const reached = totalDays >= goalDays;
  return {
    total: totalDays,
    goal: goalDays,
    shown: Math.min(totalDays, goalDays),
    ratio: Math.min(1, totalDays / goalDays),
    remaining: Math.max(0, goalDays - totalDays),
    reached,
    nextSuggestion: reached ? (GOAL_LADDER.find((g) => g > totalDays) ?? totalDays + 365) : null,
  };
}
