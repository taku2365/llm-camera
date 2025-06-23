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
}

export default function ImageHistory({ history, onRestore, currentImageData, onCompare, onCompareTwoItems }: ImageHistoryProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id)
      }
      if (prev.length >= 2) {
        return [prev[1], id]
      }
      return [...prev, id]
    })
  }

  const handleCompareSelected = () => {
    if (selectedItems.length === 2 && onCompareTwoItems) {
      const item1 = history.find(item => item.id === selectedItems[0])
      const item2 = history.find(item => item.id === selectedItems[1])
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">
          History <span className="text-sm text-gray-400">({history.length}/10)</span>
        </h3>
        {selectedItems.length === 2 && (
          <button
            onClick={handleCompareSelected}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Compare Selected
          </button>
        )}
      </div>
      <div className="space-y-2">
        {history.map((item, index) => {
          const timeAgo = getTimeAgo(item.timestamp)
          const isSelected = selectedItems.includes(item.id)
          
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-2 rounded transition-colors ${
                isSelected ? 'bg-blue-900/30 border border-blue-600' : 'hover:bg-gray-700'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleSelectItem(item.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <div 
                className="w-20 h-15 bg-gray-700 rounded overflow-hidden cursor-pointer"
                onClick={() => onRestore(item)}
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
                  {index === 0 ? 'Current' : `${timeAgo}`}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  Exp: {item.params.exposure.toFixed(1)}, 
                  Cont: {item.params.contrast}, 
                  Sat: {item.params.saturation}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRestore(item)
                  }}
                  className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-600"
                  title="Restore this version"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </button>
                {onCompare && index > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onCompare(item)
                    }}
                    className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-600"
                    title="Compare with current"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                )}
              </div>
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