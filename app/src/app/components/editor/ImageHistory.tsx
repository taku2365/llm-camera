"use client"

import { useState } from "react"
import { EditParams } from "@/lib/types"

interface ImageHistoryItem {
  id: string
  imageData: ImageData | null
  jpegDataUrl: string | null
  params: EditParams
  timestamp: Date
}

interface ImageHistoryProps {
  history: ImageHistoryItem[]
  onRestore: (item: ImageHistoryItem) => void
  currentImageData: ImageData | null
  onCompare?: (item: ImageHistoryItem) => void
  onCompareTwoItems?: (item1: ImageHistoryItem, item2: ImageHistoryItem) => void
  mode?: 'normal' | 'compare'
  onModeChange?: (mode: 'normal' | 'compare') => void
  selectedIndex?: number
  selectedIndices?: number[]
  onSelectionChange?: (indices: number[]) => void
}

export default function ImageHistory({ 
  history, 
  onRestore, 
  currentImageData, 
  onCompare, 
  onCompareTwoItems,
  mode = 'normal',
  onModeChange,
  selectedIndex,
  selectedIndices = [],
  onSelectionChange
}: ImageHistoryProps) {
  const [internalMode, setInternalMode] = useState<'normal' | 'compare'>(mode)
  const [internalSelection, setInternalSelection] = useState<number[]>(selectedIndices)
  
  const currentMode = onModeChange ? mode : internalMode
  const currentSelection = onSelectionChange ? selectedIndices : internalSelection
  
  const handleModeChange = (newMode: 'normal' | 'compare') => {
    if (onModeChange) {
      onModeChange(newMode)
    } else {
      setInternalMode(newMode)
    }
    // Clear selection when switching modes
    if (onSelectionChange) {
      onSelectionChange([])
    } else {
      setInternalSelection([])
    }
  }
  
  const handleSelectItem = (index: number) => {
    if (currentMode === 'normal') {
      // In normal mode, only one selection
      const newSelection = currentSelection.includes(index) ? [] : [index]
      if (onSelectionChange) {
        onSelectionChange(newSelection)
      } else {
        setInternalSelection(newSelection)
      }
      // Immediately show the cached image
      if (newSelection.length === 1) {
        const item = history[index]
        if (item && item.jpegDataUrl) {
          onRestore(item)
        }
      }
    } else {
      // In compare mode, up to two selections
      let newSelection: number[]
      if (currentSelection.includes(index)) {
        newSelection = currentSelection.filter(i => i !== index)
      } else if (currentSelection.length >= 2) {
        newSelection = [currentSelection[1], index]
      } else {
        newSelection = [...currentSelection, index]
      }
      if (onSelectionChange) {
        onSelectionChange(newSelection)
      } else {
        setInternalSelection(newSelection)
      }
    }
  }

  const handleCompareSelected = () => {
    if (currentSelection.length === 2 && onCompareTwoItems) {
      const item1 = history[currentSelection[0]]
      const item2 = history[currentSelection[1]]
      if (item1 && item2) {
        onCompareTwoItems(item1, item2)
      }
    }
  }

  if (history.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-medium text-white mb-4">History</h3>
        <p className="text-gray-400 text-sm">No history yet. Process an image to see history.</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-medium text-white">
            History <span className="text-sm text-gray-400">({history.length})</span>
          </h3>
        </div>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => handleModeChange('normal')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              currentMode === 'normal' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => handleModeChange('compare')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              currentMode === 'compare' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Compare
          </button>
          {currentMode === 'compare' && currentSelection.length === 2 && (
            <button
              onClick={handleCompareSelected}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 ml-auto"
            >
              Show Comparison
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {currentMode === 'normal' 
            ? 'Click to view any cached version' 
            : 'Select two versions to compare'}
        </p>
      </div>
      <div className="space-y-2">
        {history.map((item, index) => {
          const timeAgo = getTimeAgo(item.timestamp)
          const isSelected = currentSelection.includes(index)
          
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-2 rounded transition-colors cursor-pointer ${
                isSelected ? 'bg-blue-900/30 border border-blue-600' : 'hover:bg-gray-700'
              }`}
              onClick={() => handleSelectItem(index)}
            >
              <div className="flex items-center justify-center w-6 h-6 text-sm font-medium rounded ${
                isSelected ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
              }">
                {index}
              </div>
              <div 
                className="w-20 h-15 bg-gray-700 rounded overflow-hidden"
              >
                {item.jpegDataUrl ? (
                  <img 
                    src={item.jpegDataUrl} 
                    alt={`History ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white">
                  #{index} - {timeAgo}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  Exp: {item.params.exposure.toFixed(1)}, 
                  Cont: {item.params.contrast}, 
                  Sat: {item.params.saturation}
                </div>
              </div>
              {currentMode === 'compare' && currentSelection.length < 2 && (
                <div className="text-xs text-gray-500">
                  {currentSelection.length === 0 ? 'Select 2' : 'Select 1 more'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getTimeAgo(timestamp: Date): string {
  const seconds = Math.floor((new Date().getTime() - timestamp.getTime()) / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}