import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}))

// Mock WebWorker
class MockWorker {
  postMessage = vi.fn()
  terminate = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
}

global.Worker = MockWorker as any

// Mock fetch for WASM module loading
global.fetch = vi.fn()

// Mock Canvas and ImageData for Node environment
class MockImageData {
  data: Uint8ClampedArray
  width: number
  height: number

  constructor(width: number, height: number)
  constructor(data: Uint8ClampedArray, width: number, height: number)
  constructor(arg1: number | Uint8ClampedArray, arg2: number, arg3?: number) {
    if (typeof arg1 === 'number') {
      this.width = arg1
      this.height = arg2
      this.data = new Uint8ClampedArray(arg1 * arg2 * 4)
    } else {
      this.data = arg1
      this.width = arg2
      this.height = arg3!
    }
  }
}

global.ImageData = MockImageData as any

// Mock Canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  putImageData: vi.fn(),
  globalCompositeOperation: 'source-over',
})) as any