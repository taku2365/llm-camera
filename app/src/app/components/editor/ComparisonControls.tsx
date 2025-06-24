"use client"

interface ComparisonControlsProps {
  showComparison: boolean
  hasComparison: boolean
  onToggleComparison: () => void
}

export default function ComparisonControls({
  showComparison,
  hasComparison,
  onToggleComparison
}: ComparisonControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex gap-2 z-20">
      {hasComparison && (
        <>
          <button
            onClick={onToggleComparison}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              showComparison
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-black/50 text-white hover:bg-black/70'
            }`}
          >
            {showComparison ? 'Hide Comparison' : 'Show Comparison'}
          </button>
        </>
      )}
    </div>
  )
}