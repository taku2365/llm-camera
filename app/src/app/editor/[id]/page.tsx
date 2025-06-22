"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import ImageViewer from "@/app/components/editor/ImageViewer"
import Histogram from "@/app/components/editor/Histogram"
import BasicAdjustments from "@/app/components/editor/BasicAdjustments"
import AdvancedAdjustments from "@/app/components/editor/AdvancedAdjustments"
import ComparisonDebugger from "@/app/components/editor/ComparisonDebugger"
import ImageHistory from "@/app/components/editor/ImageHistory"
import { EditParams } from "@/lib/types"
import { usePhotosStore } from "@/lib/store/photos"
import { useLibRaw } from "@/lib/hooks/useLibRaw"

export default function EditorPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { getPhoto } = usePhotosStore()
  const photo = getPhoto(id)
  
  const [editParams, setEditParams] = useState<EditParams>({
    // Basic adjustments
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    
    // Color
    temperature: 0,
    tint: 0,
    vibrance: 0,
    saturation: 0,
    
    // Advanced settings
    cropEnabled: false,
    cropArea: { x1: 0, y1: 0, x2: 6000, y2: 4000 },
    userFlip: 0,
    shotSelect: 0,
    noiseThreshold: 100,
    medianPasses: 0,
    dcbIterations: 2,
    dcbEnhance: false,
    outputBPS: 8,
  })
  
  const { loadFile, process, imageData, metadata, thumbnail, isLoading, isProcessing, error } = useLibRaw()
  const loadedFileRef = useRef<File | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastProcessedParams, setLastProcessedParams] = useState<EditParams | null>(null)
  const [previousImageData, setPreviousImageData] = useState<ImageData | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonMode, setComparisonMode] = useState<'slider' | 'side-by-side'>('slider')
  const [imageHistory, setImageHistory] = useState<Array<{
    id: string
    imageData: ImageData
    params: EditParams
    timestamp: Date
  }>>([])
  
  // Use refs for immediate access in event handlers
  const showComparisonRef = useRef(showComparison)
  const previousImageDataRef = useRef(previousImageData)
  
  // Keep refs in sync with state
  useEffect(() => {
    showComparisonRef.current = showComparison
  }, [showComparison])
  
  useEffect(() => {
    previousImageDataRef.current = previousImageData
  }, [previousImageData])

  // Load the RAW file when component mounts
  useEffect(() => {
    if (!photo?.file) {
      // If no photo found, redirect to library
      router.push("/library")
      return
    }

    // Only load if it's a different file
    if (loadedFileRef.current !== photo.file) {
      loadedFileRef.current = photo.file
      loadFile(photo.file)
    }
  }, [photo, loadFile, router])

  // Manual processing function
  const handleProcess = useCallback(() => {
    if (!photo?.file || isLoading || isProcessing) return
    
    // Store current image as previous before processing new one
    if (imageData) {
      setPreviousImageData(imageData)
      setShowComparison(true)
      
      // Add to history (keep last 10 images)
      setImageHistory(prev => {
        const newHistory = [{
          id: Date.now().toString(),
          imageData: imageData,
          params: lastProcessedParams || editParams,
          timestamp: new Date()
        }, ...prev].slice(0, 10)
        return newHistory
      })
    }
    
    process(editParams)
    setLastProcessedParams(editParams)
    setHasUnsavedChanges(false)
  }, [photo?.file, isLoading, isProcessing, imageData, process, editParams, lastProcessedParams])
  
  // Check if parameters have changed
  useEffect(() => {
    if (lastProcessedParams && JSON.stringify(editParams) !== JSON.stringify(lastProcessedParams)) {
      setHasUnsavedChanges(true)
    }
  }, [editParams, lastProcessedParams])

  // Update crop area when metadata is loaded
  useEffect(() => {
    if (metadata && !editParams.cropArea) {
      setEditParams(prev => ({
        ...prev,
        cropArea: { x1: 0, y1: 0, x2: metadata.width, y2: metadata.height }
      }))
    }
  }, [metadata, editParams.cropArea])

  const handleParamChange = (param: keyof EditParams, value: any) => {
    setEditParams(prev => ({
      ...prev,
      [param]: value
    }))
  }
  
  // Restore from history
  const handleRestoreFromHistory = useCallback((item: {
    id: string
    imageData: ImageData
    params: EditParams
    timestamp: Date
  }) => {
    // Set the image data directly (this is already processed)
    if (imageData) {
      setPreviousImageData(imageData)
    }
    
    // Update edit params
    setEditParams(item.params)
    setLastProcessedParams(item.params)
    setHasUnsavedChanges(false)
    
    // The restored image becomes the current image
    // We can't set imageData directly, so we need to trigger a process with the restored params
    process(item.params)
  }, [imageData, process])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      // Convert to lowercase to handle caps lock
      const key = e.key.toLowerCase()
      
      // C key: Toggle comparison
      if (key === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        console.log('[DEBUG] C key pressed, previousImage exists:', !!previousImageDataRef.current)
        
        // Only toggle if we have a previous image
        if (previousImageDataRef.current) {
          const newShowComparison = !showComparisonRef.current
          console.log('[DEBUG] Toggling comparison from', showComparisonRef.current, 'to', newShowComparison)
          setShowComparison(newShowComparison)
        }
      }
      // M key: Change comparison mode
      else if (key === 'm' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        console.log('[DEBUG] M key pressed, showComparison:', showComparisonRef.current)
        
        // Only change mode if comparison is currently shown
        if (showComparisonRef.current && previousImageDataRef.current) {
          setComparisonMode(mode => {
            const newMode = mode === 'slider' ? 'side-by-side' : 'slider'
            console.log('[DEBUG] Changing mode from', mode, 'to', newMode)
            return newMode
          })
        }
      }
      // Space: Process image
      else if (e.key === ' ' && !isProcessing && hasUnsavedChanges) {
        e.preventDefault()
        handleProcess()
      }
      // Ctrl/Cmd + Z: Undo (restore previous)
      else if ((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault()
        console.log('[DEBUG] Undo triggered')
        
        // Find the next item in history
        if (imageHistory.length > 0) {
          const currentIndex = 0 // Since we always add to the beginning
          const nextItem = imageHistory[currentIndex]
          if (nextItem) {
            handleRestoreFromHistory(nextItem)
          }
        }
      }
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
      else if (((e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey) && e.shiftKey) || 
               ((e.key === 'y' || e.key === 'Y') && (e.ctrlKey || e.metaKey))) {
        e.preventDefault()
        console.log('[DEBUG] Redo triggered')
        
        // For now, just restore the most recent if available
        if (imageHistory.length > 1) {
          handleRestoreFromHistory(imageHistory[1])
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isProcessing, hasUnsavedChanges, handleProcess, imageHistory, handleRestoreFromHistory])

  return (
    <div className="h-full flex" data-testid="editor-container">
      {/* Main viewing area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Histogram and Process Button */}
        <div className="h-32 bg-gray-800 border-b border-gray-700">
          <div className="h-24 px-4 py-2">
            <Histogram imageData={imageData} />
          </div>
          <div className="px-4 pb-2 flex justify-end">
            <button
              onClick={handleProcess}
              disabled={isProcessing || isLoading || !photo?.file}
              className={`px-6 py-2 rounded font-medium transition-colors relative ${
                isProcessing || isLoading || !photo?.file
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : hasUnsavedChanges
                  ? 'bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isProcessing ? 'Processing...' : hasUnsavedChanges ? 'Process (unsaved)' : 'Process'}
              {hasUnsavedChanges && !isProcessing && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>
        
        {/* Image viewer */}
        <div className="flex-1 relative">
          <ImageViewer 
            imageData={imageData}
            previousImageData={previousImageData}
            showComparison={showComparison}
            comparisonMode={comparisonMode}
            isProcessing={isProcessing || isLoading}
          />
          {error && (
            <div className="absolute bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded">
              Error: {error}
            </div>
          )}
          {previousImageData && (
            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-2 rounded text-sm">
              <div>Press &quot;C&quot; to toggle comparison</div>
              {showComparison && <div>Press &quot;M&quot; to change mode</div>}
            </div>
          )}
        </div>
      </div>

      {/* Right panel with adjustments */}
      <aside className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
        {/* Thumbnail preview */}
        {thumbnail && (
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Thumbnail Preview</h3>
            <div className="relative bg-gray-900 rounded border border-gray-600 overflow-hidden">
              <img 
                src={thumbnail} 
                alt="RAW thumbnail"
                className="w-full h-auto max-h-32 object-contain"
              />
            </div>
          </div>
        )}
        
        <BasicAdjustments
          params={editParams}
          onChange={handleParamChange}
        />
        
        <AdvancedAdjustments
          params={{
            cropEnabled: editParams.cropEnabled || false,
            cropArea: editParams.cropArea || { x1: 0, y1: 0, x2: 6000, y2: 4000 },
            userFlip: editParams.userFlip || 0,
            shotSelect: editParams.shotSelect || 0,
            noiseThreshold: editParams.noiseThreshold || 100,
            medianPasses: editParams.medianPasses || 0,
            dcbIterations: editParams.dcbIterations || 2,
            dcbEnhance: editParams.dcbEnhance || false,
            outputBPS: editParams.outputBPS || 8,
          }}
          onChange={handleParamChange}
          imageWidth={metadata?.width || 6000}
          imageHeight={metadata?.height || 4000}
        />
        
        {/* Image History */}
        <div className="border-t border-gray-700">
          <ImageHistory
            history={imageHistory}
            onRestore={handleRestoreFromHistory}
            currentImageData={imageData}
          />
        </div>
      </aside>
      
      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <ComparisonDebugger
          showComparison={showComparison}
          comparisonMode={comparisonMode}
          previousImageData={previousImageData}
        />
      )}
    </div>
  )
}