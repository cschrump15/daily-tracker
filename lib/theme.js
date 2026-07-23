// Midnight Teal theme — shared across the app
export const T = {
  bg: "#0d1817",
  card: "#132422",
  cardBorder: "#1d3532",
  cardAlt: "#1a2f2c",
  accent: "#2dd4bf",
  accentSoft: "#5eead4",
  text: "#ffffff",
  muted: "#7fa19c",
  good: "#4ade80",
  bad: "#f87171",
};

// score 0-10 -> color: red, orange, yellow, light green, dark green (pronounced steps)
export function scoreColor(score) {
  const stops = [
    { s: 0, c: [239, 68, 68] },     // red
    { s: 2.5, c: [249, 115, 22] },  // orange
    { s: 5, c: [250, 204, 21] },    // yellow
    { s: 7.5, c: [163, 230, 53] },  // light green
    { s: 10, c: [21, 128, 61] },    // dark green
  ];
  const clamped = Math.max(0, Math.min(10, score ?? 0));
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i].s && clamped <= stops[i + 1].s) {
      lo = stops[i]; hi = stops[i + 1]; break;
    }
  }
  const span = hi.s - lo.s;
  const f = span === 0 ? 0 : (clamped - lo.s) / span;
  const rgb = lo.c.map((v, i) => Math.round(v + (hi.c[i] - v) * f));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
