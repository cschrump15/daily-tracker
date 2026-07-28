import { supabase } from "@/lib/supabase";
import { T } from "@/lib/theme";
import BottomNav from "@/components/BottomNav";
import DayRow from "@/components/DayRow";

export const dynamic = "force-dynamic";

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
            <DayRow key={d.id} day={d} isLast={i === days.length - 1} />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
