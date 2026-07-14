import { db, genId } from "./db";
import type { Theme } from "./db";

// Pre-defined premium colors (HSL format compatible with shadcn)
export const PRESET_THEMES = [
  { name: "Emerald", colors: { primary: "142.1 76.2% 36.3%", "primary-foreground": "355.7 100% 97.3%" } },
  { name: "Violet", colors: { primary: "262.1 83.3% 57.8%", "primary-foreground": "210 40% 98%" } },
  { name: "Rose", colors: { primary: "346.8 77.2% 49.8%", "primary-foreground": "355.7 100% 97.3%" } },
  { name: "Amber", colors: { primary: "37.7 92.1% 50.2%", "primary-foreground": "210 40% 98%" } },
  { name: "Blue", colors: { primary: "221.2 83.2% 53.3%", "primary-foreground": "210 40% 98%" } }
];

export async function checkAndUnlockThemes(oldLevel: number, newLevel: number) {
  const oldMilestone = Math.floor(oldLevel / 5);
  const newMilestone = Math.floor(newLevel / 5);
  
  if (newMilestone > oldMilestone) {
    for (let i = oldMilestone + 1; i <= newMilestone; i++) {
      const presetIndex = (i - 1) % PRESET_THEMES.length;
      const preset = PRESET_THEMES[presetIndex];
      await db.themes.add({
        id: genId(),
        name: `${preset.name} Theme (Lv ${i * 5})`,
        colors: preset.colors,
        unlockedAtLevel: i * 5,
        createdAt: new Date().toISOString()
      });
    }
  }
}

export async function getUnlockedThemes(): Promise<Theme[]> {
  return await db.themes.orderBy("unlockedAtLevel").toArray();
}

export async function updateTheme(themeId: string, name: string, colors: Record<string, string>): Promise<void> {
  await db.themes.update(themeId, { name, colors });
}
