import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useLibRaw } from './useLibRaw'
import { createTestEditParams } from '@/test/utils'

// Mock the LibRaw client
let mockClient: any

vi.mock('@/lib/libraw/client', () => ({
  getLibRawClient: () => mockClient,
}))

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')

describe('useLibRaw', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClient = {
      loadFile: vi.fn().mockResolvedValue({
        camera: 'Test Camera',
        iso: 100,
        aperture: 2.8,
        shutterSpeed: '1/100',
        focalLength: 50,
        date: new Date(),
        width: 100,
        height: 100,
      }),
      process: vi.fn().mockResolvedValue(new ImageData(100, 100)),
      dispose: vi.fn(),
      getThumbnail: vi.fn().mockResolvedValue({
        format: 'jpeg',
        data: new Uint8Array([0xFF, 0xD8, 0xFF]) // Mock JPEG data
      }),
    }
  })

  it('should initialize with null state', () => {
    const { result } = renderHook(() => useLibRaw())
    
    expect(result.current.imageData).toBeNull()
    expect(result.current.metadata).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should load file successfully', async () => {
    const { result } = renderHook(() => useLibRaw())
    
    const testFile = new File(['test'], 'test.arw', { type: 'image/x-sony-arw' })
    
    await act(async () => {
      await result.current.loadFile(testFile)
    })
    
    await waitFor(() => {
      expect(result.current.metadata).not.toBeNull()
      expect(result.current.thumbnail).toBeTruthy()
      expect(result.current.isLoading).toBe(false)
      // imageData should still be null until process is called
      expect(result.current.imageData).toBeNull()
    })
  })

  it('should handle loading errors', async () => {
    mockClient.loadFile.mockRejectedValueOnce(new Error('Failed to load'))
    
    const { result } = renderHook(() => useLibRaw())
    
    const testFile = new File(['test'], 'test.arw', { type: 'image/x-sony-arw' })
    
    await act(async () => {
      await result.current.loadFile(testFile)
    })
    
    expect(result.current.error).toBe('Failed to load')
    expect(result.current.isLoading).toBe(false)
  })

  it('should process with new parameters', async () => {
    const { result } = renderHook(() => useLibRaw())
    
    // First load a file
    const testFile = new File(['test'], 'test.arw', { type: 'image/x-sony-arw' })
    await act(async () => {
      await result.current.loadFile(testFile)
    })
    
    // Then process with new parameters
    const editParams = createTestEditParams({ exposure: 2, contrast: 50 })
    
    await act(async () => {
      await result.current.process(editParams)
    })
    
    await waitFor(() => {
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.imageData).not.toBeNull()
    })
  })

  it('should not process without loaded file', async () => {
    const { result } = renderHook(() => useLibRaw())
    
    const editParams = createTestEditParams()
    
    await act(async () => {
      await result.current.process(editParams)
    })
    
    expect(result.current.error).toBe('No file loaded')
  })

  it('should dispose on unmount', () => {
    const { unmount } = renderHook(() => useLibRaw())
    
    unmount()
    
    expect(mockClient.dispose).toHaveBeenCalled()
  })
})