"use client"

import { useEffect, useRef } from "react"

interface HistogramProps {
  imageData: ImageData | null
}

export default function Histogram({ imageData }: HistogramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !imageData) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    // Calculate histogram data
    const redChannel = new Array(256).fill(0)
    const greenChannel = new Array(256).fill(0)
    const blueChannel = new Array(256).fill(0)
    
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      if (r !== undefined) redChannel[r]++
      if (g !== undefined) greenChannel[g]++
      if (b !== undefined) blueChannel[b]++
    }
    
    // Find max value for scaling
    const maxValue = Math.max(
      ...redChannel,
      ...greenChannel,
      ...blueChannel
    )
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw histograms
    const width = canvas.width / 256
    const height = canvas.height
    
    // Draw channels with transparency
    ctx.globalCompositeOperation = "screen"
    
    // Red channel
    ctx.fillStyle = "rgba(255, 0, 0, 0.6)"
    ctx.beginPath()
    ctx.moveTo(0, height)
    for (let i = 0; i < 256; i++) {
      const barHeight = (redChannel[i] / maxValue) * height * 0.9
      ctx.lineTo(i * width, height - barHeight)
    }
    ctx.lineTo(canvas.width, height)
    ctx.closePath()
    ctx.fill()
    
    // Green channel
    ctx.fillStyle = "rgba(0, 255, 0, 0.6)"
    ctx.beginPath()
    ctx.moveTo(0, height)
    for (let i = 0; i < 256; i++) {
      const barHeight = (greenChannel[i] / maxValue) * height * 0.9
      ctx.lineTo(i * width, height - barHeight)
    }
    ctx.lineTo(canvas.width, height)
    ctx.closePath()
    ctx.fill()
    
    // Blue channel
    ctx.fillStyle = "rgba(0, 0, 255, 0.6)"
    ctx.beginPath()
    ctx.moveTo(0, height)
    for (let i = 0; i < 256; i++) {
      const barHeight = (blueChannel[i] / maxValue) * height * 0.9
      ctx.lineTo(i * width, height - barHeight)
    }
    ctx.lineTo(canvas.width, height)
    ctx.closePath()
    ctx.fill()
    
    // Reset composite operation
    ctx.globalCompositeOperation = "source-over"
    
    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 1
    
    // Vertical lines at 0, 64, 128, 192, 255
    for (let i = 0; i <= 4; i++) {
      const x = (i * canvas.width) / 4
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
  }, [imageData])

  return (
    <div className="h-full flex items-center justify-center">
      {imageData ? (
        <canvas
          ref={canvasRef}
          width={256}
          height={80}
          className="w-full h-full"
          style={{ maxWidth: "256px" }}
        />
      ) : (
        <div className="text-gray-500 text-sm">
          Histogram will appear here
        </div>
      )}
    </div>
  )
}