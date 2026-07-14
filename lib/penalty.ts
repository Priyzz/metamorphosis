/**
 * Hitung potongan skor momentum saat quest gagal.
 * Potongan berupa persentase dari poin awal quest.
 * Mengembalikan angka positif (jumlah potongan).
 */
export function calculatePenalty(points: number, percentage: number): number {
  if (percentage <= 0) return 0;
  if (percentage >= 100) return points;
  // Memastikan hasil potongannya adalah bilangan bulat
  return Math.floor(points * (percentage / 100));
}
