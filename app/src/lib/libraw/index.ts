import { LibRawProcessor, ProcessParams, ProcessedImage, PhotoMetadata, ThumbnailData, ChannelData, BayerData } from "@/lib/types"
import { loadLibRawModule } from "./libraw-loader"

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
  unpack(): boolean
  process(): any
  getImageData(): any
  getMetadata(): any
  getThumbnail(): any
  
  // Processing parameters
  setUseCameraWB(value: number): void
  setUseAutoWB(value: number): void
  setOutputColor(value: number): void
  setBrightness(value: number): void
  setQuality(value: number): void
  setHalfSize(value: number): void
  
  // Extended parameters
  setHighlight(mode: number): void
  setGamma(g1: number, g2: number): void
  setNoiseThreshold(threshold: number): void
  setMedianPasses(passes: number): void
  setExposure(shift: number, preserve: number): void
  setAutoBright(enabled: boolean, threshold: number): void
  setCustomWB(r: number, g1: number, g2: number, b: number): void
  setFourColorRGB(enabled: boolean): void
  setDCBIterations(iterations: number): void
  setDCBEnhance(enabled: boolean): void
  setOutputBPS(bps: number): void
  setUserBlack(level: number): void
  setAberrationCorrection(r: number, b: number): void
  setSaturation?(saturation: number): void
  setVibrance?(vibrance: number): void
  
  // Advanced methods (optional for backward compatibility)
  setShotSelect?(shot: number): void
  setCropArea?(x1: number, y1: number, x2: number, y2: number): void
  setGreyBox?(x1: number, y1: number, x2: number, y2: number): void
  setUserFlip?(flip: number): void
  setNoAutoBright?(disable: boolean): void
  setOutputTiff?(tiff: boolean): void
  get4ChannelData?(): any
  getRawBayerData?(): any
  
  // Debug
  setDebugMode(value: boolean): void
  getDebugMode(): boolean
  getLastError(): string
  getProcessingInfo(): any
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
      console.log("Initializing LibRaw WASM module...")
      
      // Load the LibRaw module using the loader
      this.module = await loadLibRawModule()
      
      console.log("LibRaw WASM initialized successfully")
      console.log("LibRaw version:", this.module.LibRaw.getVersion())
      console.log("Supported cameras:", this.module.LibRaw.getCameraCount())
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
      this.instance = null
    }
    
    this.instance = new this.module.LibRaw()
    
    // Enable debug mode only in development
    if (typeof this.instance.setDebugMode === 'function') {
      this.instance.setDebugMode(process.env.NODE_ENV === 'development')
    }
    
    // Convert ArrayBuffer to Uint8Array
    const uint8Array = new Uint8Array(buffer)
    
    // Load the RAW file
    const loadSuccess = this.instance.loadFromUint8Array(uint8Array)
    if (!loadSuccess) {
      throw new Error("Failed to load RAW file")
    }
    
    // Unpack the RAW data
    const unpackSuccess = this.instance.unpack()
    if (!unpackSuccess) {
      throw new Error("Failed to unpack RAW file")
    }
    
    this.loaded = true
  }

  async process(params: ProcessParams): Promise<ProcessedImage> {
    if (!this.instance || !this.loaded) {
      throw new Error("No file loaded")
    }

    // Set basic processing parameters
    this.instance.setUseCameraWB(params.useCameraWB ? 1 : 0)
    this.instance.setUseAutoWB(params.useAutoWB ? 1 : 0)
    this.instance.setOutputColor(params.outputColor ?? 1) // Default to sRGB
    this.instance.setBrightness(params.brightness ?? 1.0)
    this.instance.setQuality(params.quality ?? 3) // Default to AHD
    this.instance.setHalfSize(params.halfSize ? 1 : 0)
    
    // Set extended parameters if provided
    if (params.highlight !== undefined) {
      this.instance.setHighlight(params.highlight)
    }
    
    if (params.gamma) {
      this.instance.setGamma(params.gamma[0], params.gamma[1])
    }
    
    if (params.noiseThreshold !== undefined) {
      this.instance.setNoiseThreshold(params.noiseThreshold)
    }
    
    if (params.medianPasses !== undefined) {
      this.instance.setMedianPasses(params.medianPasses)
    }
    
    if (params.exposure) {
      this.instance.setExposure(params.exposure.shift, params.exposure.preserve)
    }
    
    if (params.autoBright) {
      this.instance.setAutoBright(params.autoBright.enabled, params.autoBright.threshold)
    }
    
    if (params.customWB) {
      this.instance.setCustomWB(
        params.customWB.r,
        params.customWB.g1,
        params.customWB.g2,
        params.customWB.b
      )
    }
    
    if (params.fourColorRGB !== undefined) {
      this.instance.setFourColorRGB(params.fourColorRGB)
    }
    
    if (params.dcbIterations !== undefined) {
      this.instance.setDCBIterations(params.dcbIterations)
    }
    
    if (params.dcbEnhance !== undefined) {
      this.instance.setDCBEnhance(params.dcbEnhance)
    }
    
    if (params.outputBPS !== undefined) {
      this.instance.setOutputBPS(params.outputBPS)
    }
    
    if (params.userBlack !== undefined) {
      this.instance.setUserBlack(params.userBlack)
    }
    
    if (params.aberrationCorrection) {
      this.instance.setAberrationCorrection(
        params.aberrationCorrection.r,
        params.aberrationCorrection.b
      )
    }
    
    // Set advanced parameters if provided
    if (params.shotSelect !== undefined && typeof this.instance.setShotSelect === 'function') {
      this.instance.setShotSelect(params.shotSelect)
    }
    
    if (params.cropArea && typeof this.instance.setCropArea === 'function') {
      this.instance.setCropArea(
        params.cropArea.x1,
        params.cropArea.y1,
        params.cropArea.x2,
        params.cropArea.y2
      )
    }
    
    if (params.greyBox && typeof this.instance.setGreyBox === 'function') {
      this.instance.setGreyBox(
        params.greyBox.x1,
        params.greyBox.y1,
        params.greyBox.x2,
        params.greyBox.y2
      )
    }
    
    if (params.userFlip !== undefined && typeof this.instance.setUserFlip === 'function') {
      this.instance.setUserFlip(params.userFlip)
    }
    
    if (params.noAutoBright !== undefined && typeof this.instance.setNoAutoBright === 'function') {
      this.instance.setNoAutoBright(params.noAutoBright)
    }
    
    if (params.outputTiff !== undefined && typeof this.instance.setOutputTiff === 'function') {
      this.instance.setOutputTiff(params.outputTiff)
    }
    
    // Color adjustments
    if (params.saturation !== undefined && typeof this.instance.setSaturation === 'function') {
      this.instance.setSaturation(params.saturation)
    }
    
    if (params.vibrance !== undefined && typeof this.instance.setVibrance === 'function') {
      this.instance.setVibrance(params.vibrance)
    }

    // Process the image
    const processSuccess = this.instance.process()
    if (!processSuccess) {
      const error = this.instance.getLastError ? this.instance.getLastError() : "Unknown error"
      throw new Error(`Failed to process RAW file: ${error}`)
    }

    // Get processed image data
    const imageData = this.instance.getImageData()
    if (!imageData || !imageData.data) {
      throw new Error("Failed to get image data")
    }
    
    const width = imageData.width
    const height = imageData.height
    const colors = imageData.colors || 3
    
    // LibRaw returns RGB data, but ImageData needs RGBA
    let data: Uint8ClampedArray
    
    if (colors === 3) {
      // Convert RGB to RGBA by adding alpha channel
      const rgbData = new Uint8ClampedArray(imageData.data)
      const rgbaData = new Uint8ClampedArray(width * height * 4)
      
      for (let i = 0; i < width * height; i++) {
        rgbaData[i * 4] = rgbData[i * 3]       // R
        rgbaData[i * 4 + 1] = rgbData[i * 3 + 1] // G
        rgbaData[i * 4 + 2] = rgbData[i * 3 + 2] // B
        rgbaData[i * 4 + 3] = 255                // A (fully opaque)
      }
      
      data = rgbaData
    } else if (colors === 4) {
      // Already RGBA
      data = new Uint8ClampedArray(imageData.data)
    } else {
      throw new Error(`Unsupported color format: ${colors} colors`)
    }
    
    return {
      data,
      width,
      height,
      metadata: this.getMetadata(),
    }
  }

  getMetadata(): PhotoMetadata {
    if (!this.instance || !this.loaded) {
      throw new Error("No file loaded")
    }

    const meta = this.instance.getMetadata()
    if (!meta) {
      throw new Error("No metadata available")
    }
    
    return {
      camera: `${meta.make || 'Unknown'} ${meta.model || 'Unknown'}`,
      lens: meta.lens || "Unknown",
      iso: meta.iso || 0,
      aperture: meta.aperture || 0,
      shutterSpeed: meta.shutter ? `${meta.shutter}s` : "Unknown",
      focalLength: meta.focalLength || 0,
      date: meta.timestamp ? new Date(meta.timestamp * 1000) : new Date(),
      width: meta.width || 0,
      height: meta.height || 0,
    }
  }

  getThumbnail(): ThumbnailData | null {
    if (!this.instance || !this.loaded) {
      return null
    }

    try {
      if (typeof this.instance.getThumbnail !== 'function') {
        return null
      }
      const thumbnailData = this.instance.getThumbnail()
      if (!thumbnailData) return null

      return {
        format: thumbnailData.format,
        width: thumbnailData.width,
        height: thumbnailData.height,
        data: new Uint8Array(thumbnailData.data)
      }
    } catch (error) {
      console.error('Failed to get thumbnail:', error)
      return null
    }
  }

  get4ChannelData(): ChannelData | null {
    if (!this.instance || !this.loaded) {
      return null
    }

    try {
      if (typeof this.instance.get4ChannelData !== 'function') {
        return null
      }
      const channelData = this.instance.get4ChannelData()
      if (!channelData) return null

      return {
        width: channelData.width,
        height: channelData.height,
        colors: channelData.colors,
        channels: channelData.channels.map((ch: any) => new Uint16Array(ch))
      }
    } catch (error) {
      console.error('Failed to get 4-channel data:', error)
      return null
    }
  }

  getRawBayerData(): BayerData | null {
    if (!this.instance || !this.loaded) {
      return null
    }

    try {
      if (typeof this.instance.getRawBayerData !== 'function') {
        return null
      }
      const bayerData = this.instance.getRawBayerData()
      if (!bayerData) return null

      return {
        width: bayerData.width,
        height: bayerData.height,
        filters: bayerData.filters,
        data: new Uint16Array(bayerData.data)
      }
    } catch (error) {
      console.error('Failed to get RAW Bayer data:', error)
      return null
    }
  }

  dispose(): void {
    if (this.instance) {
      // LibRaw WASM doesn't have a dispose method, the destructor is called automatically
      this.instance = null
    }
    this.loaded = false
  }

  // Static utility methods
  static getVersion(): string {
    return "0.21.0" // LibRaw version
  }
}