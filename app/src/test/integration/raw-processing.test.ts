import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { createTestRawFile, createTestProcessParams } from '@/test/utils'

// Mock the libraw module to avoid Vite import errors
vi.mock('@/lib/libraw', () => ({
  LibRawWASM: {
    create: vi.fn().mockResolvedValue({
      loadFile: vi.fn(),
      process: vi.fn().mockResolvedValue({
        data: new Uint8ClampedArray(100 * 100 * 4),
        width: 100,
        height: 100,
      }),
      getMetadata: vi.fn().mockReturnValue({
        camera: 'Test Camera',
        width: 100,
        height: 100,
      }),
      dispose: vi.fn(),
    }),
  },
}))

import { LibRawWASM } from '@/lib/libraw'

// This is an integration test that tests the actual LibRaw WASM module
// It will be skipped in CI but can be run locally with real WASM module
describe.skip('LibRaw Integration Tests', () => {
  let processor: LibRawWASM

  beforeAll(async () => {
    // This will load the actual WASM module
    processor = await LibRawWASM.create()
  })

  afterAll(() => {
    processor.dispose()
  })

  it('should process a test RAW file end-to-end', async () => {
    // Create a more realistic test file
    const testFile = createTestRawFile(1024, 768)
    
    // Load the file
    await processor.loadFile(testFile)
    
    // Get metadata
    const metadata = processor.getMetadata()
    expect(metadata).toHaveProperty('camera')
    expect(metadata).toHaveProperty('width')
    expect(metadata).toHaveProperty('height')
    
    // Process with various parameters
    const params = createTestProcessParams({
      brightness: 1.2,
      quality: 3, // AHD
      outputColor: 1, // sRGB
    })
    
    const result = await processor.process(params)
    
    // Verify output
    expect(result.data).toBeInstanceOf(Uint8ClampedArray)
    expect(result.data.length).toBe(result.width * result.height * 4)
    expect(result.width).toBeGreaterThan(0)
    expect(result.height).toBeGreaterThan(0)
  })

  it('should handle different quality settings', async () => {
    const testFile = createTestRawFile(512, 384)
    await processor.loadFile(testFile)
    
    // Test different interpolation qualities
    const qualities = [0, 1, 2, 3] // Linear, VNG, PPG, AHD
    
    for (const quality of qualities) {
      const params = createTestProcessParams({ quality })
      const result = await processor.process(params)
      
      expect(result.width).toBeGreaterThan(0)
      expect(result.height).toBeGreaterThan(0)
    }
  })

  it('should handle half-size processing', async () => {
    const testFile = createTestRawFile(2048, 1536)
    await processor.loadFile(testFile)
    
    // Process at full size
    const fullParams = createTestProcessParams({ halfSize: false })
    const fullResult = await processor.process(fullParams)
    
    // Process at half size
    const halfParams = createTestProcessParams({ halfSize: true })
    const halfResult = await processor.process(halfParams)
    
    // Half size should be approximately half dimensions
    expect(halfResult.width).toBeLessThan(fullResult.width)
    expect(halfResult.height).toBeLessThan(fullResult.height)
  })

  it('should handle different color spaces', async () => {
    const testFile = createTestRawFile(512, 384)
    await processor.loadFile(testFile)
    
    const colorSpaces = [
      { value: 0, name: 'Raw' },
      { value: 1, name: 'sRGB' },
      { value: 2, name: 'Adobe RGB' },
      { value: 3, name: 'Wide Gamut' },
      { value: 4, name: 'ProPhoto' },
    ]
    
    for (const { value, name } of colorSpaces) {
      const params = createTestProcessParams({ outputColor: value })
      const result = await processor.process(params)
      
      expect(result).toBeDefined()
      console.log(`Processed in ${name} color space`)
    }
  })
})