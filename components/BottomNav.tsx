"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TABS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/home",
    label: "ホーム",
    icon: (
      <path
        d="M4 11.5 12 5l8 6.5M6 10v9h4v-5h4v5h4v-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/trend",
    label: "推移",
    icon: (
      <path
        d="M4 17 9 10l4 4 7-9M15 5h6v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/contributions",
    label: "積立",
    icon: (
      <path
        d="M4 6h16M4 12h16M4 18h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/simulate",
    label: "試算",
    icon: (
      <path
        d="M6 3h12v18H6zM8 7h8M8 11h2M12 11h2M16 11h2M8 15h2M12 15h2M16 15h2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/loan",
    label: "ローン",
    icon: (
      <path
        d="M3 10.5 12 4l9 6.5M4 21V11h16v10M9 21v-6h6v6M4 21h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/networth",
    label: "純資産",
    icon: (
      <path
        d="M4 12h16M8 12V7M12 12v5M16 12V9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 backdrop-blur"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map((tab) => {
          const active = pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] whitespace-nowrap"
              style={{ color: active ? "#E8B647" : "#78716c" }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24">
                {tab.icon}
              </svg>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
