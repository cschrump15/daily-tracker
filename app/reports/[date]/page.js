import { notFound } from "next/navigation";
import { Utensils, Dumbbell, Bike, Zap, Wine } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { T } from "@/lib/theme";
import ScoreRing from "@/components/ScoreRing";
import BottomNav from "@/components/BottomNav";

export const dynamic = "force-dynamic";

function CatIcon({ category, size, color }) {
  if (category === "Cardio") return <Bike size={size} color={color} />;
  if (category === "Weightlifting") return <Dumbbell size={size} color={color} />;
  return <Zap size={size} color={color} />;
}

async function getDayData(date) {
  const { data: day, error: dayError } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("log_date", date)
    .single();

  if (dayError || !day) return null;

  const { data: meals } = await supabase
    .from("meals")
    .select("*")
    .eq("daily_log_id", day.id)
    .order("logged_at", { ascending: true });

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .eq("daily_log_id", day.id)
    .order("logged_at", { ascending: true });

  const { data: drinks } = await supabase
    .from("drinks")
    .select("*")
    .eq("daily_log_id", day.id)
    .order("logged_at", { ascending: true });

  return { day, meals: meals ?? [], exercises: exercises ?? [], drinks: drinks ?? [] };
}

export default async function DayDrilldownPage({ params }) {
  const { date } = await params;
  const result = await getDayData(date);
  if (!result) notFound();

  const { day, meals, exercises, drinks } = result;
  const totalWorkoutCal = exercises.reduce((s, e) => s + (e.calories_burned ?? 0), 0);
  const totalMealCal = meals.reduce((s, m) => s + (m.calories ?? 0), 0);
  const totalDrinks = drinks.reduce((s, dr) => s + Number(dr.standard_drinks ?? dr.quantity ?? 0), 0);
  const totalDrinkCal = drinks.reduce((s, dr) => s + (dr.calories ?? 0), 0);
  const dateLabel = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div style={{ fontFamily: "var(--font-barlow)", minHeight: "100vh", background: T.bg, color: T.text }}>
      <div style={{ height: "5px", background: T.accent }} />

      <div style={{ padding: "20px 20px 14px" }}>
        <h1 style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 800, fontSize: "26px", letterSpacing: "0.5px", margin: 0 }}>
          DAILY TRACKER
        </h1>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: T.muted, fontWeight: 500 }}>{dateLabel}</p>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ background: T.accent, borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", display: "flex", gap: "16px", alignItems: "center", color: "#06251f" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(6, 37, 31, 0.12)",
              borderRadius: "10px",
              padding: "10px 14px",
              minWidth: "84px",
            }}
          >
            <ScoreRing score={Number(day.score)} size={58} strokeWidth={5} fontSize={17} />
            <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 700, fontSize: "12.5px", lineHeight: 1.1, marginTop: "6px" }}>
              {day.net_calories?.toLocaleString()}
            </div>
            <div style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.5px", opacity: 0.75 }}>NET CAL</div>
          </div>
          <div style={{ fontSize: "12px", fontWeight: 700, lineHeight: 1.4 }}>
            {day.total_intake_calories?.toLocaleString()} cal vs. {day.calories_target?.toLocaleString()} target &middot;{" "}
            {totalWorkoutCal} cal burned across {exercises.length} workout {exercises.length === 1 ? "type" : "types"}
            {day.is_binge_day && (
              <>
                {" "}
                &middot;{" "}
                <span style={{ background: "rgba(6,37,31,0.18)", padding: "1px 6px", borderRadius: "6px" }}>
                  BINGE DAY
                </span>
              </>
            )}
          </div>
        </div>

        <SectionLabel>MEALS</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "8px 0 16px" }}>
          {meals.length === 0 && <EmptyNote text="No meals logged for this day." />}
          {meals.map((m) => (
            <div key={m.id} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "12px", padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: T.cardAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                  <Utensils size={14} color={T.accentSoft} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 700 }}>{m.meal_name}</div>
                    <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 800, fontSize: "13px", color: T.accentSoft }}>{m.calories} cal</div>
                  </div>
                  {m.description && (
                    <div style={{ fontSize: "11.5px", color: T.muted, marginTop: "2px", lineHeight: 1.4 }}>{m.description}</div>
                  )}
                  <div style={{ fontSize: "10.5px", color: T.muted, marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "3px 10px" }}>
                    <span>{m.protein}g protein</span>
                    <span>{m.fat}g fat</span>
                    <span>{m.saturated_fat}g sat fat</span>
                    <span>{m.carbs}g carb</span>
                    <span>{Number(m.sodium).toLocaleString()}mg sodium</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {meals.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "11px", color: T.muted, paddingRight: "4px" }}>
              Total: {totalMealCal.toLocaleString()} cal
            </div>
          )}
        </div>

        <SectionLabel>DRINKS</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "8px 0 16px" }}>
          {drinks.length === 0 && <EmptyNote text="No drinks logged for this day." />}
          {drinks.map((dr) => (
            <div key={dr.id} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "12px", padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: T.cardAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Wine size={14} color={T.accentSoft} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13.5px", fontWeight: 700 }}>
                    {dr.description}{dr.quantity > 1 ? ` \u00d7${dr.quantity}` : ""}
                  </div>
                  <div style={{ fontSize: "10.5px", color: T.muted, marginTop: "1px" }}>
                    {Number(dr.standard_drinks ?? 1).toFixed(2)} standard drink{Number(dr.standard_drinks) === 1 ? "" : "s"}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 800, fontSize: "13px", color: T.accentSoft }}>{dr.calories} cal</div>
              </div>
            </div>
          ))}
          {drinks.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", fontSize: "11px", color: T.muted, paddingRight: "4px" }}>
              <span>{totalDrinks.toFixed(2)} standard drinks</span>
              <span>&middot;</span>
              <span>{totalDrinkCal.toLocaleString()} cal</span>
            </div>
          )}
        </div>

        <SectionLabel>WORKOUT LOG (BY CATEGORY)</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "8px 0 16px" }}>
          {exercises.length === 0 && <EmptyNote text="No workouts logged for this day." />}
          {exercises.map((e) => (
            <div key={e.id} style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "12px", padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: T.cardAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CatIcon category={e.category} size={15} color={T.accentSoft} />
                </div>
                <div style={{ flex: 1, fontSize: "13.5px", fontWeight: 700 }}>{e.category}</div>
                <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 800, fontSize: "13px", color: T.accentSoft }}>{e.calories_burned} cal</div>
              </div>
              {Array.isArray(e.movements) &&
                e.movements.map((mv, idx) => (
                  <div key={idx} style={{ fontSize: "11.5px", color: T.muted, paddingLeft: "40px", marginTop: "2px" }}>
                    {mv.name}{mv.detail ? ` \u2014 ${mv.detail}` : ""}
                  </div>
                ))}
              {e.notes && (
                <div style={{ fontSize: "11px", color: T.muted, paddingLeft: "40px", marginTop: "4px", fontStyle: "italic" }}>{e.notes}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 700, fontSize: "13px", color: T.accentSoft, letterSpacing: "0.5px" }}>
      {children}
    </div>
  );
}

function EmptyNote({ text }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: "12px", padding: "14px", fontSize: "11.5px", color: T.muted, textAlign: "center" }}>
      {text}
    </div>
  );
}
