"use client"

interface ComparisonDebuggerProps {
  showComparison: boolean
  comparisonMode: 'slider' | 'side-by-side'
  previousImageData: ImageData | null
}

export default function ComparisonDebugger({ 
  showComparison, 
  comparisonMode, 
  previousImageData 
}: ComparisonDebuggerProps) {
  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono space-y-1">
      <div>showComparison: {showComparison ? 'true' : 'false'}</div>
      <div>comparisonMode: {comparisonMode}</div>
      <div>previousImageData: {previousImageData ? 'exists' : 'null'}</div>
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div>Press C to toggle comparison</div>
        <div>Press M to change mode</div>
      </div>
    </div>
  )
}