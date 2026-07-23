"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home as HomeIcon, FileText, Calendar as CalendarIcon } from "lucide-react";
import { T } from "@/lib/theme";

const TABS = [
  { href: "/", label: "HOME", icon: HomeIcon },
  { href: "/reports", label: "REPORTS", icon: FileText },
  { href: "/calendar", label: "CALENDAR", icon: CalendarIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: T.card,
        borderTop: `1px solid ${T.cardBorder}`,
        display: "flex",
        justifyContent: "space-around",
        padding: "10px 0 max(10px, env(safe-area-inset-bottom))",
        zIndex: 50,
      }}
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              color: active ? T.accentSoft : T.muted,
              fontFamily: "var(--font-barlow-condensed)",
              fontWeight: 700,
              fontSize: "10px",
              letterSpacing: "0.5px",
              padding: "4px 18px",
              textDecoration: "none",
            }}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
