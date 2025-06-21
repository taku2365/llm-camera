"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import ImageViewer from "@/app/components/editor/ImageViewer"
import Histogram from "@/app/components/editor/Histogram"
import BasicAdjustments from "@/app/components/editor/BasicAdjustments"
import { EditParams } from "@/lib/types"

export default function EditorPage() {
  const { id } = useParams() as { id: string }
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
  
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleParamChange = (param: keyof EditParams, value: number) => {
    setEditParams(prev => ({
      ...prev,
      [param]: value
    }))
    
    // TODO: Trigger RAW reprocessing
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
            isProcessing={isProcessing}
          />
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