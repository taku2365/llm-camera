import { WorkerMessage, WorkerResponse, ProcessParams, LibRawProcessor } from "@/lib/types"
import { createProcessor } from "./processor-factory"

let processor: LibRawProcessor | null = null

// Handle messages from main thread
self.addEventListener("message", async (event: MessageEvent<WorkerMessage>) => {
  const { type, id, data } = event.data

  try {
    switch (type) {
      case "load": {
        // Initialize processor if needed
        if (!processor) {
          processor = await createProcessor()
        }
        
        // Load the file
        await processor.loadFile(data.buffer)
        
        // Get metadata immediately
        const metadata = processor.getMetadata()
        
        // Send success response
        const response: WorkerResponse = {
          type: "loaded",
          id,
          data: { metadata },
        }
        self.postMessage(response)
        break
      }

      case "process": {
        if (!processor) {
          throw new Error("Processor not initialized")
        }
        
        // Process with given parameters
        const processedImage = await processor.process(data.params as ProcessParams)
        
        // Transfer the buffer to avoid copying
        const response: WorkerResponse = {
          type: "processed",
          id,
          data: {
            data: processedImage.data.buffer,
            width: processedImage.width,
            height: processedImage.height,
            metadata: processedImage.metadata,
          },
        }
        
        self.postMessage(response, [processedImage.data.buffer])
        break
      }

      case "get-thumbnail": {
        if (!processor) {
          throw new Error("Processor not initialized")
        }
        
        // Get thumbnail data
        const thumbnailData = processor.getThumbnail()
        
        const response: WorkerResponse = {
          type: "thumbnail",
          id,
          data: thumbnailData,
        }
        self.postMessage(response)
        break
      }

      case "dispose": {
        if (processor) {
          processor.dispose()
          processor = null
        }
        
        const response: WorkerResponse = {
          type: "disposed",
          id,
        }
        self.postMessage(response)
        break
      }

      default:
        throw new Error(`Unknown message type: ${type}`)
    }
  } catch (error) {
    const response: WorkerResponse = {
      type: "error",
      id,
      error: error instanceof Error ? error.message : "Unknown error",
    }
    self.postMessage(response)
  }
})

// Prevent TypeScript error for worker context
export {}