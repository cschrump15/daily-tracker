// Daily score: Calories (0-8) + Protein (0-2) = 0-10. Sodium is informational only.

// Piecewise calorie score. Breakpoints defined by Chris; capped at 8.0 for <=1500 net cal.
const CALORIE_BREAKPOINTS = [
  { cal: 1500, score: 8.0 },
  { cal: 1700, score: 7.0 },
  { cal: 1900, score: 6.0 },
  { cal: 2100, score: 5.0 },
  { cal: 2200, score: 4.0 },
  { cal: 2300, score: 3.0 },
  { cal: 2400, score: 2.0 },
  { cal: 2500, score: 1.0 },
  { cal: 2600, score: 0.5 },
  { cal: 2700, score: 0.0 },
];

export function calorieScore(netCalories) {
  if (netCalories <= CALORIE_BREAKPOINTS[0].cal) return CALORIE_BREAKPOINTS[0].score;
  if (netCalories >= CALORIE_BREAKPOINTS[CALORIE_BREAKPOINTS.length - 1].cal) return 0;

  for (let i = 0; i < CALORIE_BREAKPOINTS.length - 1; i++) {
    const a = CALORIE_BREAKPOINTS[i];
    const b = CALORIE_BREAKPOINTS[i + 1];
    if (netCalories >= a.cal && netCalories <= b.cal) {
      const f = (netCalories - a.cal) / (b.cal - a.cal);
      return a.score - f * (a.score - b.score);
    }
  }
  return 0;
}

// Protein score (max 2.0), target defaults to 150g.
// Two segments: linear-from-zero up to 50% of target, then original 2x-0.5 formula to 100%+.
export function proteinScore(protein, target = 150) {
  const r = protein / target;
  let score;
  if (r < 0.5) {
    score = (4 / 3) * r;
  } else {
    score = (8 / 3) * r - 2 / 3;
  }
  return Math.max(0, Math.min(2, score));
}

export function dailyScore({ netCalories, protein, proteinTarget = 150 }) {
  const cal = calorieScore(netCalories);
  const pro = proteinScore(protein, proteinTarget);
  return Math.round((cal + pro) * 100) / 100;
}
