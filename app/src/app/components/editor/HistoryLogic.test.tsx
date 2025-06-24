import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useState, useEffect, useRef } from 'react'

// Test the history addition logic in isolation
describe('History Addition Logic', () => {
  it('should only add to history after processing completes', () => {
    const mockImageData = new ImageData(100, 100)
    const mockParams = { exposure: 1 }
    
    // Simulate the state and logic from the editor
    const { result } = renderHook(() => {
      const [isProcessing, setIsProcessing] = useState(false)
      const [shouldAddToHistory, setShouldAddToHistory] = useState(false)
      const [imageData, setImageData] = useState<ImageData | null>(null)
      const [lastProcessedParams, setLastProcessedParams] = useState<any>(null)
      const [history, setHistory] = useState<any[]>([])
      const previousIsProcessingRef = useRef(false)
      
      // The effect that adds to history
      useEffect(() => {
        // Check if processing just completed
        if (previousIsProcessingRef.current && !isProcessing && shouldAddToHistory && imageData && lastProcessedParams) {
          setHistory(prev => [...prev, { params: lastProcessedParams }])
          setShouldAddToHistory(false)
        }
        previousIsProcessingRef.current = isProcessing
      }, [isProcessing, shouldAddToHistory, imageData, lastProcessedParams])
      
      return {
        isProcessing,
        setIsProcessing,
        shouldAddToHistory,
        setShouldAddToHistory,
        imageData,
        setImageData,
        lastProcessedParams,
        setLastProcessedParams,
        history
      }
    })
    
    // Initial state - no history
    expect(result.current.history).toHaveLength(0)
    
    // Start processing
    act(() => {
      result.current.setShouldAddToHistory(true)
      result.current.setIsProcessing(true)
      result.current.setLastProcessedParams(mockParams)
    })
    
    // Still processing - no history added yet
    expect(result.current.history).toHaveLength(0)
    
    // Processing completes with image data
    act(() => {
      result.current.setImageData(mockImageData)
      result.current.setIsProcessing(false)
    })
    
    // Now history should be added
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].params).toEqual(mockParams)
  })
  
  it('should not add to history if shouldAddToHistory is false', () => {
    const mockImageData = new ImageData(100, 100)
    
    const { result } = renderHook(() => {
      const [isProcessing, setIsProcessing] = useState(false)
      const [shouldAddToHistory, setShouldAddToHistory] = useState(false)
      const [imageData, setImageData] = useState<ImageData | null>(null)
      const [history, setHistory] = useState<any[]>([])
      const previousIsProcessingRef = useRef(false)
      
      useEffect(() => {
        if (previousIsProcessingRef.current && !isProcessing && shouldAddToHistory && imageData) {
          setHistory(prev => [...prev, { id: Date.now() }])
          setShouldAddToHistory(false)
        }
        previousIsProcessingRef.current = isProcessing
      }, [isProcessing, shouldAddToHistory, imageData])
      
      return {
        isProcessing,
        setIsProcessing,
        shouldAddToHistory,
        imageData,
        setImageData,
        history
      }
    })
    
    // Simulate processing without setting shouldAddToHistory
    act(() => {
      result.current.setIsProcessing(true)
      result.current.setImageData(mockImageData)
    })
    
    act(() => {
      result.current.setIsProcessing(false)
    })
    
    // No history should be added
    expect(result.current.history).toHaveLength(0)
  })
  
  it('should handle multiple processing cycles correctly', () => {
    const { result } = renderHook(() => {
      const [isProcessing, setIsProcessing] = useState(false)
      const [shouldAddToHistory, setShouldAddToHistory] = useState(false)
      const [imageData, setImageData] = useState<ImageData | null>(null)
      const [history, setHistory] = useState<any[]>([])
      const previousIsProcessingRef = useRef(false)
      const [processCount, setProcessCount] = useState(0)
      
      useEffect(() => {
        if (previousIsProcessingRef.current && !isProcessing && shouldAddToHistory && imageData) {
          setHistory(prev => [...prev, { id: processCount }])
          setShouldAddToHistory(false)
        }
        previousIsProcessingRef.current = isProcessing
      }, [isProcessing, shouldAddToHistory, imageData, processCount])
      
      const startProcessing = () => {
        setShouldAddToHistory(true)
        setIsProcessing(true)
        setProcessCount(prev => prev + 1)
      }
      
      const completeProcessing = () => {
        setImageData(new ImageData(100, 100))
        setIsProcessing(false)
      }
      
      return {
        history,
        startProcessing,
        completeProcessing
      }
    })
    
    // Process 1
    act(() => {
      result.current.startProcessing()
    })
    act(() => {
      result.current.completeProcessing()
    })
    
    expect(result.current.history).toHaveLength(1)
    expect(result.current.history[0].id).toBe(1)
    
    // Process 2
    act(() => {
      result.current.startProcessing()
    })
    act(() => {
      result.current.completeProcessing()
    })
    
    expect(result.current.history).toHaveLength(2)
    expect(result.current.history[1].id).toBe(2)
    
    // Process 3
    act(() => {
      result.current.startProcessing()
    })
    act(() => {
      result.current.completeProcessing()
    })
    
    expect(result.current.history).toHaveLength(3)
    expect(result.current.history[2].id).toBe(3)
  })
})