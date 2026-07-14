"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const activeThemeId = useLiveQuery(async () => {
    const settings = await db.settings.get("singleton");
    return settings?.activeThemeId;
  });

  const activeTheme = useLiveQuery(async () => {
    if (!activeThemeId) return null;
    return await db.themes.get(activeThemeId);
  }, [activeThemeId]);

  React.useEffect(() => {
    const root = document.documentElement;
    if (activeTheme) {
      Object.entries(activeTheme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
      });
    } else {
      // Revert to default
      root.style.removeProperty("--primary");
      root.style.removeProperty("--primary-foreground");
    }
  }, [activeTheme]);

  return <>{children}</>;
}
