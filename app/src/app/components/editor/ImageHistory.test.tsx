import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ImageHistory from './ImageHistory'
import { EditParams } from '@/lib/types'

describe('ImageHistory', () => {
  const mockParams: EditParams = {
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    temperature: 0,
    tint: 0,
    vibrance: 0,
    saturation: 0,
    cropEnabled: false,
    cropArea: { x1: 0, y1: 0, x2: 6000, y2: 4000 },
    userFlip: 0,
    shotSelect: 0,
    noiseThreshold: 100,
    medianPasses: 0,
    dcbIterations: 2,
    dcbEnhance: false,
    outputBPS: 8,
  }

  const mockHistory = [
    {
      id: '1',
      imageData: null,
      jpegDataUrl: 'data:image/jpeg;base64,test1',
      params: { ...mockParams, exposure: 1 },
      timestamp: new Date(Date.now() - 1000)
    },
    {
      id: '2',
      imageData: null,
      jpegDataUrl: 'data:image/jpeg;base64,test2',
      params: { ...mockParams, exposure: 2 },
      timestamp: new Date(Date.now() - 2000)
    },
    {
      id: '3',
      imageData: null,
      jpegDataUrl: 'data:image/jpeg;base64,test3',
      params: { ...mockParams, exposure: 3 },
      timestamp: new Date(Date.now() - 3000)
    }
  ]

  it('renders empty state when no history', () => {
    render(
      <ImageHistory 
        history={[]}
        onRestore={vi.fn()}
        currentImageData={null}
      />
    )
    
    expect(screen.getByText('No history yet. Process an image to see history.')).toBeInTheDocument()
  })

  it('renders history items with proper indexing', () => {
    render(
      <ImageHistory 
        history={mockHistory}
        onRestore={vi.fn()}
        currentImageData={null}
      />
    )
    
    expect(screen.getByText('#0 - 1s ago')).toBeInTheDocument()
    expect(screen.getByText('#1 - 2s ago')).toBeInTheDocument()
    expect(screen.getByText('#2 - 3s ago')).toBeInTheDocument()
  })

  it('switches between normal and compare modes', () => {
    render(
      <ImageHistory 
        history={mockHistory}
        onRestore={vi.fn()}
        currentImageData={null}
      />
    )
    
    const normalButton = screen.getByText('Normal')
    const compareButton = screen.getByText('Compare')
    
    // Default is normal mode
    expect(normalButton).toHaveClass('bg-blue-600')
    expect(compareButton).not.toHaveClass('bg-blue-600')
    
    // Switch to compare mode
    fireEvent.click(compareButton)
    expect(compareButton).toHaveClass('bg-blue-600')
    expect(normalButton).not.toHaveClass('bg-blue-600')
  })

  it('calls onRestore immediately in normal mode', () => {
    const onRestore = vi.fn()
    render(
      <ImageHistory 
        history={mockHistory}
        onRestore={onRestore}
        currentImageData={null}
      />
    )
    
    // Click on first history item
    fireEvent.click(screen.getByText('#0 - 1s ago').closest('div')!)
    
    expect(onRestore).toHaveBeenCalledWith(mockHistory[0])
  })

  it('allows selecting two items in compare mode', () => {
    const onCompareTwoItems = vi.fn()
    render(
      <ImageHistory 
        history={mockHistory}
        onRestore={vi.fn()}
        currentImageData={null}
        onCompareTwoItems={onCompareTwoItems}
      />
    )
    
    // Switch to compare mode
    fireEvent.click(screen.getByText('Compare'))
    
    // Select two items
    fireEvent.click(screen.getByText('#0 - 1s ago').closest('div')!)
    fireEvent.click(screen.getByText('#2 - 3s ago').closest('div')!)
    
    // Show Comparison button should appear
    expect(screen.getByText('Show Comparison')).toBeInTheDocument()
    
    // Click Show Comparison
    fireEvent.click(screen.getByText('Show Comparison'))
    
    expect(onCompareTwoItems).toHaveBeenCalledWith(mockHistory[0], mockHistory[2])
  })

  it('displays mode instructions', () => {
    render(
      <ImageHistory 
        history={mockHistory}
        onRestore={vi.fn()}
        currentImageData={null}
      />
    )
    
    // Normal mode instruction
    expect(screen.getByText('Click to view any cached version')).toBeInTheDocument()
    
    // Switch to compare mode
    fireEvent.click(screen.getByText('Compare'))
    
    // Compare mode instruction
    expect(screen.getByText('Select two versions to compare')).toBeInTheDocument()
  })
})