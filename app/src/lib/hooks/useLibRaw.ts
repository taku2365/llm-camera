"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { getLibRawClient } from "@/lib/libraw/client"
import { ProcessParams, PhotoMetadata, EditParams } from "@/lib/types"

interface UseLibRawReturn {
  loadFile: (file: File) => Promise<void>
  process: (editParams: EditParams) => Promise<void>
  imageData: ImageData | null
  metadata: PhotoMetadata | null
  isLoading: boolean
  isProcessing: boolean
  error: string | null
}

// Map edit params to LibRaw process params
function mapEditToProcessParams(editParams: EditParams): ProcessParams {
  return {
    useCameraWB: true, // For now, always use camera WB
    outputColor: 1, // sRGB
    brightness: 1.0 + (editParams.exposure / 5), // Map -5 to +5 -> 0 to 2
    quality: 3, // AHD interpolation
    halfSize: false,
    // TODO: Map other parameters like contrast, highlights, shadows
  }
}

export function useLibRaw(): UseLibRawReturn {
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [metadata, setMetadata] = useState<PhotoMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const clientRef = useRef(getLibRawClient())
  const fileLoadedRef = useRef(false)

  const loadFile = useCallback(async (file: File) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const meta = await clientRef.current.loadFile(file)
      setMetadata(meta)
      fileLoadedRef.current = true
      
      // Process with default parameters
      const processParams = mapEditToProcessParams({
        exposure: 0,
        contrast: 0,
        highlights: 0,
        shadows: 0,
        whites: 0,
        blacks: 0,
        temperature: 0,
        tint: 0,
        vibrance: 0,
        saturation: 0,
      })
      
      const data = await clientRef.current.process(processParams)
      setImageData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file")
      console.error("Failed to load RAW file:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const process = useCallback(async (editParams: EditParams) => {
    if (!fileLoadedRef.current) {
      setError("No file loaded")
      return
    }
    
    try {
      setIsProcessing(true)
      setError(null)
      
      const processParams = mapEditToProcessParams(editParams)
      const data = await clientRef.current.process(processParams)
      setImageData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image")
      console.error("Failed to process image:", err)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clientRef.current.dispose()
    }
  }, [])

  return {
    loadFile,
    process,
    imageData,
    metadata,
    isLoading,
    isProcessing,
    error,
  }
}