import { LibRawProcessor, ProcessParams, ProcessedImage, PhotoMetadata } from "@/lib/types"

// LibRaw WASM module interface
interface LibRawModule {
  LibRaw: {
    new(): LibRawInstance
    getVersion(): string
    getCameraCount(): number
    getCameraList(): string[]
  }
}

interface LibRawInstance {
  loadFromUint8Array(data: Uint8Array): boolean
  process(params: any): boolean
  getImageData(): {
    data: Uint8Array
    width: number
    height: number
  }
  getMetadata(): any
  dispose(): void
}

// Dynamic import wrapper for LibRaw WASM
export class LibRawWASM implements LibRawProcessor {
  private module: LibRawModule | null = null
  private instance: LibRawInstance | null = null
  private loaded = false

  static async create(): Promise<LibRawWASM> {
    const processor = new LibRawWASM()
    await processor.init()
    return processor
  }

  private async init(): Promise<void> {
    try {
      // Dynamically import the LibRaw ES6 module
      const LibRawModule = await import("/wasm/libraw.js")
      this.module = await LibRawModule.default()
    } catch (error) {
      console.error("Failed to load LibRaw WASM module:", error)
      throw new Error("Failed to initialize LibRaw")
    }
  }

  async loadFile(buffer: ArrayBuffer): Promise<void> {
    if (!this.module) {
      throw new Error("LibRaw not initialized")
    }

    // Create new instance for each file
    if (this.instance) {
      this.instance.dispose()
    }
    
    this.instance = new this.module.LibRaw()
    
    // Convert ArrayBuffer to Uint8Array
    const uint8Array = new Uint8Array(buffer)
    
    // Load the RAW file
    const success = this.instance.loadFromUint8Array(uint8Array)
    if (!success) {
      throw new Error("Failed to load RAW file")
    }
    
    this.loaded = true
  }

  async process(params: ProcessParams): Promise<ProcessedImage> {
    if (!this.instance || !this.loaded) {
      throw new Error("No file loaded")
    }

    // Map our params to LibRaw params
    const librawParams = {
      use_camera_wb: params.useCameraWB ? 1 : 0,
      use_auto_wb: params.useAutoWB ? 1 : 0,
      output_color: params.outputColor ?? 1, // Default to sRGB
      bright: params.brightness ?? 1.0,
      user_qual: params.quality ?? 3, // Default to AHD
      half_size: params.halfSize ? 1 : 0,
      gamm: params.gamm || [2.2, 4.5], // Default gamma
    }

    // Process the image
    const success = this.instance.process(librawParams)
    if (!success) {
      throw new Error("Failed to process RAW file")
    }

    // Get processed image data
    const imageData = this.instance.getImageData()
    if (!imageData) {
      throw new Error("Failed to get image data")
    }

    // Convert to ImageData format
    const data = new Uint8ClampedArray(imageData.data)
    
    return {
      data,
      width: imageData.width,
      height: imageData.height,
      metadata: this.getMetadata(),
    }
  }

  getMetadata(): PhotoMetadata {
    if (!this.instance || !this.loaded) {
      throw new Error("No file loaded")
    }

    const meta = this.instance.getMetadata()
    
    return {
      camera: `${meta.make} ${meta.model}`,
      lens: meta.lens || "Unknown",
      iso: meta.iso_speed,
      aperture: meta.aperture,
      shutterSpeed: meta.shutter,
      focalLength: meta.focal_len,
      date: new Date(meta.timestamp * 1000),
      width: meta.width,
      height: meta.height,
    }
  }

  dispose(): void {
    if (this.instance) {
      this.instance.dispose()
      this.instance = null
    }
    this.loaded = false
  }

  // Static utility methods
  static getVersion(): string {
    return "0.21.0" // LibRaw version
  }
}