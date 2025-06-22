// Global WASM module loader
// Loads LibRaw WASM once and caches it for reuse

import { loadLibRawWASM } from './wasm-loader-helper';

let wasmModulePromise: Promise<any> | null = null;

export async function getLibRawModule(): Promise<any> {
  if (!wasmModulePromise) {
    wasmModulePromise = loadWasmModule();
  }
  return wasmModulePromise;
}

async function loadWasmModule(): Promise<any> {
  console.log('Loading LibRaw WASM module...');
  
  try {
    // Load the factory function
    const LibRawFactory = await loadLibRawWASM();
    
    // Initialize the module
    const LibRaw = await LibRawFactory();
    
    console.log('LibRaw WASM module loaded successfully');
    console.log('Version:', LibRaw.LibRaw.getVersion());
    console.log('Supported cameras:', LibRaw.LibRaw.getCameraCount());
    
    return LibRaw;
  } catch (error) {
    console.error('Failed to load LibRaw WASM module:', error);
    throw error;
  }
}