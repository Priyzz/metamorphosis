import { test, expect } from '@playwright/test';

test.describe('Metamorphosis Critical Path', () => {
  test('User can create quest, complete it, and redeem a reward', async ({ page }) => {
    // 1. Go to homepage (Dashboard)
    await page.goto('/');
    await expect(page).toHaveTitle(/Metamorphosis/i);

    // 2. Go to Quests page
    await page.goto('/quests');
    await expect(page).toHaveURL(/.*\/quests/);

    // 3. Create a new quest by opening the dialog
    await page.click('#add-quest-button');
    await expect(page.locator('input#quest-title')).toBeVisible();

    await page.fill('input#quest-title', 'E2E Epic Quest');

    // Select Rank S via shadcn Select
    await page.click('button#quest-rank');
    await page.locator('[role="option"]').filter({ hasText: 'Rank S' }).click();

    await page.fill('input#quest-points', '200');
    await page.click('#submit-quest-button');

    // Wait for the quest to appear in the list
    await expect(page.locator(`text=E2E Epic Quest`)).toBeVisible();

    // 4. Complete the quest
    await page.click('button[aria-label="Tandai selesai"]');

    // 5. Wait for Level Up Modal (or just close it if it appears)
    const modal = page.locator('div[role="dialog"]');
    const modalVisible = await modal.isVisible({ timeout: 5000 }).catch(() => false);
    if (modalVisible) {
      // Fill in reflection if textarea is present
      const textarea = modal.locator('textarea');
      const textareaVisible = await textarea.isVisible({ timeout: 2000 }).catch(() => false);
      if (textareaVisible) {
        await textarea.fill('Saya berhasil menyelesaikan E2E quest ini!');
        const saveBtn = modal.locator('button:has-text("Simpan")');
        const saveBtnVisible = await saveBtn.isVisible({ timeout: 2000 }).catch(() => false);
        if (saveBtnVisible) await saveBtn.click();
      } else {
        // Try to close/skip the modal
        const closeBtn = modal.locator('button').first();
        await closeBtn.click({ timeout: 2000 }).catch(() => {});
      }
    }

    // 6. Create a reward
    await page.goto('/rewards');
    await expect(page).toHaveURL(/.*\/rewards/);

    // Open the Tambah Reward dialog
    await page.click('button:has-text("Tambah Reward")');
    await expect(page.locator('input#name')).toBeVisible();

    await page.fill('input#name', 'E2E Treat');
    await page.fill('input#pointsCost', '150');
    await page.click('button[type="submit"]:has-text("Simpan")');

    // Wait for the reward to appear
    await expect(page.locator('h3:has-text("E2E Treat")')).toBeVisible();

    // 7. Redeem the reward (button text is "Redeem")
    await page.click('button:has-text("Redeem")');

    // 8. Go to Dashboard to verify coin balance
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/dashboard/);
    // 200 pts earned - 150 spent = 50 koin remaining
    await expect(page.locator('text=50').first()).toBeVisible();
  });
});
