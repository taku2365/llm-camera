"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { getLibRawClient } from "@/lib/libraw/client"
import { ProcessParams, PhotoMetadata, EditParams } from "@/lib/types"

interface UseLibRawReturn {
  loadFile: (file: File) => Promise<void>
  process: (editParams: EditParams) => Promise<void>
  imageData: ImageData | null
  metadata: PhotoMetadata | null
  thumbnail: string | null  // Data URL for thumbnail
  isLoading: boolean
  isProcessing: boolean
  error: string | null
}

// Map edit params to LibRaw process params
function mapEditToProcessParams(editParams: EditParams): ProcessParams {
  // Map temperature to custom white balance if significantly changed
  let customWB = undefined
  if (Math.abs(editParams.temperature) > 10 || Math.abs(editParams.tint) > 10) {
    // Simple temperature/tint to RGB multipliers mapping
    const temp = editParams.temperature / 100 // -1 to 1
    const tint = editParams.tint / 100 // -1 to 1
    customWB = {
      r: 1.0 + temp * 0.3,
      g1: 1.0 - Math.abs(temp) * 0.1 + tint * 0.1,
      g2: 1.0 - Math.abs(temp) * 0.1 + tint * 0.1,
      b: 1.0 - temp * 0.3
    }
  }
  
  return {
    useCameraWB: !customWB, // Use camera WB if no custom WB
    outputColor: 1, // sRGB
    brightness: 1.0 + (editParams.exposure / 5), // Map -5 to +5 -> 0 to 2
    quality: 3, // AHD interpolation
    halfSize: false,
    
    // Highlights/shadows mapped to highlight recovery mode
    highlight: editParams.highlights < -50 ? 2 : // Blend mode for strong highlight recovery
               editParams.highlights < -20 ? 1 : // Unclip for moderate
               0, // Clip for normal
    
    // Contrast mapped to gamma curve
    gamma: editParams.contrast !== 0 ? [
      2.2 + (editParams.contrast / 200), // Gamma: 1.7 to 2.7
      4.5 - (editParams.contrast / 50)   // Toe: 3.5 to 6.5
    ] : undefined,
    
    // Shadows/blacks affect exposure and black level
    exposure: (editParams.shadows !== 0 || editParams.blacks !== 0) ? {
      shift: editParams.shadows / 100, // -1 to 1
      preserve: editParams.highlights < 0 ? 1.0 : 0.0 // Preserve highlights if pulling them down
    } : undefined,
    
    // User black level from blacks adjustment
    userBlack: editParams.blacks !== 0 ? 
      Math.max(0, 128 + editParams.blacks * 1.28) : // Map -100 to +100 -> 0 to 256
      undefined,
    
    // Vibrance/saturation (LibRaw doesn't have direct saturation control, 
    // but we can use color space for subtle effect)
    outputColor: editParams.saturation > 50 ? 2 : // Adobe RGB for more saturation
                 editParams.saturation < -50 ? 0 : // Raw color for less
                 1, // sRGB for normal
    
    // Custom white balance from temperature/tint
    customWB,
    
    // Auto brightness for whites adjustment
    autoBright: editParams.whites !== 0 ? {
      enabled: true,
      threshold: 0.01 + (editParams.whites / 10000) // 0.001 to 0.02
    } : undefined,
    
    // Advanced parameters
    cropArea: editParams.cropEnabled && editParams.cropArea ? editParams.cropArea : undefined,
    userFlip: editParams.userFlip,
    shotSelect: editParams.shotSelect,
    noiseThreshold: editParams.noiseThreshold,
    medianPasses: editParams.medianPasses,
    dcbIterations: editParams.dcbIterations,
    dcbEnhance: editParams.dcbEnhance,
    outputBPS: editParams.outputBPS,
  }
}

export function useLibRaw(): UseLibRawReturn {
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [metadata, setMetadata] = useState<PhotoMetadata | null>(null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const clientRef = useRef(getLibRawClient())
  const fileLoadedRef = useRef(false)
  const currentFileRef = useRef<File | null>(null)
  const loadingRef = useRef(false)

  const loadFile = useCallback(async (file: File) => {
    // Prevent duplicate loads
    if (loadingRef.current || currentFileRef.current === file) {
      return
    }
    
    try {
      loadingRef.current = true
      setIsLoading(true)
      setError(null)
      
      const meta = await clientRef.current.loadFile(file)
      setMetadata(meta)
      
      // Try to extract thumbnail
      try {
        const thumbnailData = clientRef.current.getThumbnail()
        if (thumbnailData && thumbnailData.format === 'jpeg') {
          // Convert thumbnail to data URL
          const blob = new Blob([thumbnailData.data], { type: 'image/jpeg' })
          const dataUrl = URL.createObjectURL(blob)
          setThumbnail(dataUrl)
        }
      } catch (thumbError) {
        console.warn('Failed to extract thumbnail:', thumbError)
      }
      
      fileLoadedRef.current = true
      currentFileRef.current = file
      
      // Don't process automatically - wait for manual trigger
      // Just show the thumbnail until user clicks Process
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file")
      console.error("Failed to load RAW file:", err)
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [])

  const processingRef = useRef(false)
  
  const process = useCallback(async (editParams: EditParams) => {
    if (!fileLoadedRef.current) {
      setError("No file loaded")
      return
    }
    
    // Prevent multiple simultaneous processing
    if (processingRef.current) {
      return
    }
    
    try {
      processingRef.current = true
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
      processingRef.current = false
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
    thumbnail,
    isLoading,
    isProcessing,
    error,
  }
}