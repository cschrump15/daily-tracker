import { supabase } from "@/lib/supabase";
import { T, scoreColor } from "@/lib/theme";
import BottomNav from "@/components/BottomNav";
import WeeklyBreakdown from "@/components/WeeklyBreakdown";
import { SectionTitle, SummaryCard, BigStat, StatRow, Stat, Divider, fmtDelta } from "@/components/SummaryPrimitives";

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

function getWeekRange(weeksAgo = 0) {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday - weeksAgo * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d) => d.toISOString().split("T")[0];
  return { start: fmt(monday), end: fmt(sunday) };
}

// Shows the current Mon-Sun week once it has at least one logged day; until then,
// keeps showing the most recent week that does (so the card doesn't go blank the
// moment the calendar flips to a new week with nothing logged yet).
function getActiveWeek(allDaysByDate) {
  for (let weeksAgo = 0; weeksAgo < 6; weeksAgo++) {
    const { start, end } = getWeekRange(weeksAgo);
    const days = allDaysByDate.filter((d) => d.log_date >= start && d.log_date <= end);
    if (days.length > 0) {
      return { days, start, end };
    }
  }
  const { start, end } = getWeekRange(0);
  return { days: [], start, end };
}

// Aggregates a set of daily_logs rows into the stats needed for a summary card.
// workoutDenom/bingeDenom let the weekly card use "days elapsed" instead of total row count.
function aggregate(days, { workoutDenom, bingeDenom } = {}) {
  const n = days.length || 1;
  const avgScore = days.reduce((s, d) => s + Number(d.score ?? 0), 0) / n;

  const totalIntake = days.reduce((s, d) => s + (d.total_intake_calories ?? 0), 0);
  const totalNet = days.reduce((s, d) => s + (d.net_calories ?? 0), 0);
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
  const totalDrinks = days.reduce((s, d) => s + Number(d.drinks_count ?? 0), 0);
  const drinksTarget = days[0]?.drinks_weekly_target ?? 14;

  return {
    avgScore,
    totalIntake: Math.round(totalIntake),
    totalNet: Math.round(totalNet),
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
    totalDrinks: Math.round(totalDrinks * 100) / 100,
    drinksTarget,
    days: days.length,
  };
}

function formatWeekLabel(start, end) {
  const opts = { month: "short", day: "numeric" };
  const startLabel = new Date(start + "T00:00:00").toLocaleDateString("en-US", opts);
  const endLabel = new Date(end + "T00:00:00").toLocaleDateString("en-US", opts);
  return `${startLabel.toUpperCase()} \u2013 ${endLabel.toUpperCase()}`;
}

// Groups all days into Mon-Sun weeks, most recent week first, skipping any
// week with zero logged days.
function groupIntoWeeks(allDays) {
  if (allDays.length === 0) return [];

  const oldestDate = allDays[allDays.length - 1].log_date;
  const weeksSinceOldest = Math.ceil(
    (new Date() - new Date(oldestDate + "T00:00:00")) / (7 * 24 * 60 * 60 * 1000)
  ) + 1;

  const weeks = [];
  for (let weeksAgo = 0; weeksAgo < weeksSinceOldest; weeksAgo++) {
    const { start, end } = getWeekRange(weeksAgo);
    const days = allDays.filter((d) => d.log_date >= start && d.log_date <= end);
    if (days.length === 0) continue;
    weeks.push({
      key: start,
      label: formatWeekLabel(start, end),
      start,
      end,
      days, // already sorted desc since allDays is desc
      stats: aggregate(days),
    });
  }
  return weeks;
}

export default async function HomePage() {
  const allDays = await getAllDays();
  const activeWeek = getActiveWeek(allDays);
  const weekDays = activeWeek.days;

  const allTime = aggregate(allDays);
  const week = aggregate(weekDays, { workoutDenom: weekDays.length, bingeDenom: weekDays.length });
  const weekLabel = formatWeekLabel(activeWeek.start, activeWeek.end);
  const weeks = groupIntoWeeks(allDays);

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

        <SectionTitle>WEEK OF {weekLabel}</SectionTitle>
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
            <Stat label="STD DRINKS" value={`${week.totalDrinks.toFixed(1)}/${week.drinksTarget}`} sub="this week" bad={week.totalDrinks > week.drinksTarget} />
            <Stat label="BINGE DAYS" value={`${week.bingeDays}/${week.bingeDenom}`} sub="days elapsed" bad={week.bingeDays > 0} />
          </StatRow>
        </SummaryCard>

        <div style={{ marginTop: "18px", marginBottom: "8px" }}>
          <SectionTitle>ALL DAYS, BY WEEK</SectionTitle>
        </div>
        <WeeklyBreakdown weeks={weeks} />
      </div>

      <BottomNav />
    </div>
  );
}
