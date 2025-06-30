'use client'

import React, { useState, useEffect } from 'react'
import { useMetaISP } from '@/lib/hooks/useMetaISP'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Sparkles, 
  Smartphone, 
  Camera, 
  Loader2,
  AlertCircle,
  CheckCircle2 
} from 'lucide-react'

interface MetaISPPanelProps {
  librawInstance: any;
  onProcessed?: (imageData: ImageData) => void;
}

export function MetaISPPanel({ librawInstance, onProcessed }: MetaISPPanelProps) {
  const [targetDevice, setTargetDevice] = useState<'auto' | 'iphone' | 'samsung' | 'pixel'>('auto')
  const [showResult, setShowResult] = useState(false)
  
  const {
    isInitialized,
    isProcessing,
    progress,
    error,
    result,
    modelInfo,
    initialize,
    processRAW,
    getRecommendedDevice
  } = useMetaISP({
    targetDevice,
    modelPath: '/models/metaisp.onnx',
    executionProvider: 'webgpu'
  })
  
  // Initialize on mount
  useEffect(() => {
    initialize()
  }, [initialize])
  
  // Update parent when result changes
  useEffect(() => {
    if (result && onProcessed) {
      onProcessed(result)
    }
  }, [result, onProcessed])
  
  // Get recommended device
  useEffect(() => {
    if (librawInstance) {
      const recommended = getRecommendedDevice()
      if (recommended && targetDevice === 'auto') {
        console.log('Recommended device:', recommended)
      }
    }
  }, [librawInstance, getRecommendedDevice, targetDevice])
  
  const handleProcess = async () => {
    if (!librawInstance) return
    
    setShowResult(false)
    const imageData = await processRAW(librawInstance, targetDevice)
    if (imageData) {
      setShowResult(true)
    }
  }
  
  const getProgressValue = () => {
    if (!progress) return 0
    
    const stageWeights = {
      loading: 0.2,
      preparing: 0.3,
      processing: 0.7,
      finalizing: 0.9
    }
    
    const baseProgress = stageWeights[progress.stage] || 0
    const stageProgress = progress.progress / 100
    
    return Math.round((baseProgress + stageProgress * 0.1) * 100)
  }
  
  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'iphone':
        return <Smartphone className="w-4 h-4" />
      case 'samsung':
      case 'pixel':
        return <Camera className="w-4 h-4" />
      default:
        return <Sparkles className="w-4 h-4" />
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold">MetaISP Neural Processing</h3>
      </div>
      
      {/* Model Info */}
      {modelInfo && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="font-medium">Model Ready</span>
          </div>
          <div className="text-xs">
            Provider: {modelInfo.executionProvider}
          </div>
        </div>
      )}
      
      {/* Device Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Target Device Style</label>
        <Select
          value={targetDevice}
          onValueChange={(value: any) => setTargetDevice(value)}
          disabled={isProcessing || !isInitialized}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select device style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">
              <div className="flex items-center gap-2">
                {getDeviceIcon('auto')}
                <span>Auto Detect</span>
              </div>
            </SelectItem>
            <SelectItem value="iphone">
              <div className="flex items-center gap-2">
                {getDeviceIcon('iphone')}
                <span>iPhone Style</span>
              </div>
            </SelectItem>
            <SelectItem value="samsung">
              <div className="flex items-center gap-2">
                {getDeviceIcon('samsung')}
                <span>Samsung Style</span>
              </div>
            </SelectItem>
            <SelectItem value="pixel">
              <div className="flex items-center gap-2">
                {getDeviceIcon('pixel')}
                <span>Pixel Style</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Process Button */}
      <Button
        onClick={handleProcess}
        disabled={!isInitialized || isProcessing || !librawInstance}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Process with MetaISP
          </>
        )}
      </Button>
      
      {/* Progress */}
      {isProcessing && progress && (
        <div className="space-y-2">
          <Progress value={getProgressValue()} className="h-2" />
          <p className="text-sm text-gray-600 text-center">
            {progress.message}
          </p>
        </div>
      )}
      
      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Result Preview */}
      {result && showResult && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Processing Complete</div>
          <div className="border rounded-lg overflow-hidden bg-gray-100">
            <canvas
              ref={(canvas) => {
                if (canvas && result) {
                  const ctx = canvas.getContext('2d')
                  if (ctx) {
                    canvas.width = result.width
                    canvas.height = result.height
                    ctx.putImageData(result, 0, 0)
                  }
                }
              }}
              className="w-full h-auto"
              style={{ maxHeight: '300px', objectFit: 'contain' }}
            />
          </div>
          <div className="text-xs text-gray-600">
            Output: {result.width} × {result.height} pixels
          </div>
        </div>
      )}
      
      {/* Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• MetaISP uses neural networks for RAW processing</p>
        <p>• Mimics device-specific color rendering</p>
        <p>• Requires RGGB Bayer pattern RAW files</p>
      </div>
    </div>
  )
}