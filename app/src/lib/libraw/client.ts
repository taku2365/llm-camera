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

  constructor() {
    if (typeof window !== "undefined") {
      this.worker = new Worker(new URL("./worker.ts", import.meta.url))
      this.worker.addEventListener("message", this.handleMessage.bind(this))
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

  private sendMessage(type: WorkerMessage["type"], data?: any): Promise<any> {
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
    await this.sendMessage("dispose")
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
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