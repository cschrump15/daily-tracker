import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { T } from "@/lib/theme";
import ScoreRing from "@/components/ScoreRing";
import BottomNav from "@/components/BottomNav";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

async function getScoresByMonth() {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("log_date, score")
    .order("log_date", { ascending: false });

  if (error) {
    console.error(error);
    return {};
  }

  const byMonth = {};
  for (const row of data ?? []) {
    const [year, month] = row.log_date.split("-").map(Number);
    const key = `${year}-${month - 1}`;
    if (!byMonth[key]) byMonth[key] = {};
    const day = Number(row.log_date.split("-")[2]);
    byMonth[key][day] = row.score !== null ? Number(row.score) : null;
  }
  return byMonth;
}

function buildMonthCells(year, monthIndex, scores) {
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startOffset = firstDay.getDay();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, score: scores?.[d] ?? null });
  }
  return cells;
}

function MonthGrid({ year, monthIndex, scores, compact }) {
  const cells = buildMonthCells(year, monthIndex, scores);
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const ringSize = compact ? 26 : 34;
  const ringStroke = compact ? 2.5 : 3;
  const ringFont = compact ? 7.5 : 9;

  return (
    <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "12px", padding: compact ? "10px" : "14px", marginBottom: "14px" }}>
      <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 700, fontSize: compact ? "13px" : "15px", color: T.text, marginBottom: "8px" }}>
        {MONTH_NAMES[monthIndex].toUpperCase()} {year}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "4px" }}>
        {dayLabels.map((l, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: "9.5px", color: T.muted, fontWeight: 700 }}>{l}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: compact ? "3px" : "5px" }}>
        {cells.map((c, i) =>
          c === null ? (
            <div key={i} style={{ height: `${ringSize + 13}px` }} />
          ) : (
            <CellLink key={i} year={year} monthIndex={monthIndex} day={c.day} score={c.score} ringSize={ringSize} ringStroke={ringStroke} ringFont={ringFont} compact={compact} />
          )
        )}
      </div>
    </div>
  );
}

function CellLink({ year, monthIndex, day, score, ringSize, ringStroke, ringFont, compact }) {
  const dateStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const content = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
      <div style={{ fontSize: compact ? "8px" : "9px", color: T.muted, fontWeight: 600, lineHeight: 1 }}>{day}</div>
      {score !== null ? (
        <ScoreRing score={score} size={ringSize} strokeWidth={ringStroke} fontSize={ringFont} />
      ) : (
        <div style={{ width: ringSize, height: ringSize, borderRadius: "50%", border: `${ringStroke}px solid ${T.cardBorder}` }} />
      )}
    </div>
  );

  if (score === null) return content;

  return (
    <Link href={`/reports/${dateStr}`} style={{ textDecoration: "none" }}>
      {content}
    </Link>
  );
}

export default async function CalendarPage() {
  const scoresByMonth = await getScoresByMonth();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const pastMonthsCount = 3;
  const pastMonths = Array.from({ length: pastMonthsCount }).map((_, i) => {
    const monthIndex = currentMonth - (i + 1);
    const year = monthIndex < 0 ? currentYear - 1 : currentYear;
    const normalizedMonth = monthIndex < 0 ? monthIndex + 12 : monthIndex;
    return { year, monthIndex: normalizedMonth };
  });

  return (
    <div style={{ fontFamily: "var(--font-barlow)", minHeight: "100vh", background: T.bg, color: T.text }}>
      <div style={{ height: "5px", background: T.accent }} />

      <div style={{ padding: "20px 20px 14px" }}>
        <h1 style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 800, fontSize: "26px", letterSpacing: "0.5px", margin: 0 }}>
          DAILY TRACKER
        </h1>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: T.muted, fontWeight: 500 }}>Monthly view</p>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 700, fontSize: "13px", color: T.accentSoft, letterSpacing: "0.5px" }}>
          CURRENT MONTH
        </div>
        <div style={{ marginTop: "8px" }}>
          <MonthGrid year={currentYear} monthIndex={currentMonth} scores={scoresByMonth[`${currentYear}-${currentMonth}`]} />
        </div>

        <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 700, fontSize: "13px", color: T.accentSoft, letterSpacing: "0.5px" }}>
          PAST MONTHS
        </div>
        <div style={{ marginTop: "8px" }}>
          {pastMonths.map(({ year, monthIndex }) => (
            <MonthGrid key={`${year}-${monthIndex}`} year={year} monthIndex={monthIndex} scores={scoresByMonth[`${year}-${monthIndex}`]} compact />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
