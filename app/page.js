import Link from "next/link";
import { Flame, Dumbbell, ChevronRight, Scale } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { T, scoreColor } from "@/lib/theme";
import ScoreRing from "@/components/ScoreRing";
import BottomNav from "@/components/BottomNav";

export const dynamic = "force-dynamic";

const MAINTENANCE_CALORIES = 2100;

async function getAllDays() {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .order("log_date", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

async function getLastTenDays() {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .order("log_date", { ascending: false })
    .limit(10);

  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

function getCurrentWeekRange() {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d) => d.toISOString().split("T")[0];
  return { start: fmt(monday), end: fmt(sunday) };
}

async function getCurrentWeekDays() {
  const { start, end } = getCurrentWeekRange();
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .gte("log_date", start)
    .lte("log_date", end);

  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

// Aggregates a set of daily_logs rows into the stats needed for a summary card.
// workoutDenom/bingeDenom let the weekly card use "days elapsed" instead of total row count.
function aggregate(days, { workoutDenom, bingeDenom } = {}) {
  const n = days.length || 1;
  const avgScore = days.reduce((s, d) => s + Number(d.score ?? 0), 0) / n;

  const calVsTarget = days.reduce((s, d) => s + (d.net_calories - d.calories_target), 0);
  const calVsMaintenance = days.reduce((s, d) => s + (d.net_calories - MAINTENANCE_CALORIES), 0);
  const calBurned = days.reduce((s, d) => s + (d.total_burned_calories ?? 0), 0);
  const workouts = days.filter((d) => d.had_workout).length;

  const avgSodium = days.reduce((s, d) => s + Number(d.total_sodium ?? 0), 0) / n;
  const avgFat = days.reduce((s, d) => s + Number(d.total_fat ?? 0), 0) / n;
  const avgCarb = days.reduce((s, d) => s + Number(d.total_carbs ?? 0), 0) / n;

  const sodiumTarget = days[0]?.sodium_target ?? 2300;
  const fatTarget = days[0]?.fat_target ?? 50;
  const carbTarget = days[0]?.carb_target ?? 160;

  const bingeDays = days.filter((d) => d.is_binge_day).length;
  const avgDrinkingCal = Math.round(days.reduce((s, d) => s + (d.drinking_calories ?? 0), 0) / n);

  return {
    avgScore,
    calVsTarget: Math.round(calVsTarget),
    calVsMaintenance: Math.round(calVsMaintenance),
    calBurned: Math.round(calBurned),
    workouts,
    workoutDenom: workoutDenom ?? days.length,
    sodiumDiff: Math.round(avgSodium - sodiumTarget),
    fatDiff: Math.round(avgFat - fatTarget),
    carbDiff: Math.round(avgCarb - carbTarget),
    bingeDays,
    bingeDenom: bingeDenom ?? days.length,
    avgDrinkingCal,
    days: days.length,
  };
}

export default async function HomePage() {
  const [allDays, weekDays, recentDays] = await Promise.all([
    getAllDays(),
    getCurrentWeekDays(),
    getLastTenDays(),
  ]);

  const allTime = aggregate(allDays);
  const week = aggregate(weekDays, { workoutDenom: weekDays.length, bingeDenom: weekDays.length });

  return (
    <div style={{ fontFamily: "var(--font-barlow)", minHeight: "100vh", background: T.bg, color: T.text }}>
      <div style={{ height: "5px", background: T.accent }} />

      <div style={{ padding: "20px 20px 14px" }}>
        <h1 style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 800, fontSize: "26px", letterSpacing: "0.5px", margin: 0 }}>
          DAILY TRACKER
        </h1>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: T.muted, fontWeight: 500 }}>
          {allDays.length} days logged
        </p>
      </div>

      <div style={{ padding: "0 16px" }}>
        <SectionTitle>ALL-TIME</SectionTitle>
        <SummaryCard>
          <BigStat label="ALL-TIME AVERAGE SCORE" value={allDays.length ? allTime.avgScore.toFixed(1) : "\u2014"} color={scoreColor(allTime.avgScore)} />

          <StatRow>
            <Stat label="CALORIES" value={fmtDelta(allTime.calVsTarget)} sub="vs. 1,700/day target" bad={allTime.calVsTarget > 0} />
            <Stat label="VS MAINTENANCE" value={fmtDelta(allTime.calVsMaintenance)} sub={`vs. ${MAINTENANCE_CALORIES.toLocaleString()}/day`} bad={allTime.calVsMaintenance > 0} />
            <Stat label="CAL BURNED" value={allTime.calBurned.toLocaleString()} sub="all-time sum" color={T.accentSoft} />
            <Stat label="WORKOUTS" value={`${allTime.workouts}/${allTime.workoutDenom}`} sub="days trained" color={T.accentSoft} />
          </StatRow>

          <Divider label="INFORMATIONAL \u2014 NOT SCORED" />
          <StatRow>
            <Stat label="SODIUM" value={fmtDelta(allTime.sodiumDiff, "mg")} sub="avg/day vs target" bad={allTime.sodiumDiff > 0} />
            <Stat label="FAT" value={fmtDelta(allTime.fatDiff, "g")} sub="avg/day vs target" bad={allTime.fatDiff > 0} />
            <Stat label="CARBS" value={fmtDelta(allTime.carbDiff, "g")} sub="avg/day vs target" bad={allTime.carbDiff > 0} />
          </StatRow>

          <Divider label="DRINKING" />
          <StatRow>
            <Stat label="DRINK CAL" value={`${allTime.avgDrinkingCal.toLocaleString()}/day`} sub="all-time avg" bad={allTime.avgDrinkingCal > 150} />
            <Stat label="BINGE DAYS" value={`${allTime.bingeDays}/${allTime.bingeDenom}`} sub="all-time" bad={allTime.bingeDays > 0} />
          </StatRow>
        </SummaryCard>

        <SectionTitle>THIS WEEK (MON\u2013SUN)</SectionTitle>
        <SummaryCard>
          <BigStat label="WEEKLY AVERAGE SCORE" value={weekDays.length ? week.avgScore.toFixed(1) : "\u2014"} color={scoreColor(week.avgScore)} />

          <StatRow>
            <Stat label="CALORIES" value={fmtDelta(week.calVsTarget)} sub="vs. 1,700/day target" bad={week.calVsTarget > 0} />
            <Stat label="VS MAINTENANCE" value={fmtDelta(week.calVsMaintenance)} sub={`vs. ${MAINTENANCE_CALORIES.toLocaleString()}/day`} bad={week.calVsMaintenance > 0} />
            <Stat label="CAL BURNED" value={week.calBurned.toLocaleString()} sub="this week" color={T.accentSoft} />
            <Stat label="WORKOUTS" value={`${week.workouts}/${week.workoutDenom}`} sub="days elapsed" color={T.accentSoft} />
          </StatRow>

          <Divider label="INFORMATIONAL \u2014 NOT SCORED" />
          <StatRow>
            <Stat label="SODIUM" value={fmtDelta(week.sodiumDiff, "mg")} sub="avg/day vs target" bad={week.sodiumDiff > 0} />
            <Stat label="FAT" value={fmtDelta(week.fatDiff, "g")} sub="avg/day vs target" bad={week.fatDiff > 0} />
            <Stat label="CARBS" value={fmtDelta(week.carbDiff, "g")} sub="avg/day vs target" bad={week.carbDiff > 0} />
          </StatRow>

          <Divider label="DRINKING" />
          <StatRow>
            <Stat label="DRINK CAL" value={`${week.avgDrinkingCal.toLocaleString()}/day`} sub="week avg" bad={week.avgDrinkingCal > 150} />
            <Stat label="BINGE DAYS" value={`${week.bingeDays}/${week.bingeDenom}`} sub="days elapsed" bad={week.bingeDays > 0} />
          </StatRow>
        </SummaryCard>

        <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 700, fontSize: "13px", color: T.accentSoft, letterSpacing: "0.5px", marginTop: "18px" }}>
          LAST {recentDays.length} DAYS
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "12px", overflow: "hidden", marginTop: "8px" }}>
          {recentDays.length === 0 && (
            <div style={{ padding: "20px", fontSize: "12px", color: T.muted, textAlign: "center" }}>
              No days logged yet.
            </div>
          )}
          {recentDays.map((d, i) => (
            <Link
              key={d.id}
              href={`/reports/${d.log_date}`}
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderBottom: i < recentDays.length - 1 ? `1px solid ${T.cardBorder}` : "none", textDecoration: "none", color: "inherit" }}
            >
              <ScoreRing score={d.score} size={40} strokeWidth={3} fontSize={12} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>
                  {new Date(d.log_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </div>
                <div style={{ fontSize: "11px", color: T.muted, display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "2px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <Flame size={11} color={T.accentSoft} /> {d.total_intake_calories?.toLocaleString() ?? 0} cal
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <Dumbbell size={11} color={d.had_workout ? T.good : "#3a4d4a"} />
                    {d.had_workout ? "Trained" : "Rest"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <Scale size={11} color={T.accentSoft} /> Net {d.net_calories?.toLocaleString() ?? 0}
                  </span>
                </div>
              </div>
              <ChevronRight size={15} color={T.muted} />
            </Link>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function fmtDelta(v, unit = "") {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toLocaleString()}${unit}`;
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 700, fontSize: "13px", color: T.accentSoft, letterSpacing: "1px", marginBottom: "8px" }}>
      {children}
    </div>
  );
}

function SummaryCard({ children }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "16px", padding: "20px", marginBottom: "20px", textAlign: "center" }}>
      {children}
    </div>
  );
}

function BigStat({ label, value, color }) {
  return (
    <>
      <div style={{ fontSize: "11px", color: T.muted, fontWeight: 700, letterSpacing: "1px" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 800, fontSize: "56px", color, lineHeight: 1 }}>{value}</div>
    </>
  );
}

function StatRow({ children }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "16px 14px", marginTop: "12px" }}>
      {children}
    </div>
  );
}

function Stat({ label, value, sub, bad, color }) {
  const valueColor = color ?? (bad === undefined ? T.text : bad ? T.bad : T.good);
  return (
    <div style={{ minWidth: "68px" }}>
      <div style={{ fontSize: "9px", color: T.muted, fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 800, fontSize: "15px", color: valueColor }}>{value}</div>
      <div style={{ fontSize: "8.5px", color: T.muted }}>{sub}</div>
    </div>
  );
}

function Divider({ label }) {
  return (
    <>
      <div style={{ height: "1px", background: T.cardBorder, margin: "16px 0 10px" }} />
      <div style={{ fontSize: "9.5px", color: T.muted, fontWeight: 700, letterSpacing: "0.5px" }}>{label}</div>
    </>
  );
}
