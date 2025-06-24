import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { imageDataToJpeg, jpegToImageData } from './image-utils'

// Mock canvas and related APIs
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(),
  toBlob: vi.fn()
}

const mockContext = {
  putImageData: vi.fn(),
  getImageData: vi.fn(),
  drawImage: vi.fn()
}

// Mock FileReader
class MockFileReader {
  onloadend: ((event: any) => void) | null = null
  onerror: ((error: any) => void) | null = null
  result: string | ArrayBuffer | null = null
  
  readAsDataURL(blob: Blob) {
    // Simulate async read
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,mockbase64data'
      if (this.onloadend) {
        this.onloadend({ target: { result: this.result } })
      }
    }, 0)
  }
}

// Mock Image constructor
class MockImage {
  onload: (() => void) | null = null
  onerror: ((error: any) => void) | null = null
  width = 100
  height = 100
  src = ''
  
  constructor() {
    // Simulate image loading when src is set
    Object.defineProperty(this, 'src', {
      set: (value: string) => {
        this._src = value
        // Simulate async image load
        setTimeout(() => {
          if (value.startsWith('data:image')) {
            if (this.onload) this.onload()
          } else {
            if (this.onerror) this.onerror(new Error('Invalid image'))
          }
        }, 0)
      },
      get: () => this._src
    })
  }
  
  private _src = ''
}

describe('image-utils', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Setup document.createElement mock
    global.document = {
      createElement: vi.fn((tagName: string) => {
        if (tagName === 'canvas') {
          return mockCanvas
        }
        return {}
      })
    } as any
    
    // Setup canvas context mock
    mockCanvas.getContext.mockReturnValue(mockContext)
    
    // Setup FileReader mock
    global.FileReader = MockFileReader as any
    
    // Setup Image mock
    global.Image = MockImage as any
  })

  describe('imageDataToJpeg', () => {
    it('should convert ImageData to JPEG data URL', async () => {
      const imageData = new ImageData(100, 100)
      
      // Mock canvas.toBlob to call the callback with a blob
      mockCanvas.toBlob.mockImplementation((callback: BlobCallback, type: string, quality: number) => {
        expect(type).toBe('image/jpeg')
        expect(quality).toBe(0.9)
        const mockBlob = new Blob(['mock jpeg data'], { type: 'image/jpeg' })
        callback(mockBlob)
      })
      
      const result = await imageDataToJpeg(imageData)
      
      expect(result).toBe('data:image/jpeg;base64,mockbase64data')
      expect(mockCanvas.width).toBe(100)
      expect(mockCanvas.height).toBe(100)
      expect(mockContext.putImageData).toHaveBeenCalledWith(imageData, 0, 0)
    })

    it('should handle canvas context error', async () => {
      const imageData = new ImageData(100, 100)
      mockCanvas.getContext.mockReturnValue(null)
      
      await expect(imageDataToJpeg(imageData)).rejects.toThrow('Failed to get canvas context')
    })

    it('should handle toBlob failure', async () => {
      const imageData = new ImageData(100, 100)
      
      mockCanvas.toBlob.mockImplementation((callback: BlobCallback) => {
        callback(null)
      })
      
      await expect(imageDataToJpeg(imageData)).rejects.toThrow('Failed to convert to JPEG')
    })

    it('should handle FileReader error', async () => {
      const imageData = new ImageData(100, 100)
      
      // Mock FileReader to trigger error
      const MockFileReaderWithError = class extends MockFileReader {
        readAsDataURL(blob: Blob) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Read error'))
            }
          }, 0)
        }
      }
      global.FileReader = MockFileReaderWithError as any
      
      mockCanvas.toBlob.mockImplementation((callback: BlobCallback) => {
        const mockBlob = new Blob(['mock data'], { type: 'image/jpeg' })
        callback(mockBlob)
      })
      
      await expect(imageDataToJpeg(imageData)).rejects.toThrow('Read error')
    })

    it('should handle non-string FileReader result', async () => {
      const imageData = new ImageData(100, 100)
      
      // Mock FileReader to return ArrayBuffer
      const MockFileReaderWithArrayBuffer = class extends MockFileReader {
        readAsDataURL(blob: Blob) {
          setTimeout(() => {
            this.result = new ArrayBuffer(8)
            if (this.onloadend) {
              this.onloadend({ target: { result: this.result } })
            }
          }, 0)
        }
      }
      global.FileReader = MockFileReaderWithArrayBuffer as any
      
      mockCanvas.toBlob.mockImplementation((callback: BlobCallback) => {
        const mockBlob = new Blob(['mock data'], { type: 'image/jpeg' })
        callback(mockBlob)
      })
      
      await expect(imageDataToJpeg(imageData)).rejects.toThrow('Failed to convert to data URL')
    })

    it('should handle large ImageData', async () => {
      const largeImageData = new ImageData(4000, 3000)
      
      mockCanvas.toBlob.mockImplementation((callback: BlobCallback) => {
        const mockBlob = new Blob(['large jpeg data'], { type: 'image/jpeg' })
        callback(mockBlob)
      })
      
      const result = await imageDataToJpeg(largeImageData)
      
      expect(result).toBe('data:image/jpeg;base64,mockbase64data')
      expect(mockCanvas.width).toBe(4000)
      expect(mockCanvas.height).toBe(3000)
    })
  })

  describe('jpegToImageData', () => {
    it('should convert JPEG data URL to ImageData', async () => {
      const jpegDataUrl = 'data:image/jpeg;base64,mockbase64data'
      const mockImageData = new ImageData(100, 100)
      
      mockContext.getImageData.mockReturnValue(mockImageData)
      
      const result = await jpegToImageData(jpegDataUrl)
      
      expect(result).toBe(mockImageData)
      expect(mockCanvas.width).toBe(100)
      expect(mockCanvas.height).toBe(100)
      expect(mockContext.drawImage).toHaveBeenCalled()
      expect(mockContext.getImageData).toHaveBeenCalledWith(0, 0, 100, 100)
    })

    it('should handle canvas context error', async () => {
      const jpegDataUrl = 'data:image/jpeg;base64,mockbase64data'
      mockCanvas.getContext.mockReturnValue(null)
      
      await expect(jpegToImageData(jpegDataUrl)).rejects.toThrow('Failed to get canvas context')
    })

    it('should handle image load error', async () => {
      const invalidUrl = 'invalid-url'
      
      await expect(jpegToImageData(invalidUrl)).rejects.toThrow('Invalid image')
    })

    it('should handle different image sizes', async () => {
      const jpegDataUrl = 'data:image/jpeg;base64,mockbase64data'
      
      // Override MockImage dimensions
      const MockImageCustomSize = class extends MockImage {
        width = 800
        height = 600
      }
      global.Image = MockImageCustomSize as any
      
      const mockImageData = new ImageData(800, 600)
      mockContext.getImageData.mockReturnValue(mockImageData)
      
      const result = await jpegToImageData(jpegDataUrl)
      
      expect(mockCanvas.width).toBe(800)
      expect(mockCanvas.height).toBe(600)
      expect(mockContext.getImageData).toHaveBeenCalledWith(0, 0, 800, 600)
    })
  })

  describe('Round-trip conversion', () => {
    it('should handle conversion both ways', async () => {
      const originalImageData = new ImageData(200, 150)
      
      // Setup for imageDataToJpeg
      mockCanvas.toBlob.mockImplementation((callback: BlobCallback) => {
        const mockBlob = new Blob(['jpeg data'], { type: 'image/jpeg' })
        callback(mockBlob)
      })
      
      // Convert to JPEG
      const jpegUrl = await imageDataToJpeg(originalImageData)
      expect(jpegUrl).toBe('data:image/jpeg;base64,mockbase64data')
      
      // Setup for jpegToImageData
      const convertedImageData = new ImageData(200, 150)
      mockContext.getImageData.mockReturnValue(convertedImageData)
      
      // Convert back to ImageData
      const result = await jpegToImageData(jpegUrl)
      
      expect(result.width).toBe(originalImageData.width)
      expect(result.height).toBe(originalImageData.height)
    })
  })

  describe('Edge cases', () => {
    it('should handle empty ImageData', async () => {
      const emptyImageData = new ImageData(1, 1)
      
      mockCanvas.toBlob.mockImplementation((callback: BlobCallback) => {
        const mockBlob = new Blob(['tiny jpeg'], { type: 'image/jpeg' })
        callback(mockBlob)
      })
      
      const result = await imageDataToJpeg(emptyImageData)
      expect(result).toBe('data:image/jpeg;base64,mockbase64data')
    })

    it('should handle very long data URLs', async () => {
      const longDataUrl = 'data:image/jpeg;base64,' + 'A'.repeat(10000)
      const mockImageData = new ImageData(100, 100)
      
      mockContext.getImageData.mockReturnValue(mockImageData)
      
      const result = await jpegToImageData(longDataUrl)
      expect(result).toBe(mockImageData)
    })
  })
})