"use client"

import { useEffect, useRef, useState } from "react"

interface ImageViewerProps {
  imageData: ImageData | null
  previousImageData?: ImageData | null
  showComparison?: boolean
  comparisonMode?: 'slider' | 'side-by-side'
  isProcessing: boolean
}

export default function ImageViewer({ 
  imageData, 
  previousImageData,
  showComparison = false,
  comparisonMode = 'slider',
  isProcessing 
}: ImageViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previousCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [sliderPosition, setSliderPosition] = useState(50) // For slider comparison

  useEffect(() => {
    if (!canvasRef.current || !imageData) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    // Set canvas size to match image
    canvas.width = imageData.width
    canvas.height = imageData.height
    
    // Draw image data
    ctx.putImageData(imageData, 0, 0)
  }, [imageData])
  
  // Draw previous image for comparison
  useEffect(() => {
    if (!previousCanvasRef.current || !previousImageData) return
    
    const canvas = previousCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    // Set canvas size to match image
    canvas.width = previousImageData.width
    canvas.height = previousImageData.height
    
    // Draw image data
    ctx.putImageData(previousImageData, 0, 0)
  }, [previousImageData])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta))
    setZoom(newZoom)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const fitToView = () => {
    if (!containerRef.current || !imageData) return
    
    const container = containerRef.current
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    
    const imageAspect = imageData.width / imageData.height
    const containerAspect = containerWidth / containerHeight
    
    let newZoom
    if (imageAspect > containerAspect) {
      newZoom = containerWidth / imageData.width
    } else {
      newZoom = containerHeight / imageData.height
    }
    
    setZoom(newZoom * 0.9) // 90% to add some padding
    setPan({ x: 0, y: 0 })
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-gray-950 overflow-hidden cursor-move"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="text-white text-center">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Processing RAW file...</p>
          </div>
        </div>
      )}
      
      {!imageData && !isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-24 h-24 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400 text-lg mb-2">To display the image</p>
            <p className="text-gray-500">Adjust settings in the right panel</p>
            <p className="text-gray-500">then click the &quot;Process&quot; button</p>
          </div>
        </div>
      )}
      
      {showComparison && previousImageData && comparisonMode === 'side-by-side' ? (
        // Side-by-side comparison
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          <div className="flex gap-4">
            <div className="relative">
              <canvas
                ref={previousCanvasRef}
                className="shadow-2xl"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center",
                  imageRendering: zoom > 1.5 ? "pixelated" : "auto",
                }}
              />
              <div className="absolute bottom-0 left-0 bg-black/70 text-white px-2 py-1 text-sm">
                Before
              </div>
            </div>
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="shadow-2xl"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center",
                  imageRendering: zoom > 1.5 ? "pixelated" : "auto",
                }}
              />
              <div className="absolute bottom-0 left-0 bg-black/70 text-white px-2 py-1 text-sm">
                After
              </div>
            </div>
          </div>
        </div>
      ) : showComparison && previousImageData && comparisonMode === 'slider' ? (
        // Slider comparison
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
            {/* Previous (full) */}
            <canvas
              ref={previousCanvasRef}
              className="shadow-2xl"
              style={{
                imageRendering: zoom > 1.5 ? "pixelated" : "auto",
              }}
            />
            {/* Current (clipped) */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <canvas
                ref={canvasRef}
                className="shadow-2xl"
                style={{
                  imageRendering: zoom > 1.5 ? "pixelated" : "auto",
                }}
              />
            </div>
            {/* Slider handle */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={(e) => {
                const rect = e.currentTarget.parentElement!.getBoundingClientRect()
                const handleDrag = (e: MouseEvent) => {
                  const x = e.clientX - rect.left
                  const percent = (x / rect.width) * 100
                  setSliderPosition(Math.max(0, Math.min(100, percent)))
                }
                const handleUp = () => {
                  document.removeEventListener('mousemove', handleDrag)
                  document.removeEventListener('mouseup', handleUp)
                }
                document.addEventListener('mousemove', handleDrag)
                document.addEventListener('mouseup', handleUp)
              }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Normal view
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          <canvas
            ref={canvasRef}
            className="shadow-2xl"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center",
              imageRendering: zoom > 1.5 ? "pixelated" : "auto",
            }}
          />
        </div>
      )}
      
      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-gray-800 bg-opacity-80 rounded-lg p-2">
        <button
          onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}
          className="w-8 h-8 text-white hover:bg-gray-700 rounded flex items-center justify-center"
        >
          -
        </button>
        <span className="text-white text-sm w-16 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(z => Math.min(5, z + 0.1))}
          className="w-8 h-8 text-white hover:bg-gray-700 rounded flex items-center justify-center"
        >
          +
        </button>
        <button
          onClick={fitToView}
          className="w-8 h-8 text-white hover:bg-gray-700 rounded flex items-center justify-center"
          title="Fit to view"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
    </div>
  )
}