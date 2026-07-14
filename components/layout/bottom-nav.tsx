"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  ScrollTextIcon,
  GiftIcon,
  HistoryIcon,
  SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/quests",    label: "Quest",     icon: ScrollTextIcon },
  { href: "/rewards",   label: "Reward",    icon: GiftIcon },
  { href: "/history",   label: "Riwayat",   icon: HistoryIcon },
  { href: "/settings",  label: "Pengaturan",icon: SettingsIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className={cn(
        "fixed bottom-0 inset-x-0 z-50",
        "border-t border-border/60 bg-background/80 backdrop-blur-md",
        "safe-area-pb" // handles iOS notch / home indicator
      )}
    >
      <ul className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "size-5 transition-transform",
                    isActive && "scale-110"
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none",
                    isActive && "font-semibold"
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
