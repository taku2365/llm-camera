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
  useCameraWB?: boolean
  useAutoWB?: boolean
  outputColor?: number      // 0=raw, 1=sRGB, 2=Adobe, 3=Wide, 4=ProPhoto, 5=XYZ
  brightness?: number       // 0.5-2.0
  quality?: number         // 0-11 (interpolation quality)
  halfSize?: boolean       // Process at half resolution
  gamm?: [number, number]  // Gamma curve [gamma, toe]
}

// LibRaw processor interface
export interface LibRawProcessor {
  loadFile(buffer: ArrayBuffer): Promise<void>
  process(params: ProcessParams): Promise<ProcessedImage>
  getMetadata(): PhotoMetadata
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