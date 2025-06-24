import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ImageViewer from './ImageViewer'
import { createTestImageData } from '@/test/utils'

describe('ImageViewer - Side by Side Mode', () => {
  it('should render both canvases in side-by-side mode', async () => {
    const currentImageData = createTestImageData(300, 200)
    const previousImageData = createTestImageData(300, 200)
    
    const { container } = render(
      <ImageViewer 
        imageData={currentImageData}
        previousImageData={previousImageData}
        showComparison={true}
        comparisonMode="side-by-side"
        isProcessing={false}
      />
    )
    
    // Wait for canvases to be rendered
    await waitFor(() => {
      const canvases = container.querySelectorAll('canvas')
      expect(canvases).toHaveLength(2)
    })
    
    // Check that both canvases are present
    const canvases = container.querySelectorAll('canvas')
    expect(canvases[0]).toBeInTheDocument()
    expect(canvases[1]).toBeInTheDocument()
    
    // Check labels
    expect(screen.getByText('Before')).toBeInTheDocument()
    expect(screen.getByText('After')).toBeInTheDocument()
    
    // Check that canvases have proper dimensions set
    canvases.forEach(canvas => {
      expect(canvas).toHaveAttribute('width')
      expect(canvas).toHaveAttribute('height')
      expect(canvas.style.width).toBeTruthy()
      expect(canvas.style.height).toBeTruthy()
    })
  })
  
  it('should use currentComparisonData when available in side-by-side mode', async () => {
    const imageData = createTestImageData(300, 200)
    const previousImageData = createTestImageData(300, 200)
    const currentComparisonData = createTestImageData(350, 250) // Different size
    
    const { container } = render(
      <ImageViewer 
        imageData={imageData}
        previousImageData={previousImageData}
        currentComparisonData={currentComparisonData}
        showComparison={true}
        comparisonMode="side-by-side"
        isProcessing={false}
      />
    )
    
    // Wait for canvases to be rendered
    await waitFor(() => {
      const canvases = container.querySelectorAll('canvas')
      expect(canvases).toHaveLength(2)
    })
    
    const canvases = container.querySelectorAll('canvas')
    
    // Check that the second canvas uses currentComparisonData dimensions
    await waitFor(() => {
      expect(canvases[1]).toHaveAttribute('width', '350')
      expect(canvases[1]).toHaveAttribute('height', '250')
    })
  })
  
  it('should switch between slider and side-by-side modes', async () => {
    const currentImageData = createTestImageData(300, 200)
    const previousImageData = createTestImageData(300, 200)
    
    const { rerender, container } = render(
      <ImageViewer 
        imageData={currentImageData}
        previousImageData={previousImageData}
        showComparison={true}
        comparisonMode="slider"
        isProcessing={false}
      />
    )
    
    // In slider mode, we should have 2 canvases overlapping
    let canvases = container.querySelectorAll('canvas')
    expect(canvases).toHaveLength(2)
    
    // Check for slider handle
    expect(container.querySelector('[style*="left:"]')).toBeInTheDocument()
    
    // Switch to side-by-side
    rerender(
      <ImageViewer 
        imageData={currentImageData}
        previousImageData={previousImageData}
        showComparison={true}
        comparisonMode="side-by-side"
        isProcessing={false}
      />
    )
    
    // Should still have 2 canvases but in different arrangement
    canvases = container.querySelectorAll('canvas')
    expect(canvases).toHaveLength(2)
    
    // Check for side-by-side labels
    expect(screen.getByText('Before')).toBeInTheDocument()
    expect(screen.getByText('After')).toBeInTheDocument()
    
    // No slider handle in side-by-side mode
    expect(container.querySelector('[style*="left:"]')).not.toBeInTheDocument()
  })
})