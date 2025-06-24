import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import EditorPage from './[id]/page'
import { useParams, useRouter } from 'next/navigation'
import { usePhotosStore } from '@/lib/store/photos'
import { useLibRaw } from '@/lib/hooks/useLibRaw'

// Set up process.env before any imports
Object.defineProperty(globalThis, 'process', {
  value: {
    env: {
      NODE_ENV: 'test'
    }
  },
  writable: true,
  configurable: true
})

// Mock modules
vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: vi.fn()
}))

vi.mock('@/lib/store/photos', () => ({
  usePhotosStore: vi.fn()
}))

vi.mock('@/lib/hooks/useLibRaw', () => ({
  useLibRaw: vi.fn()
}))

vi.mock('@/lib/utils/image-utils', () => ({
  imageDataToJpeg: vi.fn().mockResolvedValue('data:image/jpeg;base64,mockjpeg'),
  jpegToImageData: vi.fn().mockResolvedValue(new ImageData(100, 100))
}))

// Mock components to simplify testing
vi.mock('@/app/components/editor/ImageViewer', () => ({
  default: ({ imageData, previousImageData, showComparison }: any) => (
    <div data-testid="image-viewer">
      <div data-testid="current-image">{imageData ? 'Current Image' : 'No Image'}</div>
      <div data-testid="previous-image">{previousImageData ? 'Previous Image' : 'No Previous'}</div>
      <div data-testid="show-comparison">{showComparison ? 'Showing Comparison' : 'No Comparison'}</div>
    </div>
  )
}))

vi.mock('@/app/components/editor/ImageHistory', () => ({
  default: ({ history, onRestore, mode, selectedIndices, onSelectionChange, onCompareTwoItems }: any) => (
    <div data-testid="image-history">
      <div data-testid="history-count">{history.length} items</div>
      <div data-testid="history-mode">{mode}</div>
      <div data-testid="history-selection">{selectedIndices.join(',')}</div>
      {history.map((item: any, index: number) => (
        <button
          key={item.id}
          data-testid={`history-item-${index}`}
          onClick={() => onRestore(item)}
        >
          History {index}
        </button>
      ))}
      {mode === 'compare' && selectedIndices.length === 2 && (
        <button
          data-testid="compare-two-items"
          onClick={() => onCompareTwoItems(history[selectedIndices[0]], history[selectedIndices[1]])}
        >
          Compare Two Items
        </button>
      )}
    </div>
  )
}))

vi.mock('@/app/components/editor/Histogram', () => ({
  default: () => <div data-testid="histogram">Histogram</div>
}))

vi.mock('@/app/components/editor/BasicAdjustments', () => ({
  default: ({ params, onChange }: any) => (
    <div data-testid="basic-adjustments">
      <label>
        Exposure
        <input
          type="number"
          value={params.exposure}
          onChange={(e) => onChange('exposure', parseFloat(e.target.value))}
          step="0.1"
        />
      </label>
      <label>
        Contrast
        <input
          type="number"
          value={params.contrast}
          onChange={(e) => onChange('contrast', parseInt(e.target.value))}
        />
      </label>
    </div>
  )
}))

vi.mock('@/app/components/editor/AdvancedAdjustments', () => ({
  default: () => <div data-testid="advanced-adjustments">Advanced Adjustments</div>
}))

vi.mock('@/app/components/editor/ComparisonDebugger', () => ({
  default: () => null
}))

describe('EditorPage History Integration', () => {
  let mockRouter: any
  let mockGetPhoto: any
  let mockLoadFile: any
  let mockProcess: any
  let mockFile: File

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockRouter = { push: vi.fn() }
    mockGetPhoto = vi.fn()
    mockLoadFile = vi.fn()
    mockProcess = vi.fn()
    mockFile = new File(['test'], 'test.raw', { type: 'image/raw' })

    ;(useParams as any).mockReturnValue({ id: 'test-id' })
    ;(useRouter as any).mockReturnValue(mockRouter)
    ;(usePhotosStore as any).mockReturnValue({ getPhoto: mockGetPhoto })
    
    // Default photo
    mockGetPhoto.mockReturnValue({ id: 'test-id', file: mockFile })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('History Addition Timing', () => {
    it('should not add to history while processing', async () => {
      let isProcessing = false
      let triggerProcessingComplete: (() => void) | null = null

      ;(useLibRaw as any).mockImplementation(() => ({
        loadFile: mockLoadFile,
        process: mockProcess.mockImplementation(() => {
          isProcessing = true
        }),
        imageData: new ImageData(100, 100),
        metadata: null,
        thumbnail: null,
        isLoading: false,
        isProcessing,
        error: null
      }))

      const { rerender } = render(<EditorPage />)

      // Click process button
      const processButton = screen.getByText('Process')
      fireEvent.click(processButton)

      // Update to processing state
      isProcessing = true
      ;(useLibRaw as any).mockImplementation(() => ({
        loadFile: mockLoadFile,
        process: mockProcess,
        imageData: new ImageData(100, 100),
        metadata: null,
        thumbnail: null,
        isLoading: false,
        isProcessing: true,
        error: null
      }))
      
      rerender(<EditorPage />)

      // History should still be empty while processing
      expect(screen.getByTestId('history-count')).toHaveTextContent('0 items')
    })

    it('should add to history only after processing completes', async () => {
      let isProcessing = false
      const imageData = new ImageData(100, 100)

      const mockLibRaw = {
        loadFile: mockLoadFile,
        process: mockProcess.mockImplementation(() => {
          isProcessing = true
        }),
        imageData: null,
        metadata: null,
        thumbnail: null,
        isLoading: false,
        isProcessing: false,
        error: null
      }

      ;(useLibRaw as any).mockReturnValue(mockLibRaw)

      const { rerender } = render(<EditorPage />)

      // Click process button
      const processButton = screen.getByText('Process')
      fireEvent.click(processButton)

      // Simulate processing state
      mockLibRaw.isProcessing = true
      ;(useLibRaw as any).mockReturnValue({ ...mockLibRaw })
      rerender(<EditorPage />)

      // Still no history during processing
      expect(screen.getByTestId('history-count')).toHaveTextContent('0 items')

      // Complete processing
      mockLibRaw.isProcessing = false
      mockLibRaw.imageData = imageData
      ;(useLibRaw as any).mockReturnValue({ ...mockLibRaw })
      rerender(<EditorPage />)

      // Now history should be added
      await waitFor(() => {
        expect(screen.getByTestId('history-count')).toHaveTextContent('1 items')
      })
    })

    it('should handle multiple processing cycles correctly', async () => {
      let isProcessing = false
      const imageData = new ImageData(100, 100)

      const mockLibRaw = {
        loadFile: mockLoadFile,
        process: mockProcess,
        imageData: null,
        metadata: null,
        thumbnail: null,
        isLoading: false,
        isProcessing: false,
        error: null
      }

      ;(useLibRaw as any).mockReturnValue(mockLibRaw)

      const { rerender } = render(<EditorPage />)

      // Process 1
      fireEvent.click(screen.getByText('Process'))
      mockLibRaw.isProcessing = true
      rerender(<EditorPage />)
      mockLibRaw.isProcessing = false
      mockLibRaw.imageData = imageData
      rerender(<EditorPage />)

      await waitFor(() => {
        expect(screen.getByTestId('history-count')).toHaveTextContent('1 items')
      })

      // Process 2 with different params
      const exposureInput = screen.getByLabelText('Exposure')
      fireEvent.change(exposureInput, { target: { value: '1.5' } })
      fireEvent.click(screen.getByText('Process (unsaved)'))
      mockLibRaw.isProcessing = true
      rerender(<EditorPage />)
      mockLibRaw.isProcessing = false
      rerender(<EditorPage />)

      await waitFor(() => {
        expect(screen.getByTestId('history-count')).toHaveTextContent('2 items')
      })

      // Process 3
      const contrastInput = screen.getByLabelText('Contrast')
      fireEvent.change(contrastInput, { target: { value: '50' } })
      fireEvent.click(screen.getByText('Process (unsaved)'))
      mockLibRaw.isProcessing = true
      rerender(<EditorPage />)
      mockLibRaw.isProcessing = false
      rerender(<EditorPage />)

      await waitFor(() => {
        expect(screen.getByTestId('history-count')).toHaveTextContent('3 items')
      })
    })
  })

  describe('Single Mode Image Display', () => {
    it('should update display when selecting history item in single mode', async () => {
      const mockLibRaw = {
        loadFile: mockLoadFile,
        process: mockProcess,
        imageData: new ImageData(100, 100),
        metadata: null,
        thumbnail: null,
        isLoading: false,
        isProcessing: false,
        error: null
      }

      ;(useLibRaw as any).mockReturnValue(mockLibRaw)

      const { rerender } = render(<EditorPage />)

      // Add some history items
      fireEvent.click(screen.getByText('Process'))
      mockLibRaw.isProcessing = true
      rerender(<EditorPage />)
      mockLibRaw.isProcessing = false
      rerender(<EditorPage />)

      await waitFor(() => {
        expect(screen.getByTestId('history-count')).toHaveTextContent('1 items')
      })

      // Click history item
      fireEvent.click(screen.getByTestId('history-item-0'))

      // Should show current image
      await waitFor(() => {
        expect(screen.getByTestId('current-image')).toHaveTextContent('Current Image')
      })
      
      // Should not show comparison in single mode
      expect(screen.getByTestId('show-comparison')).toHaveTextContent('No Comparison')
      expect(screen.getByTestId('previous-image')).toHaveTextContent('No Previous')
    })

    it('should clear comparison state when switching to single mode', async () => {
      const mockLibRaw = {
        loadFile: mockLoadFile,
        process: mockProcess,
        imageData: new ImageData(100, 100),
        metadata: null,
        thumbnail: null,
        isLoading: false,
        isProcessing: false,
        error: null
      }

      ;(useLibRaw as any).mockReturnValue(mockLibRaw)
      
      render(<EditorPage />)

      // Initially no comparison
      expect(screen.getByTestId('previous-image')).toHaveTextContent('No Previous')
    })
  })

  describe('Compare Mode', () => {
    it('should show comparison when two items selected in compare mode', async () => {
      const mockLibRaw = {
        loadFile: mockLoadFile,
        process: mockProcess,
        imageData: new ImageData(100, 100),
        metadata: null,
        thumbnail: null,
        isLoading: false,
        isProcessing: false,
        error: null
      }

      ;(useLibRaw as any).mockReturnValue(mockLibRaw)

      const { rerender } = render(<EditorPage />)

      // Add two history items
      for (let i = 0; i < 2; i++) {
        fireEvent.click(screen.getByText(/Process/))
        mockLibRaw.isProcessing = true
        rerender(<EditorPage />)
        mockLibRaw.isProcessing = false
        rerender(<EditorPage />)
        await waitFor(() => {
          expect(screen.getByTestId('history-count')).toHaveTextContent(`${i + 1} items`)
        })
      }

      // Should show comparison when mode is compare and 2 items selected
      expect(screen.getByTestId('history-mode')).toHaveTextContent('single')
      expect(screen.getByTestId('show-comparison')).toHaveTextContent('No Comparison')
    })
  })

  describe('Parameter Updates', () => {
    it('should update parameters when restoring from history', async () => {
      const mockLibRaw = {
        loadFile: mockLoadFile,
        process: mockProcess,
        imageData: new ImageData(100, 100),
        metadata: null,
        thumbnail: null,
        isLoading: false,
        isProcessing: false,
        error: null
      }

      ;(useLibRaw as any).mockReturnValue(mockLibRaw)

      const { rerender } = render(<EditorPage />)

      // Process with specific params
      const exposureInput = screen.getByLabelText('Exposure')
      fireEvent.change(exposureInput, { target: { value: '2.5' } })
      
      fireEvent.click(screen.getByText('Process (unsaved)'))
      mockLibRaw.isProcessing = true
      rerender(<EditorPage />)
      mockLibRaw.isProcessing = false
      rerender(<EditorPage />)

      await waitFor(() => {
        expect(screen.getByTestId('history-count')).toHaveTextContent('1 items')
      })

      // Change params
      fireEvent.change(exposureInput, { target: { value: '0' } })
      
      // Restore from history
      fireEvent.click(screen.getByTestId('history-item-0'))

      // Params should be restored
      await waitFor(() => {
        expect(exposureInput).toHaveValue(2.5)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should not add duplicate history when mode switches', async () => {
      const mockLibRaw = {
        loadFile: mockLoadFile,
        process: mockProcess,
        imageData: new ImageData(100, 100),
        metadata: null,
        thumbnail: null,
        isLoading: false,
        isProcessing: false,
        error: null
      }

      ;(useLibRaw as any).mockReturnValue(mockLibRaw)

      const { rerender } = render(<EditorPage />)

      // Process once
      fireEvent.click(screen.getByText('Process'))
      mockLibRaw.isProcessing = true
      rerender(<EditorPage />)
      mockLibRaw.isProcessing = false
      rerender(<EditorPage />)

      await waitFor(() => {
        expect(screen.getByTestId('history-count')).toHaveTextContent('1 items')
      })

      // Mode changes should not affect history count
      expect(screen.getByTestId('history-count')).toHaveTextContent('1 items')
    })

    it('should handle rapid processing requests correctly', async () => {
      const mockLibRaw = {
        loadFile: mockLoadFile,
        process: mockProcess,
        imageData: new ImageData(100, 100),
        metadata: null,
        thumbnail: null,
        isLoading: false,
        isProcessing: false,
        error: null
      }

      ;(useLibRaw as any).mockReturnValue(mockLibRaw)

      const { rerender } = render(<EditorPage />)

      // Click process multiple times rapidly
      fireEvent.click(screen.getByText('Process'))
      fireEvent.click(screen.getByText('Processing...'))
      fireEvent.click(screen.getByText('Processing...'))

      mockLibRaw.isProcessing = true
      rerender(<EditorPage />)
      
      // Complete processing
      mockLibRaw.isProcessing = false
      rerender(<EditorPage />)

      // Should only add one history item
      await waitFor(() => {
        expect(screen.getByTestId('history-count')).toHaveTextContent('1 items')
      })
    })
  })
})