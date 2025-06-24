import { test, expect } from '@playwright/test'

test.describe('History System', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the file selection since we can't use real file input in tests
    await page.goto('/editor/test-id')
    
    // Wait for the editor to load
    await page.waitForSelector('[data-testid="editor-container"]')
  })

  test('should add history entry only after processing completes', async ({ page }) => {
    // Initially no history
    await expect(page.getByText('No history yet')).toBeVisible()
    
    // Change a parameter
    await page.getByLabel('Exposure').fill('1.5')
    
    // Process button should show unsaved state
    await expect(page.getByText('Process (unsaved)')).toBeVisible()
    
    // Click process
    await page.getByText('Process (unsaved)').click()
    
    // During processing, history should not be added yet
    await expect(page.getByText('Processing...')).toBeVisible()
    
    // Wait for processing to complete
    await expect(page.getByText('Process')).toBeVisible({ timeout: 15000 })
    
    // Now history should show 1 item
    await expect(page.getByText('History (1)')).toBeVisible()
    
    // History item should show correct parameters
    await expect(page.getByText(/Exp: 1.5/)).toBeVisible()
  })

  test('should handle multiple processing cycles correctly', async ({ page }) => {
    // Process first image
    await page.getByText('Process').click()
    await expect(page.getByText('Processing...')).toBeVisible()
    await expect(page.getByText('Process')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('History (1)')).toBeVisible()
    
    // Process second image with different parameters
    await page.getByLabel('Contrast').fill('50')
    await page.getByText('Process (unsaved)').click()
    await expect(page.getByText('Processing...')).toBeVisible()
    await expect(page.getByText('Process')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('History (2)')).toBeVisible()
    
    // Process third image
    await page.getByLabel('Exposure').fill('2.0')
    await page.getByText('Process (unsaved)').click()
    await expect(page.getByText('Processing...')).toBeVisible()
    await expect(page.getByText('Process')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('History (3)')).toBeVisible()
    
    // Verify all history items are present
    await expect(page.getByText('#0 -')).toBeVisible()
    await expect(page.getByText('#1 -')).toBeVisible()
    await expect(page.getByText('#2 -')).toBeVisible()
  })

  test('single mode should display selected image immediately', async ({ page }) => {
    // Create some history
    for (let i = 0; i < 3; i++) {
      await page.getByLabel('Exposure').fill(String(i))
      await page.getByText(/Process/).click()
      await expect(page.getByText('Processing...')).toBeVisible()
      await expect(page.getByText('Process')).toBeVisible({ timeout: 15000 })
    }
    
    // Should be in single mode by default
    await expect(page.getByRole('button', { name: 'Single' })).toHaveClass(/bg-blue-600/)
    
    // Click on history item #1
    await page.getByText('#1 -').click()
    
    // Parameters should update to match history item
    await expect(page.getByLabel('Exposure')).toHaveValue('1')
    
    // Should not show comparison slider
    await expect(page.locator('[data-testid="comparison-slider"]')).not.toBeVisible()
  })

  test('compare mode should show slider when two items selected', async ({ page }) => {
    // Create at least 2 history items
    await page.getByText('Process').click()
    await expect(page.getByText('Process')).toBeVisible({ timeout: 15000 })
    
    await page.getByLabel('Exposure').fill('2.0')
    await page.getByText('Process (unsaved)').click()
    await expect(page.getByText('Process')).toBeVisible({ timeout: 15000 })
    
    // Switch to compare mode
    await page.getByRole('button', { name: 'Compare' }).click()
    await expect(page.getByText('Select two versions to compare')).toBeVisible()
    
    // Select first item
    await page.getByText('#0 -').click()
    
    // Select second item
    await page.getByText('#1 -').click()
    
    // Comparison slider should now be visible
    await expect(page.locator('[data-testid="comparison-slider"]')).toBeVisible()
    
    // Should show "Showing Comparison" in image viewer
    await expect(page.getByTestId('show-comparison')).toContainText('Showing Comparison')
  })

  test('should not duplicate history when switching modes', async ({ page }) => {
    // Process once
    await page.getByText('Process').click()
    await expect(page.getByText('Process')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('History (1)')).toBeVisible()
    
    // Switch to compare mode
    await page.getByRole('button', { name: 'Compare' }).click()
    await expect(page.getByText('History (1)')).toBeVisible()
    
    // Switch back to single mode
    await page.getByRole('button', { name: 'Single' }).click()
    await expect(page.getByText('History (1)')).toBeVisible()
    
    // Multiple switches
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: 'Compare' }).click()
      await page.getByRole('button', { name: 'Single' }).click()
    }
    
    // Should still have only 1 history item
    await expect(page.getByText('History (1)')).toBeVisible()
  })

  test('should clear selection when switching modes', async ({ page }) => {
    // Create history
    await page.getByText('Process').click()
    await expect(page.getByText('Process')).toBeVisible({ timeout: 15000 })
    
    await page.getByLabel('Exposure').fill('1.0')
    await page.getByText('Process (unsaved)').click()
    await expect(page.getByText('Process')).toBeVisible({ timeout: 15000 })
    
    // Switch to compare mode and select items
    await page.getByRole('button', { name: 'Compare' }).click()
    await page.getByText('#0 -').click()
    await page.getByText('#1 -').click()
    
    // Items should be selected (have blue background)
    await expect(page.locator('[class*="bg-blue-900/30"]')).toHaveCount(2)
    
    // Switch back to single mode
    await page.getByRole('button', { name: 'Single' }).click()
    
    // Selection should be cleared
    await expect(page.locator('[class*="bg-blue-900/30"]')).toHaveCount(0)
  })
})