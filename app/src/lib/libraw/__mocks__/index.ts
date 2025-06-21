import { LibRawProcessor, ProcessParams, ProcessedImage, PhotoMetadata } from "@/lib/types"
import { vi } from "vitest"

export class LibRawWASM implements LibRawProcessor {
  private loaded = false
  
  static async create(): Promise<LibRawWASM> {
    return new LibRawWASM()
  }
  
  async loadFile(buffer: ArrayBuffer): Promise<void> {
    this.loaded = true
  }
  
  async process(params: ProcessParams): Promise<ProcessedImage> {
    if (!this.loaded) {
      throw new Error("No file loaded")
    }
    
    return {
      data: new Uint8ClampedArray(100 * 100 * 4),
      width: 100,
      height: 100,
      metadata: this.getMetadata(),
    }
  }
  
  getMetadata(): PhotoMetadata {
    if (!this.loaded) {
      throw new Error("No file loaded")
    }
    
    return {
      camera: "Test Camera",
      lens: "Test Lens",
      iso: 100,
      aperture: 2.8,
      shutterSpeed: "1/100",
      focalLength: 50,
      date: new Date(),
      width: 100,
      height: 100,
    }
  }
  
  dispose(): void {
    this.loaded = false
  }
  
  static getVersion(): string {
    return "0.21.0"
  }
}