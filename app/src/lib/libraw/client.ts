"use client"

import { 
  ProcessParams, 
  ProcessedImage, 
  PhotoMetadata,
  WorkerMessage,
  WorkerResponse 
} from "@/lib/types"

export class LibRawClient {
  private worker: Worker | null = null
  private messageId = 0
  private pending = new Map<string, { resolve: Function; reject: Function }>()
  private initPromise: Promise<void> | null = null
  private initialized = false

  constructor() {
    // Don't initialize in constructor, do it lazily
  }

  private async initialize(): Promise<void> {
    if (typeof window !== "undefined" && !this.worker) {
      try {
        console.log("Initializing LibRaw worker...")
        this.worker = new Worker(new URL("./worker.ts", import.meta.url))
        
        // Set up message handler
        this.worker.addEventListener("message", this.handleMessage.bind(this))
        
        // Wait a bit for worker to be ready
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log("LibRaw worker initialized")
      } catch (error) {
        console.error("Failed to initialize LibRaw worker:", error)
        this.worker = null
        throw error
      }
    }
  }

  private handleMessage(event: MessageEvent<WorkerResponse>) {
    const { id, type, data, error } = event.data
    const pending = this.pending.get(id)
    
    if (!pending) return
    
    this.pending.delete(id)
    
    if (type === "error") {
      pending.reject(new Error(error || "Unknown error"))
    } else {
      pending.resolve(data)
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized && !this.initPromise) {
      this.initPromise = this.initialize()
    }
    if (this.initPromise) {
      await this.initPromise
      this.initialized = true
    }
  }

  private async sendMessage(type: WorkerMessage["type"], data?: any): Promise<any> {
    // Ensure worker is initialized
    await this.ensureInitialized()
    
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("Worker not initialized"))
        return
      }
      
      const id = String(++this.messageId)
      this.pending.set(id, { resolve, reject })
      
      const message: WorkerMessage = { type, id, data }
      this.worker.postMessage(message)
    })
  }

  async loadFile(file: File): Promise<PhotoMetadata> {
    const buffer = await file.arrayBuffer()
    const result = await this.sendMessage("load", { buffer })
    return result.metadata
  }

  async process(params: ProcessParams): Promise<ImageData> {
    const result = await this.sendMessage("process", { params })
    
    // Reconstruct ImageData from transferred buffer
    const data = new Uint8ClampedArray(result.data)
    return new ImageData(data, result.width, result.height)
  }

  async dispose(): Promise<void> {
    try {
      if (this.worker) {
        await this.sendMessage("dispose")
        this.worker.terminate()
        this.worker = null
      }
    } catch (error) {
      console.error("Error disposing worker:", error)
      // Force terminate even if dispose message fails
      if (this.worker) {
        this.worker.terminate()
        this.worker = null
      }
    }
  }
}

// Singleton instance
let clientInstance: LibRawClient | null = null

export function getLibRawClient(): LibRawClient {
  if (!clientInstance) {
    clientInstance = new LibRawClient()
  }
  return clientInstance
}