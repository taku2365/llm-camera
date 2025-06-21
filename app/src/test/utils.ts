import { EditParams, ProcessParams } from '@/lib/types'

// Create a test RAW file (minimal TIFF structure)
export function createTestRawFile(width: number = 100, height: number = 100): ArrayBuffer {
  // This creates a minimal TIFF file structure
  // Real RAW files are much more complex, but this works for testing
  const data = new Uint8Array(width * height * 2) // 16-bit per pixel
  
  // Fill with test pattern
  for (let i = 0; i < data.length; i++) {
    data[i] = (i % 256) as number
  }
  
  return data.buffer
}

// Create test edit parameters
export function createTestEditParams(overrides?: Partial<EditParams>): EditParams {
  return {
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
    ...overrides,
  }
}

// Create test process parameters
export function createTestProcessParams(overrides?: Partial<ProcessParams>): ProcessParams {
  return {
    useCameraWB: true,
    outputColor: 1, // sRGB
    brightness: 1.0,
    quality: 3, // AHD
    halfSize: false,
    ...overrides,
  }
}

// Create test ImageData
export function createTestImageData(width: number = 100, height: number = 100): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  
  // Fill with gradient pattern
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      data[idx] = (x / width) * 255     // R
      data[idx + 1] = (y / height) * 255 // G
      data[idx + 2] = 128               // B
      data[idx + 3] = 255               // A
    }
  }
  
  return new ImageData(data, width, height)
}

// Mock LibRaw module
export function createMockLibRawModule() {
  return {
    LibRaw: {
      new: vi.fn(() => ({
        loadFromUint8Array: vi.fn(() => true),
        process: vi.fn(() => true),
        getImageData: vi.fn(() => ({
          data: new Uint8Array(100 * 100 * 4),
          width: 100,
          height: 100,
        })),
        getMetadata: vi.fn(() => ({
          make: 'Test',
          model: 'Camera',
          iso_speed: 100,
          aperture: 2.8,
          shutter: '1/100',
          focal_len: 50,
          timestamp: Date.now() / 1000,
          width: 100,
          height: 100,
        })),
        dispose: vi.fn(),
      })),
      getVersion: vi.fn(() => '0.21.0'),
      getCameraCount: vi.fn(() => 100),
      getCameraList: vi.fn(() => ['Test Camera']),
    },
  }
}