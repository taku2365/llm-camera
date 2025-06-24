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

  it('switches between single and compare modes', () => {
    render(
      <ImageHistory 
        history={mockHistory}
        onRestore={vi.fn()}
        currentImageData={null}
      />
    )
    
    const singleButton = screen.getByText('Single')
    const compareButton = screen.getByText('Compare')
    
    // Default is single mode
    expect(singleButton).toHaveClass('bg-blue-600')
    expect(compareButton).not.toHaveClass('bg-blue-600')
    
    // Switch to compare mode
    fireEvent.click(compareButton)
    expect(compareButton).toHaveClass('bg-blue-600')
    expect(singleButton).not.toHaveClass('bg-blue-600')
  })

  it('calls onRestore immediately in single mode', () => {
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
    
    // Auto-compare should be called when 2 items are selected
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
    
    // Single mode instruction
    expect(screen.getByText('Select a version to view')).toBeInTheDocument()
    
    // Switch to compare mode
    fireEvent.click(screen.getByText('Compare'))
    
    // Compare mode instruction
    expect(screen.getByText('Select two versions to compare')).toBeInTheDocument()
  })

  it('disables compare mode when less than 2 items', () => {
    render(
      <ImageHistory 
        history={[mockHistory[0]]} // Only one item
        onRestore={vi.fn()}
        currentImageData={null}
      />
    )
    
    const compareButton = screen.getByText('Compare')
    expect(compareButton).toBeDisabled()
  })
})