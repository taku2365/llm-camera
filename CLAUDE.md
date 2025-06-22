# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WebAssembly port of LibRaw, a C++ library for reading and processing RAW image files from digital cameras. The project enables high-performance RAW image processing directly in web browsers and Node.js environments.

## Build Commands

### Prerequisites
The project requires Emscripten SDK. The build script automatically sources it from `../emsdk/emsdk_env.sh` if available.

### Building LibRaw WASM
```bash
# From the LibRaw directory
./build-wasm.sh              # Build both ES6 and CommonJS modules
./build-wasm.sh node         # Build CommonJS module only
./build-wasm.sh browser      # Build ES6 module only

# Alternative: use Makefile directly
make -f Makefile.emscripten
```

## Testing Commands

### LibRaw Tests (in LibRaw directory)
```bash
# Run all tests
npm test

# Specific test suites
npm run test:node        # Node.js tests
npm run test:browser-sim # Browser simulation tests
npm run test:playwright  # Cross-browser tests (requires real browsers)
npm run test:arw        # Sony ARW format specific tests
npm run test:extended    # Extended parameters tests
npm run test:advanced    # Advanced features tests (thumbnails, crop, etc.)

# Development server
npm run serve           # Starts server at http://localhost:8000
```

### App Development (in app directory)
```bash
# Development server
npm run dev             # Starts at http://localhost:3000

# Production build
npm run build
npm run start

# Linting and type checking
npm run lint
npm run typecheck
```

## Architecture Overview

### Core Structure
- **src/** - LibRaw C++ implementation
  - **decoders/** - Format-specific decoders (Canon, Sony, Nikon, etc.)
  - **demosaic/** - Demosaicing algorithms (AHD, DCB, DHT, xtrans)
  - **metadata/** - Camera metadata extraction
  - **postprocessing/** - Image processing pipeline
  - **preprocessing/** - RAW data preparation

### WebAssembly Layer
- **wasm/** - WASM bindings
  - `libraw_wasm_wrapper.cpp` - Main C++ to JavaScript interface
    - Basic processing methods (loadFromUint8Array, unpack, process, getImageData)
    - Extended parameters (highlight modes, gamma curves, noise reduction, etc.)
    - Advanced features (thumbnail extraction, 4-channel data, crop/rotation)
  - `libraw_wasm_stubs.cpp` - Stub implementations for unsupported features
  - Generated outputs: 
    - `libraw.js` - ES6 module for browsers
    - `libraw-node.js` - CommonJS module for Node.js
    - `libraw.wasm` - WebAssembly binary

### JavaScript Interface
- **web/libraw-wasm.js** - High-level JavaScript API wrapper providing Promise-based interface
- **cli-tool.js** - Command-line tool for batch processing
- **server.js** - Development server with proper WASM COOP/COEP headers

### Key API Classes
- `LibRawJS` - Main interface for initializing WASM module
- `LibRawImage` - Represents a loaded RAW image with processing methods

## Important Implementation Details

### Memory Management
- Uses Emscripten's typed_memory_view() for safe memory access
- Automatic cleanup required via dispose() methods
- Memory usage typically 3-4x RAW file size

### Processing Pipeline
1. Load RAW data into WASM memory
2. Unpack Bayer pattern
3. Apply demosaicing algorithm
4. Color space conversion
5. Export to JPEG/PNG via Canvas API

### Build Configuration
- Single-threaded (LIBRAW_NOTHREADS defined)
- No file system access (FILESYSTEM=0)
- Memory growth enabled (ALLOW_MEMORY_GROWTH=1)
- Includes zlib support (USE_ZLIB=1)

### Supported Formats
Extensively tested: Sony ARW, Canon CR2/CR3, Nikon NEF, Adobe DNG
Additional support: Fuji RAF, Olympus ORF, Panasonic RW2, Pentax PEF

## Development Notes

### When modifying C++ code
- Ensure thread-safety (no OpenMP/pthreads)
- Avoid file system operations
- Use WASM-compatible memory allocation
- Add existence checks for new optional methods

### When modifying JavaScript interface
- Maintain both ES6 and CommonJS compatibility
- Handle memory cleanup in error cases
- Use typed arrays for binary data transfer
- Check method existence before calling (e.g., `typeof instance.method === 'function'`)

### Performance Considerations
- halfSize option reduces resolution but speeds processing
- Linear interpolation (quality: 0) is fastest
- AHD interpolation (quality: 3) provides best quality
- Typical processing: ~12 seconds for 78MB ARW file

### Common Issues
- CORS errors: Must serve from HTTP server, not file://
- Memory errors on large files: Use halfSize option
- Browser compatibility: Requires WebAssembly and ES6 modules support
- Module loading errors: Check that libraw.js is in public/wasm/
- Optional methods: Advanced features may not be available in older builds

## WebAssembly Architecture Guide

### WASM Module Loading Process
1. **Browser Environment**:
   - WASM module served from `/public/wasm/libraw.js`
   - Loaded dynamically via script injection
   - Module factory pattern for initialization

2. **Worker Environment**:
   - Uses importScripts with blob URL workaround
   - ES6 module syntax stripped for compatibility
   - Shared module cached globally

3. **Key Files**:
   - `app/src/lib/libraw/wasm-module-loader.ts` - Global module caching
   - `app/src/lib/libraw/wasm-loader-helper.ts` - Environment-specific loading
   - `app/src/lib/libraw/libraw-loader.ts` - Factory initialization
   - `app/src/lib/libraw/index.ts` - TypeScript wrapper with type safety

### Advanced Features (New)
- **Thumbnail Extraction**: getThumbnail() returns JPEG/PPM thumbnails embedded in RAW files
- **4-Channel Data Access**: get4ChannelData() provides RGBG channel separation
- **RAW Bayer Data**: getRawBayerData() exposes unprocessed sensor data
- **Crop Support**: setCropArea() for efficient partial image processing
- **Rotation/Flip**: setUserFlip() supports 0°, 90°, 180°, 270° rotations
- **Multi-shot Selection**: setShotSelect() for bracketed exposures
- **Advanced Noise Reduction**: Median filter passes and threshold control
- **DCB Enhancement**: Improved demosaicing with false color suppression

## Application Architecture

### Next.js App Structure
- **app/** - Main application directory
  - **src/app/** - App router pages
    - **library/** - Photo library management
    - **editor/[id]/** - RAW editor with real-time adjustments
    - **components/** - Reusable UI components
  - **src/lib/** - Core libraries
    - **libraw/** - LibRaw WebAssembly integration
      - `client.ts` - Main client interface
      - `worker.ts` - Web Worker for background processing
      - `processor-factory.ts` - Factory for processor instances
    - **hooks/** - React hooks
      - `useLibRaw.ts` - Main hook for RAW processing
    - **store/** - Zustand state management
    - **types.ts** - TypeScript type definitions

### Key Components
1. **Editor Page** (`app/src/app/editor/[id]/page.tsx`):
   - Real-time RAW processing
   - Thumbnail preview display
   - Basic adjustments (exposure, contrast, highlights, etc.)
   - Advanced adjustments (crop, rotation, noise reduction, etc.)

2. **useLibRaw Hook** (`app/src/lib/hooks/useLibRaw.ts`):
   - Manages LibRaw client lifecycle
   - Maps edit parameters to LibRaw processing parameters
   - Handles file loading and processing
   - Extracts thumbnails and metadata

3. **LibRaw Client** (`app/src/lib/libraw/client.ts`):
   - Manages Web Worker communication
   - Handles async processing queue
   - Provides TypeScript-safe API

### Processing Flow
1. User selects RAW file in library
2. Editor loads file via useLibRaw hook
3. LibRaw client sends file to Web Worker
4. Worker loads WASM module and processes image
5. Processed ImageData returned to main thread
6. UI updates with processed image and histogram

### State Management
- **Photos Store**: Manages library of imported photos
- **Edit Parameters**: Local state in editor component
- **Processing State**: Managed by useLibRaw hook

### Performance Optimizations
- Web Worker isolation prevents UI blocking
- Debounced parameter changes (300ms)
- Shared WASM module instance
- Memory cleanup on unmount

### comment
- write all code comments and README content entirely in English