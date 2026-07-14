import { describe, it, expect, beforeEach } from "vitest";
import { db, getSettings } from "@/lib/db";
import { completeQuest, failQuest } from "@/lib/momentum";

describe("Momentum Logic", () => {
  beforeEach(async () => {
    await db.quests.clear();
    await db.settings.clear();
    await db.momentumHistory.clear();
    await db.themes.clear();
  });

  it("completeQuest should increase momentum, exp, coins and possibly unlock themes", async () => {
    await getSettings();

    // Set initial momentum to 150 (Level 4)
    // Formula: floor(sqrt(150/10)) + 1 = floor(3.87) + 1 = 4.
    await db.settings.update("singleton", {
      momentumScore: 150,
      totalExp: 150,
      currentLevel: 4, 
    });

    // Create a quest that gives Rank S (100 EXP)
    // New Momentum = 250
    // sqrt(250/10) = sqrt(25) = 5
    // new Level = floor(5) + 1 = 6.
    await db.quests.add({
      id: "q1",
      title: "Test Quest",
      rank: "S", 
      points: 50, 
      status: "pending",
      questDate: "2026-07-01",
      createdAt: new Date().toISOString(),
    });

    const { leveledUp, newLevel } = await completeQuest("q1");

    const settings = await db.settings.get("singleton");
    expect(settings?.momentumScore).toBe(250); 
    expect(leveledUp).toBe(true);
    expect(newLevel).toBe(6); 
    
    const themes = await db.themes.toArray();
    // Leveled up from 4 to 6. Crossed milestone 5 (level / 5).
    // Floor(4/5) = 0. Floor(6/5) = 1.
    // So 1 theme should be unlocked.
    expect(themes.length).toBe(1);
    expect(themes[0].unlockedAtLevel).toBe(5);
  });

  it("failQuest should deduct coins based on quest points, not momentum", async () => {
    await getSettings();
    await db.settings.update("singleton", {
      momentumScore: 100,
      totalExp: 100,
      currentLevel: 4,
      coins: 200,
      penaltyEnabled: true,
      penaltyPercentage: 50, // 50% penalty
    });

    await db.quests.add({
      id: "q2",
      title: "Test Fail Quest",
      rank: "S", 
      points: 80, // penalty should be 50% of 80 = 40 coins
      status: "pending",
      questDate: "2026-07-02",
      createdAt: new Date().toISOString(),
    });

    await failQuest("q2");

    const newSettings = await db.settings.get("singleton");
    // Coins reduced by 40
    expect(newSettings?.coins).toBe(160); 
    // Momentum shouldn't change
    expect(newSettings?.momentumScore).toBe(100); 
    
    const history = await db.momentumHistory.toArray();
    expect(history.length).toBe(1);
    expect(history[0].reason).toBe("quest_failed_penalty");
    expect(history[0].momentumDelta).toBe(0);
  });
});
