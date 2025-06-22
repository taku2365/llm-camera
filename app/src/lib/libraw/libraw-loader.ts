// LibRaw WASM module loader
// Handles loading the LibRaw WASM module in different contexts (main thread vs worker)

import { getLibRawModule } from './wasm-module-loader';

export async function loadLibRawModule(): Promise<any> {
  // Use the cached module loader
  return await getLibRawModule();
}