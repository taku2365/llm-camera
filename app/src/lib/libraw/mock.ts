import { LibRawProcessor, ProcessParams, ProcessedImage, PhotoMetadata } from "@/lib/types"

// Mock implementation for development/testing
export class LibRawMock implements LibRawProcessor {
  private mockBuffer: ArrayBuffer | null = null
  private mockMetadata: PhotoMetadata = {
    camera: "Mock Camera",
    lens: "Mock Lens 50mm",
    iso: 100,
    aperture: 2.8,
    shutterSpeed: "1/100",
    focalLength: 50,
    date: new Date(),
    width: 800,
    height: 600,
  }

  static async create(): Promise<LibRawMock> {
    return new LibRawMock()
  }

  async loadFile(buffer: ArrayBuffer): Promise<void> {
    this.mockBuffer = buffer
    // Simulate async loading
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  async process(params: ProcessParams): Promise<ProcessedImage> {
    if (!this.mockBuffer) {
      throw new Error("No file loaded")
    }

    // Create a mock processed image (gradient pattern)
    const width = 800
    const height = 600
    const data = new Uint8ClampedArray(width * height * 4)
    
    // Create a simple gradient pattern
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        
        // Apply brightness adjustment
        const brightness = params.brightness || 1.0
        
        // Create gradient based on position
        const r = Math.min(255, (x / width) * 255 * brightness)
        const g = Math.min(255, (y / height) * 255 * brightness)
        const b = Math.min(255, ((x + y) / (width + height)) * 255 * brightness)
        
        data[i] = r
        data[i + 1] = g
        data[i + 2] = b
        data[i + 3] = 255 // Alpha
      }
    }
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return {
      data,
      width,
      height,
      metadata: this.mockMetadata,
    }
  }

  getMetadata(): PhotoMetadata {
    return this.mockMetadata
  }

  dispose(): void {
    this.mockBuffer = null
  }
}