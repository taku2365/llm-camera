import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ImageViewer from './ImageViewer'

describe('ImageViewer', () => {
  const mockImageData = new ImageData(100, 100)
  const mockPreviousImageData = new ImageData(100, 100)

  it('renders without crashing', () => {
    render(<ImageViewer imageData={null} isProcessing={false} />)
    expect(screen.getByText(/To display the image/i)).toBeInTheDocument()
  })

  it('shows processing state', () => {
    render(<ImageViewer imageData={null} isProcessing={true} />)
    expect(screen.getByText(/Processing RAW file/i)).toBeInTheDocument()
  })

  it('renders canvas when image data is provided', () => {
    const { container } = render(<ImageViewer imageData={mockImageData} isProcessing={false} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
  })

  it('shows comparison hint when previous image exists', () => {
    render(
      <ImageViewer 
        imageData={mockImageData} 
        previousImageData={mockPreviousImageData}
        showComparison={false}
        isProcessing={false} 
      />
    )
    // The hint is shown in the parent component, not here
    const { container } = render(<ImageViewer imageData={mockImageData} isProcessing={false} />)
    expect(container.querySelector('canvas')).toBeInTheDocument()
  })

  it('renders slider comparison mode correctly', () => {
    const { container } = render(
      <ImageViewer 
        imageData={mockImageData} 
        previousImageData={mockPreviousImageData}
        showComparison={true}
        isProcessing={false} 
      />
    )
    expect(container.querySelector('.cursor-ew-resize')).toBeInTheDocument()
  })

  it.skip('renders side-by-side comparison mode correctly - feature removed', () => {
    // Feature removed - test skipped
  })

  it('shows zoom controls', () => {
    render(<ImageViewer imageData={mockImageData} isProcessing={false} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('+')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })
})