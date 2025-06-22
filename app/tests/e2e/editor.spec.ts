import { test, expect } from '@playwright/test'

test.describe('Photo Editor', () => {
  test('should redirect to library when no photo is loaded', async ({ page }) => {
    // Try to access editor without a photo ID
    await page.goto('/editor/non-existent-id')
    
    // Should redirect to library
    await expect(page).toHaveURL('/library')
  })

  test('should show editor layout elements', async ({ page }) => {
    // We need to mock having a photo in the store
    // For now, just verify the editor page structure
    await page.goto('/editor/test-photo-id')
    
    // Check header elements
    await expect(page.locator('h1:has-text("RAW Photo Editor")')).toBeVisible()
    await expect(page.locator('button:has-text("Undo")')).toBeVisible()
    await expect(page.locator('button:has-text("Redo")')).toBeVisible()
    await expect(page.locator('button:has-text("Export")')).toBeVisible()
    
    // Check back button
    const backButton = page.locator('a[href="/library"]')
    await expect(backButton).toBeVisible()
  })

  test('should display adjustment panels', async ({ page }) => {
    await page.goto('/editor/test-photo-id')
    
    // Check Basic adjustments section
    await expect(page.locator('h3:has-text("Basic")')).toBeVisible()
    
    // Check all adjustment sliders
    const adjustments = [
      'Exposure',
      'Contrast', 
      'Highlights',
      'Shadows',
      'Whites',
      'Blacks',
      'Temperature',
      'Tint',
      'Vibrance',
      'Saturation'
    ]
    
    for (const adjustment of adjustments) {
      await expect(page.locator(`text=${adjustment}`)).toBeVisible()
    }
    
    // Check Color section
    await expect(page.locator('h3:has-text("Color")')).toBeVisible()
    
    // Check Reset button
    await expect(page.locator('button:has-text("Reset All")')).toBeVisible()
  })

  test('should show histogram area', async ({ page }) => {
    await page.goto('/editor/test-photo-id')
    
    // Check histogram placeholder
    await expect(page.locator('text=Histogram will appear here')).toBeVisible()
  })

  test('should show image viewer area', async ({ page }) => {
    await page.goto('/editor/test-photo-id')
    
    // Check for "No image loaded" message since we don't have a real photo
    await expect(page.locator('text=No image loaded')).toBeVisible()
  })

  test('should interact with adjustment sliders', async ({ page }) => {
    await page.goto('/editor/test-photo-id')
    
    // Find exposure slider
    const exposureSlider = page.locator('input[type="range"][min="-5"][max="5"]')
    await expect(exposureSlider).toBeVisible()
    
    // Get initial value
    const initialValue = await exposureSlider.inputValue()
    expect(initialValue).toBe('0')
    
    // Change slider value
    await exposureSlider.fill('2')
    
    // Check value display updated
    const exposureValue = page.locator('text=Exposure').locator('..').locator('span.text-right')
    await expect(exposureValue).toHaveText('2')
  })

  test('should navigate back to library', async ({ page }) => {
    await page.goto('/editor/test-photo-id')
    
    // Click back button
    const backButton = page.locator('a[href="/library"]')
    await backButton.click()
    
    // Should navigate to library
    await expect(page).toHaveURL('/library')
  })

  test('should have responsive layout', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/editor/test-photo-id')
    
    // On mobile, adjustment panel might be hidden or repositioned
    // Just verify page loads without errors
    await expect(page.locator('h1:has-text("RAW Photo Editor")')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.reload()
    
    // On desktop, all panels should be visible
    await expect(page.locator('aside')).toBeVisible() // Right panel
  })
})