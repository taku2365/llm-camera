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

```bash
# Run all tests
npm test

# Specific test suites
npm run test:node        # Node.js tests
npm run test:browser-sim # Browser simulation tests
npm run test:playwright  # Cross-browser tests (requires real browsers)
npm run test:arw        # Sony ARW format specific tests

# Development server
npm run serve           # Starts server at http://localhost:8000
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
  - `libraw_wasm_stubs.cpp` - Stub implementations for unsupported features
  - Generated outputs: `libraw.js` (ES6), `libraw-node.js` (CommonJS)

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

### When modifying JavaScript interface
- Maintain both ES6 and CommonJS compatibility
- Handle memory cleanup in error cases
- Use typed arrays for binary data transfer

### Performance Considerations
- halfSize option reduces resolution but speeds processing
- Linear interpolation (quality: 0) is fastest
- AHD interpolation (quality: 3) provides best quality
- Typical processing: ~12 seconds for 78MB ARW file

### Common Issues
- CORS errors: Must serve from HTTP server, not file://
- Memory errors on large files: Use halfSize option
- Browser compatibility: Requires WebAssembly and ES6 modules support

### comment
- write all code comments and README content entirely in English