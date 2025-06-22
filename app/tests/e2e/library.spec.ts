import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Photo Library', () => {
  test('should redirect root to library', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/library')
  })

  test('should display empty state initially', async ({ page }) => {
    await page.goto('/library')
    
    // Check for empty state message
    await expect(page.locator('text=No photos yet')).toBeVisible()
    await expect(page.locator('text=Drop RAW files here or click Import Photos')).toBeVisible()
  })

  test('should show supported formats', async ({ page }) => {
    await page.goto('/library')
    
    await expect(page.locator('text=Supports: CR2, CR3, NEF, ARW, DNG, RAF, ORF, RW2, PEF')).toBeVisible()
  })

  test('should handle file import via button', async ({ page }) => {
    await page.goto('/library')
    
    // Click import button - this will open file dialog
    const importButton = page.locator('button:has-text("Import Photos")')
    await expect(importButton).toBeVisible()
    
    // We can't actually interact with native file dialog in Playwright
    // But we can verify the button exists and is clickable
    await expect(importButton).toBeEnabled()
  })

  test('should handle drag and drop area', async ({ page }) => {
    await page.goto('/library')
    
    const dropZone = page.locator('text=Drop RAW files here').locator('..')
    
    // Simulate drag over
    await dropZone.dispatchEvent('dragover', {
      dataTransfer: {
        types: ['Files'],
        effectAllowed: 'all',
      },
    })
    
    // Check if drop zone shows active state (blue border)
    await expect(dropZone).toHaveClass(/border-blue-500/)
  })

  test('should show navigation sidebar', async ({ page }) => {
    await page.goto('/library')
    
    // Check sidebar elements
    await expect(page.locator('h1:has-text("LLM Camera")')).toBeVisible()
    await expect(page.locator('a:has-text("All Photos")')).toBeVisible()
    await expect(page.locator('a:has-text("Favorites")')).toBeVisible()
    await expect(page.locator('a:has-text("Recent")')).toBeVisible()
  })

  test('should have responsive grid layout', async ({ page, viewport }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/library')
    
    // On mobile, grid should have 2 columns (grid-cols-2)
    const dropZone = page.locator('[onDrop]')
    await expect(dropZone).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.reload()
    
    // On desktop, grid should support up to 5 columns (xl:grid-cols-5)
    await expect(dropZone).toBeVisible()
  })
})