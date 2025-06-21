import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Photo Editor - LLM Camera",
  description: "Professional RAW photo editor",
}

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Top toolbar */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a href="/" className="text-gray-400 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
            <h1 className="text-white font-medium">Photo Editor</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm text-gray-300 hover:text-white transition">
              Undo
            </button>
            <button className="px-3 py-1 text-sm text-gray-300 hover:text-white transition">
              Redo
            </button>
            <div className="w-px h-5 bg-gray-600 mx-2" />
            <button className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition">
              Export
            </button>
          </div>
        </div>
      </header>
      
      {/* Main editor area */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}