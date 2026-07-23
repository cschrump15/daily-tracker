import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { T } from "@/lib/theme";
import ScoreRing from "@/components/ScoreRing";
import BottomNav from "@/components/BottomNav";

export const dynamic = "force-dynamic";

async function getAllDays() {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .order("log_date", { ascending: false })
    .limit(60);

  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

export default async function ReportsPage() {
  const days = await getAllDays();

  return (
    <div style={{ fontFamily: "var(--font-barlow)", minHeight: "100vh", background: T.bg, color: T.text }}>
      <div style={{ height: "5px", background: T.accent }} />

      <div style={{ padding: "20px 20px 14px" }}>
        <h1 style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 800, fontSize: "26px", letterSpacing: "0.5px", margin: 0 }}>
          DAILY TRACKER
        </h1>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: T.muted, fontWeight: 500 }}>
          Full daily breakdowns
        </p>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 700, fontSize: "13px", color: T.accentSoft, letterSpacing: "0.5px", marginBottom: "8px" }}>
          DAILY REPORTS
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "12px", overflow: "hidden" }}>
          {days.length === 0 && (
            <div style={{ padding: "20px", fontSize: "12px", color: T.muted, textAlign: "center" }}>
              No days logged yet.
            </div>
          )}
          {days.map((d, i) => (
            <Link
              key={d.id}
              href={`/reports/${d.log_date}`}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderBottom: i < days.length - 1 ? `1px solid ${T.cardBorder}` : "none", textDecoration: "none", color: "inherit" }}
            >
              <ScoreRing score={d.score} size={34} strokeWidth={3} fontSize={10.5} />
              <div style={{ fontSize: "13px", fontWeight: 600, flex: 1 }}>
                {new Date(d.log_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
              <div style={{ fontSize: "11.5px", color: T.muted }}>{d.total_intake_calories?.toLocaleString() ?? 0} cal</div>
              <ChevronRight size={14} color={T.muted} />
            </Link>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
