"use client"

interface ComparisonDebuggerProps {
  showComparison: boolean
  previousImageData: ImageData | null
  historyMode?: 'single' | 'compare'
  historySelection?: number[]
  historyCount?: number
}

export default function ComparisonDebugger({ 
  showComparison, 
  previousImageData,
  historyMode = 'single',
  historySelection = [],
  historyCount = 0
}: ComparisonDebuggerProps) {
  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono space-y-1">
      <div>showComparison: {showComparison ? 'true' : 'false'}</div>
      <div>previousImageData: {previousImageData ? 'exists' : 'null'}</div>
      <div>historyMode: {historyMode}</div>
      <div>historySelection: [{historySelection.join(', ')}]</div>
      <div>historyCount: {historyCount}</div>
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div>History mode controls comparison</div>
      </div>
    </div>
  )
}