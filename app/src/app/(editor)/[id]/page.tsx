"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import ImageViewer from "@/app/components/editor/ImageViewer"
import Histogram from "@/app/components/editor/Histogram"
import BasicAdjustments from "@/app/components/editor/BasicAdjustments"
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
  })
  
  const { loadFile, process, imageData, metadata, isLoading, isProcessing, error } = useLibRaw()
  const processTimeoutRef = useRef<NodeJS.Timeout>()

  // Load the RAW file when component mounts
  useEffect(() => {
    if (!photo?.file) {
      // If no photo found, redirect to library
      router.push("/")
      return
    }

    loadFile(photo.file)
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

  const handleParamChange = (param: keyof EditParams, value: number) => {
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
        <BasicAdjustments
          params={editParams}
          onChange={handleParamChange}
        />
      </aside>
    </div>
  )
}