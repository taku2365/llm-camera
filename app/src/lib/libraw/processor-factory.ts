import { LibRawProcessor } from "@/lib/types"
import { LibRawWASM } from "./index"
import { LibRawMock } from "./mock"

// Force use real WASM (set to true to use mock for testing)
const USE_MOCK = false

export async function createProcessor(): Promise<LibRawProcessor> {
  if (USE_MOCK || !globalThis.WebAssembly) {
    console.log("Using LibRaw mock implementation")
    return LibRawMock.create()
  }
  
  try {
    console.log("Loading LibRaw WASM module")
    return await LibRawWASM.create()
  } catch (error) {
    console.error("Failed to load LibRaw WASM, falling back to mock:", error)
    return LibRawMock.create()
  }
}