"use client"

import { useState, useEffect } from "react"
import ImageViewer from "@/app/components/editor/ImageViewer"

export default function TestViewerPage() {
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [previousImageData, setPreviousImageData] = useState<ImageData | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'side-by-side'>('side-by-side')
  
  // Create test ImageData
  useEffect(() => {
    // Create a red image for current
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 300
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(0, 0, 400, 300)
    ctx.fillStyle = 'white'
    ctx.font = '30px Arial'
    ctx.fillText('Current Image', 100, 150)
    const currentData = ctx.getImageData(0, 0, 400, 300)
    console.log('Created current ImageData:', currentData.width, 'x', currentData.height)
    setImageData(currentData)
    
    // Create a blue image for previous
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(0, 0, 400, 300)
    ctx.fillStyle = 'white'
    ctx.fillText('Previous Image', 100, 150)
    const prevData = ctx.getImageData(0, 0, 400, 300)
    console.log('Created previous ImageData:', prevData.width, 'x', prevData.height)
    setPreviousImageData(prevData)
    
    // Debug: draw to visible canvas
    const debugCanvas = document.getElementById('debug-canvas') as HTMLCanvasElement
    if (debugCanvas) {
      debugCanvas.width = 400
      debugCanvas.height = 300
      const debugCtx = debugCanvas.getContext('2d')!
      debugCtx.putImageData(currentData, 0, 0)
    }
  }, [])
  
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white mb-4">ImageViewer Test</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showComparison ? 'Hide' : 'Show'} Comparison
          </button>
          <button
            onClick={() => setComparisonMode(comparisonMode === 'slider' ? 'side-by-side' : 'slider')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Mode: {comparisonMode}
          </button>
        </div>
        <div className="mt-4 text-white text-sm">
          <div>showComparison: {showComparison.toString()}</div>
          <div>comparisonMode: {comparisonMode}</div>
          <div>hasImageData: {!!imageData ? 'true' : 'false'}</div>
          <div>hasPreviousImageData: {!!previousImageData ? 'true' : 'false'}</div>
        </div>
        <div className="mt-4">
          <canvas id="debug-canvas" className="border border-white" />
        </div>
      </div>
      <div className="flex-1 relative">
        <ImageViewer
          imageData={imageData}
          previousImageData={previousImageData}
          showComparison={showComparison}
          comparisonMode={comparisonMode}
          isProcessing={false}
        />
      </div>
    </div>
  )
}