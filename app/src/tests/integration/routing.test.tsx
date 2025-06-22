import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useRouter, useParams } from 'next/navigation'
import LibraryPage from '@/app/library/page'
import EditorPage from '@/app/editor/[id]/page'
import { usePhotosStore } from '@/lib/store/photos'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
}))

// Mock store
vi.mock('@/lib/store/photos')

// Mock components
vi.mock('@/app/components/editor/ImageViewer', () => ({
  default: ({ imageData, isProcessing }: any) => (
    <div data-testid="image-viewer">
      {imageData ? 'Image loaded' : 'No image loaded'}
      {isProcessing && <span>Processing...</span>}
    </div>
  ),
}))

vi.mock('@/app/components/editor/Histogram', () => ({
  default: ({ imageData }: any) => (
    <div data-testid="histogram">
      {imageData ? 'Histogram data' : 'Histogram will appear here'}
    </div>
  ),
}))

vi.mock('@/app/components/editor/BasicAdjustments', () => ({
  default: ({ params, onChange }: any) => (
    <div data-testid="basic-adjustments">
      <h3>Basic</h3>
      <input 
        type="range" 
        min="-5" 
        max="5" 
        value={params.exposure} 
        onChange={(e) => onChange('exposure', Number(e.target.value))}
      />
    </div>
  ),
}))

describe('App Routing', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Mock router
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as any)
  })

  it('should render library page', () => {
    // Mock empty photos store
    vi.mocked(usePhotosStore).mockReturnValue({
      photos: new Map(),
      addPhoto: vi.fn(),
      setCurrentPhoto: vi.fn(),
      getPhoto: vi.fn(),
    } as any)
    
    render(<LibraryPage />)
    
    // Check for key elements
    expect(screen.getByText('All Photos')).toBeInTheDocument()
    expect(screen.getByText('No photos yet')).toBeInTheDocument()
    expect(screen.getByText('Import Photos')).toBeInTheDocument()
  })

  it('should redirect from editor when no photo is found', () => {
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as any)
    
    vi.mocked(useParams).mockReturnValue({ id: 'non-existent' })
    
    // Mock store returning no photo
    vi.mocked(usePhotosStore).mockReturnValue({
      photos: new Map(),
      addPhoto: vi.fn(),
      setCurrentPhoto: vi.fn(),
      getPhoto: vi.fn().mockReturnValue(undefined),
    } as any)
    
    render(<EditorPage />)
    
    // Should redirect to library
    expect(mockPush).toHaveBeenCalledWith('/library')
  })

  it('should render editor page elements when photo exists', () => {
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as any)
    
    vi.mocked(useParams).mockReturnValue({ id: 'test-photo' })
    
    // Mock a photo in the store
    const mockFile = new File(['test'], 'test.arw', { type: 'image/x-sony-arw' })
    const mockPhoto = {
      id: 'test-photo',
      name: 'test.arw',
      file: mockFile,
      thumbnailUrl: '',
      createdAt: new Date(),
      modifiedAt: new Date(),
    }
    
    vi.mocked(usePhotosStore).mockReturnValue({
      photos: new Map([['test-photo', mockPhoto]]),
      addPhoto: vi.fn(),
      setCurrentPhoto: vi.fn(),
      getPhoto: vi.fn().mockReturnValue(mockPhoto),
    } as any)
    
    render(<EditorPage />)
    
    // Check for editor elements
    expect(screen.getByTestId('histogram')).toBeInTheDocument()
    expect(screen.getByTestId('image-viewer')).toBeInTheDocument()
    expect(screen.getByTestId('basic-adjustments')).toBeInTheDocument()
  })
})