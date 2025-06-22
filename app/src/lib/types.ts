// Edit parameters for RAW processing
export interface EditParams {
  // Basic adjustments
  exposure: number      // -5 to +5
  contrast: number      // -100 to +100
  highlights: number    // -100 to +100
  shadows: number       // -100 to +100
  whites: number        // -100 to +100
  blacks: number        // -100 to +100
  
  // Color adjustments
  temperature: number   // -100 to +100 (maps to Kelvin)
  tint: number         // -100 to +100
  vibrance: number     // -100 to +100
  saturation: number   // -100 to +100
  
  // Advanced settings
  cropEnabled?: boolean
  cropArea?: { x1: number; y1: number; x2: number; y2: number }
  userFlip?: number // 0=none, 3=180, 5=90CCW, 6=90CW
  shotSelect?: number
  noiseThreshold?: number
  medianPasses?: number
  dcbIterations?: number
  dcbEnhance?: boolean
  outputBPS?: number // 8 or 16 bits per sample
}

// Extended edit parameters for future features
export interface ExtendedEditParams extends EditParams {
  // Tone curve
  toneCurve?: CurvePoint[]
  
  // HSL adjustments
  hsl?: {
    hue: number[]        // 8 color ranges
    saturation: number[] // 8 color ranges
    luminance: number[]  // 8 color ranges
  }
  
  // Split toning
  splitToning?: {
    highlightHue: number
    highlightSaturation: number
    shadowHue: number
    shadowSaturation: number
    balance: number
  }
}

export interface CurvePoint {
  x: number
  y: number
}

// Photo metadata
export interface PhotoMetadata {
  camera: string
  lens: string
  iso: number
  aperture: number
  shutterSpeed: string
  focalLength: number
  date: Date
  width: number
  height: number
}

// Processed image data
export interface ProcessedImage {
  data: Uint8ClampedArray
  width: number
  height: number
  metadata: PhotoMetadata
}

// Photo in library
export interface Photo {
  id: string
  filename: string
  rawUrl: string
  thumbnailUrl?: string
  previewUrl?: string
  metadata: PhotoMetadata
  createdAt: Date
  updatedAt: Date
}

// Processing options for LibRaw
export interface ProcessParams {
  // Basic parameters
  useCameraWB?: boolean
  useAutoWB?: boolean
  outputColor?: number      // 0=raw, 1=sRGB, 2=Adobe, 3=Wide, 4=ProPhoto, 5=XYZ
  brightness?: number       // 0.5-2.0
  quality?: number         // 0-11 (interpolation quality)
  halfSize?: boolean       // Process at half resolution
  
  // Extended parameters
  highlight?: number       // 0=clip, 1=unclip, 2=blend, 3-9=rebuild
  gamma?: [number, number] // Gamma curve [gamma, toe]
  noiseThreshold?: number  // Noise reduction threshold
  medianPasses?: number    // Median filter passes (0-10)
  exposure?: { shift: number; preserve: number } // Exposure correction
  autoBright?: { enabled: boolean; threshold: number } // Auto brightness
  customWB?: { r: number; g1: number; g2: number; b: number } // Custom white balance
  fourColorRGB?: boolean   // Use separate greens
  dcbIterations?: number   // DCB quality (1-10)
  dcbEnhance?: boolean     // DCB false color suppression
  outputBPS?: number       // Output bits per sample (8 or 16)
  userBlack?: number       // Manual black level
  aberrationCorrection?: { r: number; b: number } // Chromatic aberration
  
  // Advanced parameters (from LibRaw samples)
  shotSelect?: number      // Select specific shot from multi-shot files
  cropArea?: { x1: number; y1: number; x2: number; y2: number } // Crop area coordinates
  greyBox?: { x1: number; y1: number; x2: number; y2: number }  // White balance area
  userFlip?: number        // Rotation/flip: 0=none, 3=180, 5=90CCW, 6=90CW
  noAutoBright?: boolean   // Disable auto brightness
  outputTiff?: boolean     // Output TIFF instead of PPM
}

// 4-channel RAW data
export interface ChannelData {
  width: number
  height: number
  colors: number
  channels: Uint16Array[]
}

// RAW Bayer data
export interface BayerData {
  width: number
  height: number
  filters: number
  data: Uint16Array
}

// Thumbnail data
export interface ThumbnailData {
  format: string
  width: number
  height: number
  data: Uint8Array
}

// LibRaw processor interface
export interface LibRawProcessor {
  loadFile(buffer: ArrayBuffer): Promise<void>
  process(params: ProcessParams): Promise<ProcessedImage>
  getMetadata(): PhotoMetadata
  getThumbnail?(): ThumbnailData | null
  get4ChannelData?(): ChannelData | null
  getRawBayerData?(): BayerData | null
  dispose(): void
}

// Worker message types
export interface WorkerMessage {
  type: 'load' | 'process' | 'dispose'
  id: string
  data?: any
}

export interface WorkerResponse {
  type: 'loaded' | 'processed' | 'disposed' | 'error'
  id: string
  data?: any
  error?: string
}