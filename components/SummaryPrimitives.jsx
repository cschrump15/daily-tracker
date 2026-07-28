import { T } from "@/lib/theme";

export function fmtDelta(v, unit = "") {
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toLocaleString()}${unit}`;
}

export function SectionTitle({ children }) {
  return (
    <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 700, fontSize: "13px", color: T.accentSoft, letterSpacing: "1px", marginBottom: "8px" }}>
      {children}
    </div>
  );
}

export function SummaryCard({ children, onClick, style }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.card,
        border: `1px solid ${T.cardBorder}`,
        borderRadius: "16px",
        padding: "20px",
        marginBottom: "20px",
        textAlign: "center",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function BigStat({ label, value, color }) {
  return (
    <>
      <div style={{ fontSize: "11px", color: T.muted, fontWeight: 700, letterSpacing: "1px" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 800, fontSize: "56px", color, lineHeight: 1 }}>{value}</div>
    </>
  );
}

export function StatRow({ children }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "16px 14px", marginTop: "12px" }}>
      {children}
    </div>
  );
}

export function Stat({ label, value, sub, bad, color }) {
  const valueColor = color ?? (bad === undefined ? T.text : bad ? T.bad : T.good);
  return (
    <div style={{ minWidth: "68px" }}>
      <div style={{ fontSize: "9px", color: T.muted, fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 800, fontSize: "15px", color: valueColor }}>{value}</div>
      <div style={{ fontSize: "8.5px", color: T.muted }}>{sub}</div>
    </div>
  );
}

export function Divider({ label }) {
  return (
    <>
      <div style={{ height: "1px", background: T.cardBorder, margin: "16px 0 10px" }} />
      <div style={{ fontSize: "9.5px", color: T.muted, fontWeight: 700, letterSpacing: "0.5px" }}>{label}</div>
    </>
  );
}
