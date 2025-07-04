"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import ImageViewer from "@/app/components/editor/ImageViewer"
import Histogram from "@/app/components/editor/Histogram"
import BasicAdjustments from "@/app/components/editor/BasicAdjustments"
import AdvancedAdjustments from "@/app/components/editor/AdvancedAdjustments"
import ComparisonDebugger from "@/app/components/editor/ComparisonDebugger"
import ImageHistory from "@/app/components/editor/ImageHistory"
import ExportDialog from "@/app/components/editor/ExportDialog"
import { EditParams } from "@/lib/types"
import { usePhotosStore } from "@/lib/store/photos"
import { useLibRaw } from "@/lib/hooks/useLibRaw"
import { imageDataToJpeg, jpegToImageData } from "@/lib/utils/image-utils"

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
  const [currentComparisonData, setCurrentComparisonData] = useState<ImageData | null>(null)
  const [imageHistory, setImageHistory] = useState<Array<{
    id: string
    imageData: ImageData | null
    jpegDataUrl: string | null
    params: EditParams
    timestamp: Date
  }>>([])
  const [displayImageData, setDisplayImageData] = useState<ImageData | null>(null)
  const [historyMode, setHistoryMode] = useState<'single' | 'compare'>('single')
  const [historySelection, setHistorySelection] = useState<number[]>([])
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [shouldAddToHistory, setShouldAddToHistory] = useState(false)
  const previousIsProcessingRef = useRef(false)
  
  // Use refs for immediate access in event handlers
  const previousImageDataRef = useRef(previousImageData)
  
  // Keep refs in sync with state
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

  // Update display image when processing completes
  useEffect(() => {
    if (imageData) {
      setDisplayImageData(imageData)
    }
  }, [imageData])
  
  // Detect when processing completes and add to history
  useEffect(() => {
    // Check if processing just completed (was true, now false)
    if (previousIsProcessingRef.current && !isProcessing && shouldAddToHistory && imageData && lastProcessedParams) {
      const addToHistory = async () => {
        try {
          const jpegDataUrl = await imageDataToJpeg(imageData)
          
          setImageHistory(prev => {
            // Add new history item
            const newHistory = [{
              id: Date.now().toString(),
              imageData: null,
              jpegDataUrl: jpegDataUrl,
              params: { ...lastProcessedParams }, // Clone to avoid reference issues
              timestamp: new Date()
            }, ...prev]
            
            return newHistory
          })
        } catch (err) {
          console.error('Failed to cache image as JPEG:', err)
        } finally {
          // Reset the flag
          setShouldAddToHistory(false)
        }
      }
      
      addToHistory()
    }
    
    // Update the ref for next render
    previousIsProcessingRef.current = isProcessing
  }, [isProcessing, shouldAddToHistory, imageData, lastProcessedParams])
  
  // Manual processing function
  const handleProcess = useCallback(async () => {
    if (!photo?.file || isLoading || isProcessing) return
    
    setShouldAddToHistory(true) // Mark that we want to add to history when done
    process(editParams)
    setLastProcessedParams({ ...editParams }) // Clone to avoid reference issues
    setHasUnsavedChanges(false)
  }, [photo?.file, isLoading, isProcessing, process, editParams])
  
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
  const handleRestoreFromHistory = useCallback(async (item: {
    id: string
    imageData: ImageData | null
    jpegDataUrl: string | null
    params: EditParams
    timestamp: Date
  }) => {
    // If we have cached JPEG, show it immediately without re-processing
    if (item.jpegDataUrl) {
      try {
        const restoredImageData = await jpegToImageData(item.jpegDataUrl)
        setDisplayImageData(restoredImageData)
        // Clear any comparison state in single mode
        if (historyMode === 'single') {
          setPreviousImageData(null)
          setCurrentComparisonData(null)
        }
        // Update edit params to match
        setEditParams(item.params)
        setLastProcessedParams(item.params)
        setHasUnsavedChanges(false)
      } catch (err) {
        console.error('Failed to restore from JPEG cache:', err)
        // Fall back to re-processing if cache fails
        process(item.params)
      }
    } else {
      // No cache, need to re-process
      process(item.params)
    }
  }, [process, historyMode])
  
  // Compare with history item
  const handleCompareWithHistory = useCallback(async (item: {
    id: string
    imageData: ImageData | null
    jpegDataUrl: string | null
    params: EditParams
    timestamp: Date
  }) => {
    // Convert JPEG back to ImageData for comparison
    if (item.jpegDataUrl) {
      try {
        const restoredImageData = await jpegToImageData(item.jpegDataUrl)
        setPreviousImageData(restoredImageData)
      } catch (err) {
        console.error('Failed to restore image from JPEG:', err)
      }
    }
  }, [])
  
  // Compare two history items
  const handleCompareTwoItems = useCallback(async (item1: {
    id: string
    imageData: ImageData | null
    jpegDataUrl: string | null
    params: EditParams
    timestamp: Date
  }, item2: {
    id: string
    imageData: ImageData | null
    jpegDataUrl: string | null
    params: EditParams
    timestamp: Date
  }) => {
    try {
      if (item1.jpegDataUrl && item2.jpegDataUrl) {
        // Convert both JPEGs to ImageData without triggering processing
        const [imageData1, imageData2] = await Promise.all([
          jpegToImageData(item1.jpegDataUrl),
          jpegToImageData(item2.jpegDataUrl)
        ])
        
        // Set both images for comparison without processing
        setPreviousImageData(imageData1)
        setDisplayImageData(imageData2)
        setCurrentComparisonData(null)
        
        // Update params to match item2 without processing
        setEditParams(item2.params)
        setLastProcessedParams(item2.params)
        setHasUnsavedChanges(false)
      }
    } catch (err) {
      console.error('Failed to compare two history items:', err)
    }
  }, [])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      // Space: Process image
      if (e.key === ' ' && !isProcessing && hasUnsavedChanges) {
        e.preventDefault()
        handleProcess()
      }
      // Ctrl/Cmd + E: Export
      else if ((e.key === 'e' || e.key === 'E') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setShowExportDialog(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isProcessing, hasUnsavedChanges, handleProcess])

  return (
    <div className="h-full flex" data-testid="editor-container">
      {/* Main viewing area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Histogram and Process Button */}
        <div className="h-32 bg-gray-800 border-b border-gray-700">
          <div className="h-24 px-4 py-2">
            <Histogram imageData={imageData} />
          </div>
          <div className="px-4 pb-2 flex justify-between">
            <button
              onClick={() => setShowExportDialog(true)}
              disabled={imageHistory.length === 0}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                imageHistory.length === 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
              }`}
            >
              Export ({imageHistory.length})
            </button>
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
            imageData={displayImageData || imageData}
            previousImageData={previousImageData}
            currentComparisonData={currentComparisonData}
            showComparison={historyMode === 'compare' && historySelection.length === 2}
            isProcessing={isProcessing || isLoading}
          />
          {error && (
            <div className="absolute bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded">
              Error: {error}
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
            currentImageData={displayImageData || imageData}
            onCompare={handleCompareWithHistory}
            onCompareTwoItems={handleCompareTwoItems}
            mode={historyMode}
            onModeChange={setHistoryMode}
            selectedIndices={historySelection}
            onSelectionChange={setHistorySelection}
          />
        </div>
      </aside>
      
      {/* Debug info for development */}
      {typeof window !== 'undefined' && typeof process !== 'undefined' && process.env?.NODE_ENV === 'development' && (
        <ComparisonDebugger
          showComparison={historyMode === 'compare' && historySelection.length === 2}
          previousImageData={previousImageData}
          historyMode={historyMode}
          historySelection={historySelection}
          historyCount={imageHistory.length}
        />
      )}
      
      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        history={imageHistory}
        currentImageData={imageData}
        currentParams={editParams}
      />
    </div>
  )
}