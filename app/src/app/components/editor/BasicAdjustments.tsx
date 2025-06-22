"use client"

import { EditParams } from "@/lib/types"

interface BasicAdjustmentsProps {
  params: EditParams
  onChange: (param: keyof EditParams, value: number) => void
}

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

function Slider({ label, value, min, max, step = 1, onChange }: SliderProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-sm text-gray-400 w-12 text-right">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      />
    </div>
  )
}

export default function BasicAdjustments({ params, onChange }: BasicAdjustmentsProps) {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Basic</h3>
        <div className="space-y-4">
          <Slider
            label="Exposure"
            value={params.exposure}
            min={-5}
            max={5}
            step={0.1}
            onChange={(value) => onChange("exposure", value)}
          />
          <Slider
            label="Contrast"
            value={params.contrast}
            min={-100}
            max={100}
            onChange={(value) => onChange("contrast", value)}
          />
          <Slider
            label="Highlights"
            value={params.highlights}
            min={-100}
            max={100}
            onChange={(value) => onChange("highlights", value)}
          />
          <Slider
            label="Shadows"
            value={params.shadows}
            min={-100}
            max={100}
            onChange={(value) => onChange("shadows", value)}
          />
          <Slider
            label="Whites"
            value={params.whites}
            min={-100}
            max={100}
            onChange={(value) => onChange("whites", value)}
          />
          <Slider
            label="Blacks"
            value={params.blacks}
            min={-100}
            max={100}
            onChange={(value) => onChange("blacks", value)}
          />
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-white mb-4">Color</h3>
        <div className="space-y-4">
          <Slider
            label="Temperature"
            value={params.temperature}
            min={-100}
            max={100}
            onChange={(value) => onChange("temperature", value)}
          />
          <Slider
            label="Tint"
            value={params.tint}
            min={-100}
            max={100}
            onChange={(value) => onChange("tint", value)}
          />
          <Slider
            label="Vibrance"
            value={params.vibrance}
            min={-100}
            max={100}
            onChange={(value) => onChange("vibrance", value)}
          />
          <Slider
            label="Saturation"
            value={params.saturation}
            min={-100}
            max={100}
            onChange={(value) => onChange("saturation", value)}
          />
        </div>
      </div>

      <div className="border-t border-gray-700 pt-6">
        <button 
          onClick={() => {
            onChange("exposure", 0)
            onChange("contrast", 0)
            onChange("highlights", 0)
            onChange("shadows", 0)
            onChange("whites", 0)
            onChange("blacks", 0)
            onChange("temperature", 0)
            onChange("tint", 0)
            onChange("vibrance", 0)
            onChange("saturation", 0)
          }}
          className="w-full py-2 px-4 bg-gray-700 text-white rounded hover:bg-gray-600 transition"
        >
          Reset All
        </button>
      </div>
    </div>
  )
}