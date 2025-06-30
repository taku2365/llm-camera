/**
 * MetaISP Processor
 * Handles neural ISP processing using ONNX Runtime WebGPU
 */

import * as ort from 'onnxruntime-web';

export interface MetaISPConfig {
  modelPath: string;
  executionProvider?: 'webgpu' | 'wasm';
  enableProgress?: boolean;
}

export interface ProcessingProgress {
  stage: 'loading' | 'preparing' | 'processing' | 'finalizing';
  progress: number;
  message: string;
}

export class MetaISPProcessor {
  private session: ort.InferenceSession | null = null;
  private config: MetaISPConfig;
  private progressCallback?: (progress: ProcessingProgress) => void;
  
  constructor(config: MetaISPConfig) {
    this.config = config;
  }
  
  /**
   * Initialize the MetaISP model
   */
  async initialize(onProgress?: (progress: ProcessingProgress) => void): Promise<void> {
    this.progressCallback = onProgress;
    
    this.reportProgress('loading', 0, 'Loading MetaISP model...');
    
    try {
      // Configure ONNX Runtime
      ort.env.wasm.wasmPaths = '/wasm/';
      
      // Try WebGPU first if requested
      const executionProviders: ort.InferenceSession.ExecutionProviderConfig[] = [];
      
      if (this.config.executionProvider === 'webgpu' && 'gpu' in navigator) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          if (adapter) {
            executionProviders.push({
              name: 'webgpu',
              preferredLayout: 'NHWC'
            });
            console.log('WebGPU provider configured');
          }
        } catch (e) {
          console.warn('WebGPU not available:', e);
        }
      }
      
      // Always add WASM as fallback
      executionProviders.push({
        name: 'wasm',
        wasmPaths: '/wasm/'
      });
      
      this.reportProgress('loading', 50, 'Creating inference session...');
      
      // Create session
      this.session = await ort.InferenceSession.create(
        this.config.modelPath,
        {
          executionProviders,
          graphOptimizationLevel: 'all',
          enableCpuMemArena: true,
          enableMemPattern: true
        }
      );
      
      this.reportProgress('loading', 100, 'Model loaded successfully');
      
      // Log session info
      console.log('MetaISP model loaded:', {
        inputs: this.session.inputNames,
        outputs: this.session.outputNames,
        provider: this.session.handler._executionProviders?.[0] || 'Unknown'
      });
      
    } catch (error) {
      console.error('Failed to initialize MetaISP:', error);
      throw new Error(`Failed to initialize MetaISP: ${error}`);
    }
  }
  
  /**
   * Process RAW data through MetaISP
   */
  async process(inputs: {
    raw: Float32Array;
    raw_full: Float32Array;
    wb: Float32Array;
    device: Int32Array;
    iso: Float32Array;
    exp: Float32Array;
    dimensions: { 
      rawWidth: number; 
      rawHeight: number; 
      fullWidth: number; 
      fullHeight: number; 
    };
  }): Promise<ImageData> {
    if (!this.session) {
      throw new Error('MetaISP not initialized');
    }
    
    this.reportProgress('preparing', 0, 'Preparing input tensors...');
    
    try {
      const { rawWidth, rawHeight, fullWidth, fullHeight } = inputs.dimensions;
      
      // Create input tensors
      const feeds: Record<string, ort.Tensor> = {
        raw: new ort.Tensor('float32', inputs.raw, [1, 4, rawHeight, rawWidth]),
        raw_full: new ort.Tensor('float32', inputs.raw_full, [1, 3, fullHeight, fullWidth]),
        wb: new ort.Tensor('float32', inputs.wb, [1, 4]),
        device: new ort.Tensor('int32', inputs.device, [1]),
        iso: new ort.Tensor('float32', inputs.iso, [1]),
        exp: new ort.Tensor('float32', inputs.exp, [1])
      };
      
      this.reportProgress('processing', 0, 'Running neural ISP processing...');
      
      // Run inference
      const startTime = performance.now();
      const results = await this.session.run(feeds);
      const inferenceTime = performance.now() - startTime;
      
      console.log(`MetaISP inference completed in ${inferenceTime.toFixed(2)}ms`);
      
      this.reportProgress('finalizing', 0, 'Converting output to image...');
      
      // Get output tensor
      const outputName = this.session.outputNames[0];
      const output = results[outputName] as ort.Tensor;
      
      // Convert to ImageData
      const imageData = this.tensorToImageData(
        output.data as Float32Array,
        output.dims as number[],
        fullWidth,
        fullHeight
      );
      
      this.reportProgress('finalizing', 100, 'Processing complete');
      
      return imageData;
      
    } catch (error) {
      console.error('MetaISP processing failed:', error);
      throw new Error(`Processing failed: ${error}`);
    }
  }
  
  /**
   * Process with tiling for large images
   */
  async processTiled(
    inputs: any,
    tileSize: number = 512,
    overlap: number = 64
  ): Promise<ImageData> {
    // TODO: Implement tiled processing for large images
    throw new Error('Tiled processing not yet implemented');
  }
  
  /**
   * Convert tensor output to ImageData
   */
  private tensorToImageData(
    tensor: Float32Array,
    dims: number[],
    expectedWidth: number,
    expectedHeight: number
  ): ImageData {
    const [batch, channels, height, width] = dims;
    
    if (batch !== 1 || channels !== 3) {
      throw new Error(`Unexpected output dimensions: ${dims}`);
    }
    
    // Handle dimension mismatch
    let finalWidth = width;
    let finalHeight = height;
    let needsResize = false;
    
    if (width !== expectedWidth || height !== expectedHeight) {
      console.warn(`Output size mismatch. Expected: ${expectedWidth}x${expectedHeight}, got: ${width}x${height}`);
      needsResize = true;
    }
    
    // Convert CHW to HWC and normalize
    const imageData = new ImageData(expectedWidth, expectedHeight);
    const data = imageData.data;
    
    for (let y = 0; y < expectedHeight; y++) {
      for (let x = 0; x < expectedWidth; x++) {
        let srcX = x;
        let srcY = y;
        
        // Simple nearest neighbor resize if needed
        if (needsResize) {
          srcX = Math.floor(x * width / expectedWidth);
          srcY = Math.floor(y * height / expectedHeight);
        }
        
        const dstIdx = (y * expectedWidth + x) * 4;
        const srcIdx = srcY * width + srcX;
        
        // Assuming tensor is in CHW format
        const r = tensor[0 * height * width + srcIdx];
        const g = tensor[1 * height * width + srcIdx];
        const b = tensor[2 * height * width + srcIdx];
        
        // Clamp and convert to uint8
        data[dstIdx + 0] = Math.max(0, Math.min(255, Math.round(r * 255)));
        data[dstIdx + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
        data[dstIdx + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
        data[dstIdx + 3] = 255;
      }
    }
    
    return imageData;
  }
  
  /**
   * Report progress
   */
  private reportProgress(stage: ProcessingProgress['stage'], progress: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, message });
    }
  }
  
  /**
   * Get model information
   */
  getModelInfo(): {
    inputs: string[];
    outputs: string[];
    executionProvider: string;
  } | null {
    if (!this.session) return null;
    
    return {
      inputs: this.session.inputNames,
      outputs: this.session.outputNames,
      executionProvider: this.session.handler._executionProviders?.[0] || 'Unknown'
    };
  }
  
  /**
   * Cleanup resources
   */
  dispose() {
    if (this.session) {
      // ONNX Runtime Web doesn't have explicit dispose yet
      this.session = null;
    }
  }
}