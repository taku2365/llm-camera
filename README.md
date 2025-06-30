# LLM Camera

A professional WebAssembly-powered RAW image editor built with LibRaw, Next.js, and TypeScript.

## Features

- 🖼️ **RAW Image Processing**: Support for major camera formats (CR2, NEF, ARW, DNG, etc.)
- ⚡ **WebAssembly Performance**: Native-speed image processing in the browser
- 🎨 **Professional Adjustments**: 
  - Basic: Exposure, Contrast, Highlights, Shadows, Whites, Blacks
  - Color: Temperature, Tint, Vibrance, Saturation
  - Advanced: Crop, Rotation, Noise Reduction, DCB Enhancement
- 📝 **History System**: Non-destructive editing with full history
- 🔄 **Comparison Mode**: Side-by-side before/after comparison
- 💾 **Export**: Batch export with processing parameters
- 🚀 **Real-time Preview**: Fast processing with quality/performance options

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Image Processing**: LibRaw (C++) compiled to WebAssembly
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Testing**: Vitest, Playwright

## Getting Started

### Prerequisites

- Node.js 18+
- Emscripten SDK (for building LibRaw)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/taku2365/llm-camera.git
cd llm-camera
```

2. Install dependencies:
```bash
cd app
npm install
```

3. Build LibRaw WebAssembly module:
```bash
cd ../LibRaw
./build-wasm.sh
```

4. Run the development server:
```bash
cd ../app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start editing RAW images.

## Project Structure

```
llm-camera/
├── app/                    # Next.js application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Core libraries
│   │   │   ├── libraw/    # LibRaw WebAssembly integration
│   │   │   ├── hooks/     # React hooks
│   │   │   └── store/     # State management
│   │   └── types/         # TypeScript types
│   └── public/
│       └── wasm/          # WebAssembly modules
└── LibRaw/                # LibRaw source (submodule)
    └── wasm/              # WebAssembly wrapper
```

## Documentation

- [LibRaw Professional Guide](app/LIBRAW_PROFESSIONAL_GUIDE.md) - Comprehensive parameter usage guide
- [Optimization Plan](app/LIBRAW_OPTIMIZATION_PLAN.md) - Feature roadmap and optimization strategies
- [Test Coverage](app/TEST_COVERAGE_REPORT.md) - Testing documentation

## Key Features Explained

### WebAssembly Integration
The project uses LibRaw compiled to WebAssembly for high-performance RAW image processing directly in the browser. Processing happens in a Web Worker to keep the UI responsive.

### Professional RAW Processing
Supports advanced features like:
- Multiple demosaicing algorithms (AHD, DCB, DHT)
- Highlight recovery modes
- Custom white balance with grey card support
- Noise reduction with threshold control
- Lens corrections and aberration fixes

### History System
Non-destructive editing with automatic history tracking:
- Each processing creates a cached version
- Instant switching between versions
- Compare mode for side-by-side comparison
- Export multiple versions at once

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [LibRaw](https://www.libraw.org/) - The powerful RAW processing library
- [Emscripten](https://emscripten.org/) - For WebAssembly compilation
- [Next.js](https://nextjs.org/) - The React framework