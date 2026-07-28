"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { T, scoreColor } from "@/lib/theme";
import { StatRow, Stat, fmtDelta } from "@/components/SummaryPrimitives";
import DayRow from "@/components/DayRow";
import ScoreRing from "@/components/ScoreRing";

export default function WeeklyBreakdown({ weeks }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (weeks.length === 0) {
    return (
      <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "12px", padding: "20px", textAlign: "center", fontSize: "12px", color: T.muted }}>
        No days logged yet.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {weeks.map((week) => {
        const isOpen = !!expanded[week.key];
        return (
          <div key={week.key} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "12px", overflow: "hidden" }}>
            <div
              onClick={() => toggle(week.key)}
              style={{ padding: "14px", cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <ScoreRing score={week.stats.avgScore} size={34} strokeWidth={3} fontSize={10.5} />
                  <div>
                    <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 700, fontSize: "13px", color: T.text, letterSpacing: "0.5px" }}>
                      {week.label}
                    </div>
                    <div style={{ fontSize: "9.5px", color: T.muted, marginTop: "1px" }}>
                      {week.days.length} day{week.days.length === 1 ? "" : "s"} logged &middot; avg score
                    </div>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={16} color={T.muted} /> : <ChevronDown size={16} color={T.muted} />}
              </div>

              <StatRow>
                <Stat label="TOTAL CAL" value={week.stats.totalIntake.toLocaleString()} sub="intake, week sum" color={T.accentSoft} />
                <Stat label="WORKOUTS" value={`${week.stats.workouts}/${week.days.length}`} sub="days" color={T.accentSoft} />
                <Stat label="CAL BURNED" value={week.stats.calBurned.toLocaleString()} sub="week sum" color={T.accentSoft} />
                <Stat label="NET CAL" value={week.stats.totalNet.toLocaleString()} sub="week sum" color={T.text} />
              </StatRow>
              <StatRow>
                <Stat label="VS 1,700" value={fmtDelta(week.stats.calVsTarget)} sub="week sum" bad={week.stats.calVsTarget > 0} />
                <Stat label="VS 2,100" value={fmtDelta(week.stats.calVsMaintenance)} sub="week sum" bad={week.stats.calVsMaintenance > 0} />
                <Stat label="DRINKS" value={`${week.stats.totalDrinks.toFixed(1)}/${week.stats.drinksTarget}`} sub="standard" bad={week.stats.totalDrinks > week.stats.drinksTarget} />
                <Stat label="BINGE DAYS" value={`${week.stats.bingeDays}/${week.days.length}`} sub="this week" bad={week.stats.bingeDays > 0} />
              </StatRow>
            </div>

            {isOpen && (
              <div style={{ borderTop: `1px solid ${T.cardBorder}` }}>
                {week.days.map((day, i) => (
                  <DayRow key={day.id} day={day} isLast={i === week.days.length - 1} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
