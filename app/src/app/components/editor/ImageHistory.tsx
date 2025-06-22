"use client"

import { EditParams } from "@/lib/types"

interface ImageHistoryItem {
  id: string
  imageData: ImageData
  params: EditParams
  timestamp: Date
}

interface ImageHistoryProps {
  history: ImageHistoryItem[]
  onRestore: (item: ImageHistoryItem) => void
  currentImageData: ImageData | null
}

export default function ImageHistory({ history, onRestore, currentImageData }: ImageHistoryProps) {
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
      <h3 className="text-lg font-medium text-white mb-4">
        History <span className="text-sm text-gray-400">({history.length}/10)</span>
      </h3>
      <div className="space-y-2">
        {history.map((item, index) => {
          const timeAgo = getTimeAgo(item.timestamp)
          
          return (
            <div
              key={item.id}
              onClick={() => onRestore(item)}
              className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer transition-colors group"
            >
              <div className="w-20 h-15 bg-gray-700 rounded flex items-center justify-center">
                <span className="text-xs text-gray-400">#{index + 1}</span>
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
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                title="Restore this version"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
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