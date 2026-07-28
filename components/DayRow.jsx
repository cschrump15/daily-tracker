"use client";

import Link from "next/link";
import { Flame, Dumbbell, ChevronRight, Scale } from "lucide-react";
import { T } from "@/lib/theme";
import ScoreRing from "@/components/ScoreRing";

export default function DayRow({ day, isLast }) {
  return (
    <Link
      href={`/reports/${day.log_date}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "11px 14px",
        borderBottom: isLast ? "none" : `1px solid ${T.cardBorder}`,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <ScoreRing score={day.score} size={40} strokeWidth={3} fontSize={12} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 600 }}>
          {new Date(day.log_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>
        <div style={{ fontSize: "11px", color: T.muted, display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "2px" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <Flame size={11} color={T.accentSoft} /> {day.total_intake_calories?.toLocaleString() ?? 0} cal
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <Dumbbell size={11} color={day.had_workout ? T.good : "#3a4d4a"} />
            {day.had_workout ? "Trained" : "Rest"}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <Scale size={11} color={T.accentSoft} /> Net {day.net_calories?.toLocaleString() ?? 0}
          </span>
        </div>
      </div>
      <ChevronRight size={15} color={T.muted} />
    </Link>
  );
}
