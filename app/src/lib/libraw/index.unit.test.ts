import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTestRawFile, createTestProcessParams } from '@/test/utils'

// Use the mock
vi.mock('./index')

// Import after mock
import { LibRawWASM } from './index'

describe('LibRawWASM Unit Tests', () => {
  let processor: LibRawWASM

  beforeEach(async () => {
    processor = await LibRawWASM.create()
  })

  afterEach(() => {
    processor.dispose()
  })

  describe('initialization', () => {
    it('should create instance successfully', () => {
      expect(processor).toBeInstanceOf(LibRawWASM)
    })

    it('should get version', () => {
      expect(LibRawWASM.getVersion()).toBe('0.21.0')
    })
  })

  describe('loadFile', () => {
    it('should load RAW file successfully', async () => {
      const testFile = createTestRawFile()
      await expect(processor.loadFile(testFile)).resolves.not.toThrow()
    })
  })

  describe('process', () => {
    it('should process loaded file with default parameters', async () => {
      const testFile = createTestRawFile()
      await processor.loadFile(testFile)
      
      const params = createTestProcessParams()
      const result = await processor.process(params)
      
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('width', 100)
      expect(result).toHaveProperty('height', 100)
      expect(result).toHaveProperty('metadata')
    })

    it('should throw error if no file loaded', async () => {
      const params = createTestProcessParams()
      await expect(processor.process(params)).rejects.toThrow('No file loaded')
    })
  })

  describe('getMetadata', () => {
    it('should return metadata after loading file', async () => {
      const testFile = createTestRawFile()
      await processor.loadFile(testFile)
      
      const metadata = processor.getMetadata()
      expect(metadata).toHaveProperty('camera')
      expect(metadata).toHaveProperty('iso', 100)
      expect(metadata).toHaveProperty('aperture', 2.8)
      expect(metadata).toHaveProperty('shutterSpeed', '1/100')
    })

    it('should throw error if no file loaded', () => {
      expect(() => processor.getMetadata()).toThrow('No file loaded')
    })
  })

  describe('dispose', () => {
    it('should clean up resources', async () => {
      const testFile = createTestRawFile()
      await processor.loadFile(testFile)
      
      processor.dispose()
      
      // Should throw error after disposal
      await expect(processor.process(createTestProcessParams())).rejects.toThrow('No file loaded')
    })
  })
})