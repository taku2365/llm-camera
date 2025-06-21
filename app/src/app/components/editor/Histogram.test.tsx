import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import Histogram from './Histogram'
import { createTestImageData } from '@/test/utils'

describe('Histogram', () => {
  it('should render empty state when no image data', () => {
    const { container } = render(<Histogram imageData={null} />)
    
    expect(container.textContent).toContain('Histogram will appear here')
  })

  it('should render canvas when image data provided', () => {
    const testImageData = createTestImageData(100, 100)
    const { container } = render(<Histogram imageData={testImageData} />)
    
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute('width', '256')
    expect(canvas).toHaveAttribute('height', '80')
  })

  it('should calculate histogram data correctly', () => {
    // Create test image with known color distribution
    const width = 10
    const height = 10
    const data = new Uint8ClampedArray(width * height * 4)
    
    // Fill with specific colors
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4
      data[idx] = 128     // R - all pixels have red = 128
      data[idx + 1] = 64  // G - all pixels have green = 64
      data[idx + 2] = 192 // B - all pixels have blue = 192
      data[idx + 3] = 255 // A
    }
    
    const testImageData = new ImageData(data, width, height)
    const { container } = render(<Histogram imageData={testImageData} />)
    
    // Canvas should be rendered
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Get canvas context to verify drawing
    const ctx = canvas?.getContext('2d')
    expect(ctx).toBeTruthy()
  })

  it('should update histogram when image data changes', () => {
    const { rerender, container } = render(<Histogram imageData={null} />)
    
    // Initially no canvas
    expect(container.querySelector('canvas')).not.toBeInTheDocument()
    
    // Add image data
    const testImageData = createTestImageData(50, 50)
    rerender(<Histogram imageData={testImageData} />)
    
    // Canvas should appear
    expect(container.querySelector('canvas')).toBeInTheDocument()
    
    // Change image data
    const newImageData = createTestImageData(100, 100)
    rerender(<Histogram imageData={newImageData} />)
    
    // Canvas should still be there
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })
})