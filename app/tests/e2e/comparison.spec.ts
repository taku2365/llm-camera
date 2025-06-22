import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Image Comparison Feature', () => {
  // Helper to wait for image to be loaded and visible
  async function waitForImage(page) {
    await page.waitForSelector('canvas', { state: 'visible' })
    await page.waitForTimeout(500) // Wait for canvas to render
  }

  test.beforeEach(async ({ page }) => {
    // Go to library page
    await page.goto('/library')
    
    // Upload a test RAW file
    const fileInput = await page.locator('input[type="file"]')
    const testFile = path.join(__dirname, '../../fixtures/test-image.arw')
    await fileInput.setInputFiles(testFile)
    
    // Wait for upload to complete
    await page.waitForSelector('[data-testid="photo-grid-item"]', { state: 'visible' })
    
    // Click on the uploaded image to open editor
    await page.click('[data-testid="photo-grid-item"]')
    
    // Wait for editor to load
    await page.waitForURL(/\/editor\//)
    await page.waitForSelector('[data-testid="editor-container"]', { state: 'visible' })
  })

  test('should show comparison controls after processing with changed parameters', async ({ page }) => {
    // Initial process
    await page.click('button:has-text("Process")')
    await waitForImage(page)
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/comparison-initial.png', fullPage: true })
    
    // Change a parameter
    const exposureSlider = await page.locator('[data-testid="exposure-slider"]')
    await exposureSlider.fill('2')
    
    // Process again
    await page.click('button:has-text("Process (unsaved)")')
    await waitForImage(page)
    
    // Check that comparison hint appears
    await expect(page.locator('text="Press \\"C\\" to toggle comparison"')).toBeVisible()
    
    // Take screenshot with comparison hint
    await page.screenshot({ path: 'test-results/comparison-hint-visible.png', fullPage: true })
  })

  test('C key should toggle comparison view', async ({ page }) => {
    // Process initial image
    await page.click('button:has-text("Process")')
    await waitForImage(page)
    
    // Change parameter and process again
    await page.locator('[data-testid="exposure-slider"]').fill('2')
    await page.click('button:has-text("Process (unsaved)")')
    await waitForImage(page)
    
    // Press C to enable comparison
    await page.keyboard.press('c')
    await page.waitForTimeout(200)
    
    // Take screenshot of comparison enabled
    await page.screenshot({ path: 'test-results/comparison-enabled.png', fullPage: true })
    
    // Check that mode change hint appears
    await expect(page.locator('text="Press \\"M\\" to change mode"')).toBeVisible()
    
    // Press C again to disable
    await page.keyboard.press('c')
    await page.waitForTimeout(200)
    
    // Take screenshot of comparison disabled
    await page.screenshot({ path: 'test-results/comparison-disabled.png', fullPage: true })
    
    // Mode change hint should be hidden
    await expect(page.locator('text="Press \\"M\\" to change mode"')).not.toBeVisible()
  })

  test('M key should change comparison mode', async ({ page }) => {
    // Process initial image
    await page.click('button:has-text("Process")')
    await waitForImage(page)
    
    // Change parameter and process again
    await page.locator('[data-testid="contrast-slider"]').fill('50')
    await page.click('button:has-text("Process (unsaved)")')
    await waitForImage(page)
    
    // Enable comparison
    await page.keyboard.press('c')
    await page.waitForTimeout(200)
    
    // Default should be slider mode - check for slider handle
    const sliderHandle = page.locator('.cursor-ew-resize')
    await expect(sliderHandle).toBeVisible()
    
    // Take screenshot of slider mode
    await page.screenshot({ path: 'test-results/comparison-slider-mode.png', fullPage: true })
    
    // Press M to switch to side-by-side
    await page.keyboard.press('m')
    await page.waitForTimeout(200)
    
    // Check for side-by-side labels
    await expect(page.locator('text="Before"')).toBeVisible()
    await expect(page.locator('text="After"')).toBeVisible()
    
    // Take screenshot of side-by-side mode
    await page.screenshot({ path: 'test-results/comparison-side-by-side-mode.png', fullPage: true })
    
    // Press M again to switch back to slider
    await page.keyboard.press('m')
    await page.waitForTimeout(200)
    
    // Slider handle should be visible again
    await expect(sliderHandle).toBeVisible()
  })

  test('multiple toggles should not cause bugs', async ({ page }) => {
    // Process initial image
    await page.click('button:has-text("Process")')
    await waitForImage(page)
    
    // Change parameter and process again
    await page.locator('[data-testid="saturation-slider"]').fill('50')
    await page.click('button:has-text("Process (unsaved)")')
    await waitForImage(page)
    
    // Rapidly toggle comparison multiple times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('c')
      await page.waitForTimeout(100)
    }
    
    // Should end up with comparison disabled (even number of toggles)
    await expect(page.locator('text="Press \\"M\\" to change mode"')).not.toBeVisible()
    
    // Enable comparison
    await page.keyboard.press('c')
    await page.waitForTimeout(200)
    
    // Rapidly change modes multiple times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('m')
      await page.waitForTimeout(100)
    }
    
    // Should still be functional - check that we can see one of the modes
    const hasSlider = await page.locator('.cursor-ew-resize').isVisible()
    const hasSideBySide = await page.locator('text="Before"').isVisible()
    
    expect(hasSlider || hasSideBySide).toBeTruthy()
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/comparison-stress-test.png', fullPage: true })
  })

  test('slider interaction should work correctly', async ({ page }) => {
    // Process initial image
    await page.click('button:has-text("Process")')
    await waitForImage(page)
    
    // Change parameter and process again
    await page.locator('[data-testid="vibrance-slider"]').fill('60')
    await page.click('button:has-text("Process (unsaved)")')
    await waitForImage(page)
    
    // Enable comparison
    await page.keyboard.press('c')
    await page.waitForTimeout(200)
    
    // Find slider handle
    const sliderHandle = page.locator('.cursor-ew-resize')
    const boundingBox = await sliderHandle.boundingBox()
    
    if (boundingBox) {
      // Drag slider to different positions
      await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2)
      await page.mouse.down()
      
      // Move to 25%
      await page.mouse.move(boundingBox.x - 200, boundingBox.y + boundingBox.height / 2)
      await page.screenshot({ path: 'test-results/comparison-slider-25.png' })
      
      // Move to 75%
      await page.mouse.move(boundingBox.x + 200, boundingBox.y + boundingBox.height / 2)
      await page.screenshot({ path: 'test-results/comparison-slider-75.png' })
      
      await page.mouse.up()
    }
  })
})