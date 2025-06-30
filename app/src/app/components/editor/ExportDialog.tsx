"use client"

import { useState, useEffect } from "react"
import { HistoryItem } from "@/lib/types"

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  history: HistoryItem[]
  currentImageData: ImageData | null
  currentParams: any
}

export default function ExportDialog({
  isOpen,
  onClose,
  history,
  currentImageData,
  currentParams
}: ExportDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [includeSettings, setIncludeSettings] = useState(true)

  useEffect(() => {
    if (!isOpen) {
      setSelectedItems([])
      setIsExporting(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const toggleSelection = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedItems(history.map(item => item.id))
  }

  const deselectAll = () => {
    setSelectedItems([])
  }

  const exportSelected = async () => {
    if (selectedItems.length === 0) return

    setIsExporting(true)

    try {
      const selectedHistoryItems = history.filter(item => selectedItems.includes(item.id))
      
      for (const item of selectedHistoryItems) {
        // Create a link element to download the image
        const link = document.createElement('a')
        link.href = item.jpegDataUrl
        
        // Generate filename with timestamp and index
        const timestamp = new Date(item.timestamp).toISOString().replace(/[:.]/g, '-')
        const index = history.findIndex(h => h.id === item.id)
        link.download = `processed_${timestamp}_v${history.length - index}.jpg`
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Small delay between downloads to avoid browser blocking
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Export settings JSON if requested
      if (includeSettings && selectedHistoryItems.length > 0) {
        const settings = selectedHistoryItems.map(item => ({
          version: history.length - history.findIndex(h => h.id === item.id),
          timestamp: item.timestamp,
          parameters: item.params
        }))
        
        const settingsBlob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
        const settingsUrl = URL.createObjectURL(settingsBlob)
        const link = document.createElement('a')
        link.href = settingsUrl
        link.download = 'processing_settings.json'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(settingsUrl)
      }

      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export images')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-white mb-4">Export Images</h2>
        
        <div className="mb-4 flex justify-between items-center">
          <p className="text-gray-300">
            Select images to export ({selectedItems.length} selected)
          </p>
          <div className="space-x-2">
            <button
              onClick={selectAll}
              className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[50vh] mb-4 space-y-2">
          {history.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center p-3 rounded cursor-pointer transition-colors ${
                selectedItems.includes(item.id)
                  ? 'bg-blue-900/50 border border-blue-600'
                  : 'bg-gray-700/50 hover:bg-gray-700'
              }`}
              onClick={() => toggleSelection(item.id)}
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={() => {}}
                className="mr-3"
              />
              
              <img
                src={item.jpegDataUrl}
                alt={`Version ${history.length - index}`}
                className="w-16 h-16 object-cover rounded mr-3"
              />
              
              <div className="flex-1">
                <div className="text-white font-medium">
                  Version {history.length - index}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  Exp: {item.params.exposure.toFixed(1)}, 
                  Cont: {item.params.contrast}, 
                  Sat: {item.params.saturation}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <label className="flex items-center text-gray-300">
            <input
              type="checkbox"
              checked={includeSettings}
              onChange={(e) => setIncludeSettings(e.target.checked)}
              className="mr-2"
            />
            Export processing settings as JSON
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={exportSelected}
            disabled={selectedItems.length === 0 || isExporting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Exporting...' : `Export ${selectedItems.length} Image${selectedItems.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}