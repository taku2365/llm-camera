"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface ImageViewerProps {
  imageData: ImageData | null
  previousImageData?: ImageData | null
  currentComparisonData?: ImageData | null
  showComparison?: boolean
  isProcessing: boolean
}

export default function ImageViewer({ 
  imageData, 
  previousImageData,
  currentComparisonData,
  showComparison = false,
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
  
  // Use currentComparisonData for "after" image if available, otherwise use imageData
  const afterImageData = currentComparisonData || imageData
  
  // Helper function to draw ImageData to canvas
  const drawToCanvas = useCallback((canvas: HTMLCanvasElement | null, data: ImageData | null) => {
    if (!canvas || !data) return
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    // Set canvas size to match image
    canvas.width = data.width
    canvas.height = data.height
    
    // Draw image data
    ctx.putImageData(data, 0, 0)
  }, [])

  // Callback refs that draw when canvas is attached
  const mainCanvasCallback = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas
    drawToCanvas(canvas, afterImageData)
  }, [afterImageData, drawToCanvas])
  
  const previousCanvasCallback = useCallback((canvas: HTMLCanvasElement | null) => {
    previousCanvasRef.current = canvas
    drawToCanvas(canvas, previousImageData ?? null)
  }, [previousImageData, drawToCanvas])
  

  // Re-draw when data changes
  useEffect(() => {
    drawToCanvas(canvasRef.current, afterImageData)
  }, [afterImageData, drawToCanvas])
  
  // Re-draw previous image when data changes
  useEffect(() => {
    drawToCanvas(previousCanvasRef.current, previousImageData ?? null)
  }, [previousImageData, drawToCanvas])
  

  // Handle wheel events with native listener to prevent passive event issues
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom(prevZoom => Math.max(0.1, Math.min(5, prevZoom * delta)))
    }

    // Add non-passive wheel event listener
    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [])

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
    if (!containerRef.current || !afterImageData) return
    
    const container = containerRef.current
    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    
    const imageAspect = afterImageData.width / afterImageData.height
    const containerAspect = containerWidth / containerHeight
    
    let newZoom
    if (imageAspect > containerAspect) {
      newZoom = containerWidth / afterImageData.width
    } else {
      newZoom = containerHeight / afterImageData.height
    }
    
    setZoom(newZoom * 0.9) // 90% to add some padding
    setPan({ x: 0, y: 0 })
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-gray-950 overflow-hidden cursor-move"
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
      
      {!afterImageData && !isProcessing && (
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
      
      {showComparison && previousImageData ? (
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
              ref={previousCanvasCallback}
              className="shadow-2xl block"
              style={{
                width: `${previousImageData?.width || 1}px`,
                height: `${previousImageData?.height || 1}px`,
                imageRendering: zoom > 1.5 ? "pixelated" : "auto",
              }}
            />
            {/* Current (clipped) */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <canvas
                ref={mainCanvasCallback}
                className="shadow-2xl block"
                style={{
                  width: `${(currentComparisonData || afterImageData)?.width || 1}px`,
                  height: `${(currentComparisonData || afterImageData)?.height || 1}px`,
                  imageRendering: zoom > 1.5 ? "pixelated" : "auto",
                }}
              />
            </div>
            {/* Slider handle */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={(e) => {
                e.stopPropagation() // Prevent pan/zoom when dragging slider
                const rect = e.currentTarget.parentElement!.getBoundingClientRect()
                const handleDrag = (e: MouseEvent) => {
                  e.preventDefault()
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
      ) : afterImageData ? (
        // Normal view
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          <canvas
            ref={mainCanvasCallback}
            className="shadow-2xl block"
            style={{
              width: `${afterImageData?.width || 1}px`,
              height: `${afterImageData?.height || 1}px`,
              transform: `scale(${zoom})`,
              transformOrigin: "center",
              imageRendering: zoom > 1.5 ? "pixelated" : "auto",
            }}
          />
        </div>
      ) : null}
      
      {/* Zoom controls */}
      {afterImageData && (
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
      )}
    </div>
  )
}