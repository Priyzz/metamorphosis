/**
 * Konversi Momentum Score ke Level.
 * Menggunakan kurva akar kuadrat (square root curve) agar
 * semakin tinggi level, semakin banyak momentum yang dibutuhkan.
 *
 * Rumus awal: Level = floor(sqrt(momentum / 10)) + 1
 */
export function calculateLevel(momentum: number): number {
  if (momentum <= 0) return 1;
  return Math.floor(Math.sqrt(momentum / 10)) + 1;
}

/**
 * Dapatkan total momentum yang dibutuhkan untuk mencapai level tertentu.
 * Berdasarkan rumus terbalik dari `calculateLevel`.
 * Level = floor(sqrt(momentum / 10)) + 1
 * sqrt(momentum / 10) = Level - 1
 * momentum / 10 = (Level - 1)^2
 * momentum = 10 * (Level - 1)^2
 */
export function getMomentumRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return 10 * Math.pow(level - 1, 2);
}

/**
 * Hitung detail progress level saat ini menuju level selanjutnya.
 */
export function calculateLevelProgress(currentMomentum: number) {
  const currentLevel = calculateLevel(currentMomentum);
  
  const momentumBase = getMomentumRequiredForLevel(currentLevel);
  const momentumNext = getMomentumRequiredForLevel(currentLevel + 1);
  
  const momentumEarnedInCurrentLevel = currentMomentum - momentumBase;
  const momentumRequiredForNextLevel = momentumNext - momentumBase;
  
  const percentage = (momentumEarnedInCurrentLevel / momentumRequiredForNextLevel) * 100;
  
  return {
    currentLevel,
    currentMomentum,
    momentumBase,
    momentumNext,
    momentumEarnedInCurrentLevel,
    momentumRequiredForNextLevel,
    pointsToNextLevel: momentumNext - currentMomentum,
    percentage: Math.min(100, Math.max(0, percentage)), // clamp 0-100
  };
}
