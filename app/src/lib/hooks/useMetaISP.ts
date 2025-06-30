/**
 * useMetaISP Hook
 * React hook for MetaISP neural RAW processing
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { MetaISPProcessor, ProcessingProgress } from '@/lib/metaisp/metaisp-processor';
import { LibRawMetaISPBridge } from '@/lib/libraw/metaisp-integration';

export interface MetaISPOptions {
  targetDevice?: 'iphone' | 'samsung' | 'pixel' | 'auto';
  modelPath?: string;
  executionProvider?: 'webgpu' | 'wasm';
  onProgress?: (progress: ProcessingProgress) => void;
}

export interface MetaISPState {
  isInitialized: boolean;
  isProcessing: boolean;
  progress: ProcessingProgress | null;
  error: string | null;
  result: ImageData | null;
  modelInfo: any | null;
}

export function useMetaISP(options: MetaISPOptions = {}) {
  const [state, setState] = useState<MetaISPState>({
    isInitialized: false,
    isProcessing: false,
    progress: null,
    error: null,
    result: null,
    modelInfo: null
  });
  
  const processorRef = useRef<MetaISPProcessor | null>(null);
  const bridgeRef = useRef<LibRawMetaISPBridge | null>(null);
  
  // Initialize processor
  const initialize = useCallback(async () => {
    if (state.isInitialized) return;
    
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const processor = new MetaISPProcessor({
        modelPath: options.modelPath || '/models/metaisp.onnx',
        executionProvider: options.executionProvider || 'wasm'
      });
      
      await processor.initialize((progress) => {
        setState(prev => ({ ...prev, progress }));
        options.onProgress?.(progress);
      });
      
      processorRef.current = processor;
      
      const modelInfo = processor.getModelInfo();
      setState(prev => ({
        ...prev,
        isInitialized: true,
        modelInfo
      }));
      
      console.log('MetaISP initialized:', modelInfo);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize MetaISP';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isInitialized: false
      }));
      console.error('MetaISP initialization failed:', error);
    }
  }, [state.isInitialized, options.modelPath, options.executionProvider]);
  
  // Process RAW image
  const processRAW = useCallback(async (
    librawInstance: any,
    targetDevice?: 'iphone' | 'samsung' | 'pixel' | 'auto'
  ): Promise<ImageData | null> => {
    if (!processorRef.current) {
      await initialize();
      if (!processorRef.current) {
        throw new Error('Failed to initialize MetaISP');
      }
    }
    
    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      result: null
    }));
    
    try {
      // Create bridge
      const bridge = new LibRawMetaISPBridge(librawInstance);
      bridgeRef.current = bridge;
      
      // Check compatibility
      const isCompatible = await bridge.isMetaISPCompatible();
      if (!isCompatible) {
        throw new Error('RAW file is not compatible with MetaISP (requires RGGB pattern)');
      }
      
      // Prepare data
      setState(prev => ({
        ...prev,
        progress: { stage: 'preparing', progress: 0, message: 'Preparing RAW data...' }
      }));
      
      const data = await bridge.prepareForMetaISP();
      if (!data) {
        throw new Error('Failed to prepare data for MetaISP');
      }
      
      // Create inputs
      const device = targetDevice || options.targetDevice || 'auto';
      const inputs = bridge.createMetaISPInputs(data, device === 'auto' ? undefined : device);
      
      // Add dimensions
      const inputsWithDimensions = {
        ...inputs,
        dimensions: {
          rawWidth: data.bayerChannels.width,
          rawHeight: data.bayerChannels.height,
          fullWidth: data.bilinearRGB.width,
          fullHeight: data.bilinearRGB.height
        }
      };
      
      // Process
      const result = await processorRef.current.process(inputsWithDimensions);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        result,
        progress: null
      }));
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
        progress: null
      }));
      console.error('MetaISP processing failed:', error);
      return null;
    }
  }, [initialize, options.targetDevice]);
  
  // Get device recommendation
  const getRecommendedDevice = useCallback((): 'iphone' | 'samsung' | 'pixel' | null => {
    if (!bridgeRef.current) return null;
    return bridgeRef.current.getRecommendedDevice();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (processorRef.current) {
        processorRef.current.dispose();
      }
    };
  }, []);
  
  return {
    ...state,
    initialize,
    processRAW,
    getRecommendedDevice
  };
}