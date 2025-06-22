"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import ImageViewer from "@/app/components/editor/ImageViewer"
import Histogram from "@/app/components/editor/Histogram"
import BasicAdjustments from "@/app/components/editor/BasicAdjustments"
import AdvancedAdjustments from "@/app/components/editor/AdvancedAdjustments"
import { EditParams } from "@/lib/types"
import { usePhotosStore } from "@/lib/store/photos"
import { useLibRaw } from "@/lib/hooks/useLibRaw"

export default function EditorPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { getPhoto } = usePhotosStore()
  const photo = getPhoto(id)
  
  const [editParams, setEditParams] = useState<EditParams>({
    // Basic adjustments
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    
    // Color
    temperature: 0,
    tint: 0,
    vibrance: 0,
    saturation: 0,
    
    // Advanced settings
    cropEnabled: false,
    cropArea: { x1: 0, y1: 0, x2: 6000, y2: 4000 },
    userFlip: 0,
    shotSelect: 0,
    noiseThreshold: 100,
    medianPasses: 0,
    dcbIterations: 2,
    dcbEnhance: false,
    outputBPS: 8,
  })
  
  const { loadFile, process, imageData, metadata, thumbnail, isLoading, isProcessing, error } = useLibRaw()
  const processTimeoutRef = useRef<NodeJS.Timeout>()
  const loadedFileRef = useRef<File | null>(null)

  // Load the RAW file when component mounts
  useEffect(() => {
    if (!photo?.file) {
      // If no photo found, redirect to library
      router.push("/library")
      return
    }

    // Only load if it's a different file
    if (loadedFileRef.current !== photo.file) {
      loadedFileRef.current = photo.file
      loadFile(photo.file)
    }
  }, [photo, loadFile, router])

  // Debounced processing when parameters change
  useEffect(() => {
    if (!photo?.file || isLoading) return

    // Clear existing timeout
    if (processTimeoutRef.current) {
      clearTimeout(processTimeoutRef.current)
    }

    // Debounce processing by 300ms
    processTimeoutRef.current = setTimeout(() => {
      process(editParams)
    }, 300)

    return () => {
      if (processTimeoutRef.current) {
        clearTimeout(processTimeoutRef.current)
      }
    }
  }, [editParams, photo, process, isLoading])

  // Update crop area when metadata is loaded
  useEffect(() => {
    if (metadata && !editParams.cropArea) {
      setEditParams(prev => ({
        ...prev,
        cropArea: { x1: 0, y1: 0, x2: metadata.width, y2: metadata.height }
      }))
    }
  }, [metadata, editParams.cropArea])

  const handleParamChange = (param: keyof EditParams, value: any) => {
    setEditParams(prev => ({
      ...prev,
      [param]: value
    }))
  }

  return (
    <div className="h-full flex">
      {/* Main viewing area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Histogram */}
        <div className="h-24 px-4 py-2 bg-gray-800 border-b border-gray-700">
          <Histogram imageData={imageData} />
        </div>
        
        {/* Image viewer */}
        <div className="flex-1 relative">
          <ImageViewer 
            imageData={imageData}
            isProcessing={isProcessing || isLoading}
          />
          {error && (
            <div className="absolute bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded">
              Error: {error}
            </div>
          )}
        </div>
      </div>

      {/* Right panel with adjustments */}
      <aside className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
        {/* Thumbnail preview */}
        {thumbnail && (
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Thumbnail Preview</h3>
            <div className="relative bg-gray-900 rounded border border-gray-600 overflow-hidden">
              <img 
                src={thumbnail} 
                alt="RAW thumbnail"
                className="w-full h-auto max-h-32 object-contain"
              />
            </div>
          </div>
        )}
        
        <BasicAdjustments
          params={editParams}
          onChange={handleParamChange}
        />
        
        <AdvancedAdjustments
          params={{
            cropEnabled: editParams.cropEnabled || false,
            cropArea: editParams.cropArea || { x1: 0, y1: 0, x2: 6000, y2: 4000 },
            userFlip: editParams.userFlip || 0,
            shotSelect: editParams.shotSelect || 0,
            noiseThreshold: editParams.noiseThreshold || 100,
            medianPasses: editParams.medianPasses || 0,
            dcbIterations: editParams.dcbIterations || 2,
            dcbEnhance: editParams.dcbEnhance || false,
            outputBPS: editParams.outputBPS || 8,
          }}
          onChange={handleParamChange}
          imageWidth={metadata?.width || 6000}
          imageHeight={metadata?.height || 4000}
        />
      </aside>
    </div>
  )
}