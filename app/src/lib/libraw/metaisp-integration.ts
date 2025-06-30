/**
 * MetaISP Integration for LibRaw
 * Bridges LibRaw and MetaISP for neural RAW processing
 */

export interface MetaISPMetadata {
  iso: number;
  exposure: number;
  aperture: number;
  focal_length: number;
  wb_coeffs: number[];
  camera_make: string;
  camera_model: string;
  device_id: number;
  raw_width: number;
  raw_height: number;
  width: number;
  height: number;
  black_level: number;
  maximum: number;
  cfa_pattern: string;
}

export interface BayerChannels {
  width: number;
  height: number;
  data: Float32Array;
}

export interface BilinearRGB {
  width: number;
  height: number;
  data: Float32Array;
}

export class LibRawMetaISPBridge {
  private librawInstance: any;
  
  constructor(librawInstance: any) {
    this.librawInstance = librawInstance;
  }
  
  /**
   * Check if the loaded RAW file is compatible with MetaISP
   */
  async isMetaISPCompatible(): Promise<boolean> {
    try {
      const metadata = await this.getMetaISPMetadata();
      return metadata.cfa_pattern === 'RGGB';
    } catch {
      return false;
    }
  }
  
  /**
   * Get Bayer channels for MetaISP (4 channels: R, G1, G2, B)
   */
  async getBayerChannels(): Promise<BayerChannels | null> {
    try {
      const result = this.librawInstance.getBayerChannelsForMetaISP();
      if (!result) {
        console.error('Failed to get Bayer channels for MetaISP');
        return null;
      }
      
      return {
        width: result.width,
        height: result.height,
        data: result.data
      };
    } catch (error) {
      console.error('Error getting Bayer channels:', error);
      return null;
    }
  }
  
  /**
   * Get metadata for MetaISP processing
   */
  async getMetaISPMetadata(): Promise<MetaISPMetadata> {
    const metadata = this.librawInstance.getMetaISPMetadata();
    if (!metadata) {
      throw new Error('Failed to get MetaISP metadata');
    }
    
    return metadata;
  }
  
  /**
   * Get bilinear interpolated RGB for MetaISP (raw_full input)
   */
  async getBilinearRGB(): Promise<BilinearRGB | null> {
    try {
      const result = this.librawInstance.getBilinearRGB();
      if (!result) {
        console.error('Failed to get bilinear RGB');
        return null;
      }
      
      return {
        width: result.width,
        height: result.height,
        data: result.data
      };
    } catch (error) {
      console.error('Error getting bilinear RGB:', error);
      return null;
    }
  }
  
  /**
   * Prepare all data needed for MetaISP processing
   */
  async prepareForMetaISP(): Promise<{
    bayerChannels: BayerChannels;
    bilinearRGB: BilinearRGB;
    metadata: MetaISPMetadata;
  } | null> {
    try {
      // Get all required data
      const [bayerChannels, bilinearRGB, metadata] = await Promise.all([
        this.getBayerChannels(),
        this.getBilinearRGB(),
        this.getMetaISPMetadata()
      ]);
      
      if (!bayerChannels || !bilinearRGB) {
        console.error('Failed to prepare data for MetaISP');
        return null;
      }
      
      return {
        bayerChannels,
        bilinearRGB,
        metadata
      };
    } catch (error) {
      console.error('Error preparing MetaISP data:', error);
      return null;
    }
  }
  
  /**
   * Create MetaISP input tensors from prepared data
   */
  createMetaISPInputs(data: {
    bayerChannels: BayerChannels;
    bilinearRGB: BilinearRGB;
    metadata: MetaISPMetadata;
  }, targetDevice?: 'iphone' | 'samsung' | 'pixel'): {
    raw: Float32Array;
    raw_full: Float32Array;
    wb: Float32Array;
    device: Int32Array;
    iso: Float32Array;
    exp: Float32Array;
    dimensions: { width: number; height: number };
  } {
    const { bayerChannels, bilinearRGB, metadata } = data;
    
    // 4-channel Bayer data
    const raw = bayerChannels.data;
    
    // 3-channel bilinear RGB
    const raw_full = bilinearRGB.data;
    
    // White balance coefficients (normalized)
    const wb = new Float32Array(4);
    const wbSum = metadata.wb_coeffs.reduce((a, b) => a + b, 0) / 4;
    for (let i = 0; i < 4; i++) {
      wb[i] = metadata.wb_coeffs[i] / wbSum;
    }
    
    // Device ID
    let deviceId = metadata.device_id;
    if (targetDevice) {
      const deviceMap = { iphone: 2, samsung: 1, pixel: 0 };
      deviceId = deviceMap[targetDevice];
    }
    const device = new Int32Array([deviceId >= 0 ? deviceId : 0]);
    
    // ISO value (normalized to typical range)
    const iso = new Float32Array([metadata.iso / 1000.0]);
    
    // Exposure time (log scale)
    const exp = new Float32Array([Math.log2(Math.max(metadata.exposure, 0.001))]);
    
    return {
      raw,
      raw_full,
      wb,
      device,
      iso,
      exp,
      dimensions: {
        width: bilinearRGB.width,
        height: bilinearRGB.height
      }
    };
  }
  
  /**
   * Get device recommendation based on camera model
   */
  getRecommendedDevice(): 'iphone' | 'samsung' | 'pixel' | null {
    try {
      const metadata = this.librawInstance.getMetaISPMetadata();
      if (!metadata) return null;
      
      switch (metadata.device_id) {
        case 0: return 'pixel';
        case 1: return 'samsung';
        case 2: return 'iphone';
        default: return null;
      }
    } catch {
      return null;
    }
  }
}