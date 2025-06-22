"use client"

import { useState } from "react"

interface AdvancedParams {
  // Crop settings
  cropEnabled: boolean
  cropArea: { x1: number; y1: number; x2: number; y2: number }
  
  // Rotation/flip
  userFlip: number // 0=none, 3=180, 5=90CCW, 6=90CW
  
  // Multi-shot selection (for cameras that support it)
  shotSelect: number
  
  // Quality settings
  noiseThreshold: number
  medianPasses: number
  dcbIterations: number
  dcbEnhance: boolean
  
  // Output settings
  outputBPS: number // 8 or 16 bits per sample
}

interface AdvancedAdjustmentsProps {
  params: AdvancedParams
  onChange: (param: keyof AdvancedParams, value: any) => void
  imageWidth?: number
  imageHeight?: number
}

export default function AdvancedAdjustments({ 
  params, 
  onChange, 
  imageWidth = 6000, 
  imageHeight = 4000 
}: AdvancedAdjustmentsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleCropChange = (coord: 'x1' | 'y1' | 'x2' | 'y2', value: number) => {
    const newCropArea = { ...params.cropArea, [coord]: value }
    onChange('cropArea', newCropArea)
  }

  const resetCrop = () => {
    onChange('cropArea', { x1: 0, y1: 0, x2: imageWidth, y2: imageHeight })
  }

  return (
    <div className="p-4 border-b border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-white font-medium text-sm mb-3"
      >
        <span>Advanced Settings</span>
        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-4">
          {/* Crop Controls */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-300">Crop</label>
              <input
                type="checkbox"
                checked={params.cropEnabled}
                onChange={(e) => onChange('cropEnabled', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            
            {params.cropEnabled && (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-400">X1</label>
                    <input
                      type="number"
                      min={0}
                      max={imageWidth}
                      value={params.cropArea.x1}
                      onChange={(e) => handleCropChange('x1', parseInt(e.target.value))}
                      className="w-full bg-gray-700 text-white px-2 py-1 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400">Y1</label>
                    <input
                      type="number"
                      min={0}
                      max={imageHeight}
                      value={params.cropArea.y1}
                      onChange={(e) => handleCropChange('y1', parseInt(e.target.value))}
                      className="w-full bg-gray-700 text-white px-2 py-1 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400">X2</label>
                    <input
                      type="number"
                      min={0}
                      max={imageWidth}
                      value={params.cropArea.x2}
                      onChange={(e) => handleCropChange('x2', parseInt(e.target.value))}
                      className="w-full bg-gray-700 text-white px-2 py-1 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400">Y2</label>
                    <input
                      type="number"
                      min={0}
                      max={imageHeight}
                      value={params.cropArea.y2}
                      onChange={(e) => handleCropChange('y2', parseInt(e.target.value))}
                      className="w-full bg-gray-700 text-white px-2 py-1 rounded text-xs"
                    />
                  </div>
                </div>
                <button
                  onClick={resetCrop}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Reset Crop
                </button>
              </div>
            )}
          </div>

          {/* Rotation */}
          <div>
            <label className="block text-xs text-gray-300 mb-1">Rotation</label>
            <select
              value={params.userFlip}
              onChange={(e) => onChange('userFlip', parseInt(e.target.value))}
              className="w-full bg-gray-700 text-white px-2 py-1 rounded text-xs"
            >
              <option value={0}>None</option>
              <option value={3}>180°</option>
              <option value={5}>90° CCW</option>
              <option value={6}>90° CW</option>
            </select>
          </div>

          {/* Multi-shot Selection */}
          <div>
            <label className="block text-xs text-gray-300 mb-1">Shot Select</label>
            <input
              type="number"
              min={0}
              max={10}
              value={params.shotSelect}
              onChange={(e) => onChange('shotSelect', parseInt(e.target.value))}
              className="w-full bg-gray-700 text-white px-2 py-1 rounded text-xs"
            />
            <div className="text-xs text-gray-500 mt-1">For multi-shot RAW files</div>
          </div>

          {/* Noise Reduction */}
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Noise Threshold: {params.noiseThreshold}
            </label>
            <input
              type="range"
              min={0}
              max={1000}
              step={10}
              value={params.noiseThreshold}
              onChange={(e) => onChange('noiseThreshold', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Median Filter */}
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Median Passes: {params.medianPasses}
            </label>
            <input
              type="range"
              min={0}
              max={10}
              value={params.medianPasses}
              onChange={(e) => onChange('medianPasses', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* DCB Quality */}
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              DCB Iterations: {params.dcbIterations}
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={params.dcbIterations}
              onChange={(e) => onChange('dcbIterations', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-300">DCB False Color Suppression</label>
              <input
                type="checkbox"
                checked={params.dcbEnhance}
                onChange={(e) => onChange('dcbEnhance', e.target.checked)}
                className="w-4 h-4"
              />
            </div>
          </div>

          {/* Output Bit Depth */}
          <div>
            <label className="block text-xs text-gray-300 mb-1">Output Bit Depth</label>
            <select
              value={params.outputBPS}
              onChange={(e) => onChange('outputBPS', parseInt(e.target.value))}
              className="w-full bg-gray-700 text-white px-2 py-1 rounded text-xs"
            >
              <option value={8}>8-bit</option>
              <option value={16}>16-bit</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}