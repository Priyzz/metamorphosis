import { describe, it, expect } from "vitest";
import { calculateLevel } from "@/lib/level";
import { calculatePenalty } from "@/lib/penalty";
import { getDaysDifference } from "@/lib/momentum";

describe("Formulas", () => {
  describe("calculateLevel", () => {
    it("returns 1 for negative or 0 momentum", () => {
      expect(calculateLevel(-50)).toBe(1);
      expect(calculateLevel(0)).toBe(1);
    });

    it("calculates level based on floor(sqrt(momentum / 10)) + 1", () => {
      expect(calculateLevel(10)).toBe(2);
      expect(calculateLevel(40)).toBe(3);
      expect(calculateLevel(90)).toBe(4);
      expect(calculateLevel(160)).toBe(5);
      expect(calculateLevel(100)).toBe(4); 
    });
  });

  describe("calculatePenalty", () => {
    it("returns 0 if percentage is <= 0", () => {
      expect(calculatePenalty(100, 0)).toBe(0);
      expect(calculatePenalty(100, -10)).toBe(0);
    });

    it("returns points if percentage is >= 100", () => {
      expect(calculatePenalty(50, 100)).toBe(50);
      expect(calculatePenalty(50, 150)).toBe(50);
    });

    it("calculates correct percentage and floors the result", () => {
      expect(calculatePenalty(100, 25)).toBe(25);
      expect(calculatePenalty(50, 10)).toBe(5);
      expect(calculatePenalty(99, 10)).toBe(9); // 9.9 -> 9
    });
  });

  describe("getDaysDifference", () => {
    it("calculates difference ignoring time of day", () => {
      // Use local dates to avoid timezone shift issues (like UTC 23:59 vs local 06:59)
      const d1 = new Date(2026, 6, 1, 23, 59, 59); // July 1
      const d2 = new Date(2026, 6, 2, 0, 0, 1);    // July 2
      expect(getDaysDifference(d1, d2)).toBe(1);
    });
  });
});
