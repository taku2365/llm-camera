// Helper to load WASM module in different environments
export async function loadLibRawWASM() {
  const isWorker = typeof WorkerGlobalScope !== 'undefined' && (self as any) instanceof WorkerGlobalScope;
  
  if (isWorker) {
    console.log('Loading LibRaw in worker context');
    
    // In Worker context, use importScripts
    const response = await fetch('/wasm/libraw.js');
    const scriptText = await response.text();
    
    // Remove ES6 export statements and import.meta references
    const modifiedScript = scriptText
      .replace(/export\s+default\s+/g, 'self.LibRawModule = ')
      .replace(/export\s+{[^}]*}/g, '')
      .replace(/import\.meta\.url/g, `'${location.origin}/wasm/libraw.js'`)
      .replace(/import\.meta/g, '{}');
    
    // Create a blob URL with the modified script
    const blob = new Blob([modifiedScript], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Use importScripts to load the module
    (self as any).importScripts(blobUrl);
    
    // Clean up the blob URL
    URL.revokeObjectURL(blobUrl);
    
    // Get the module from global scope
    const LibRawFactory = (self as any).LibRawModule;
    if (!LibRawFactory) {
      throw new Error('LibRaw module not found after importScripts');
    }
    
    return LibRawFactory;
  } else {
    console.log('Loading LibRaw in main thread');
    
    // In main thread, dynamically load the script
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/wasm/libraw.js';
      script.async = true;
      
      // Handle the module when it loads
      (window as any).__librawModuleResolve = resolve;
      
      script.onload = () => {
        // The libraw.js should set a global variable
        const LibRawFactory = (window as any).LibRawModule || (window as any).Module;
        if (!LibRawFactory) {
          reject(new Error('LibRaw module not found after script load'));
        } else {
          resolve(LibRawFactory);
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load LibRaw WASM script'));
      };
      
      document.head.appendChild(script);
    });
  }
}