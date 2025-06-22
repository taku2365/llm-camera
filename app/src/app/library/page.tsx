"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { usePhotosStore } from "@/lib/store/photos"
import { Photo } from "@/lib/types"

export default function LibraryPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { photos, addPhoto, setCurrentPhoto } = usePhotosStore()
  const photosList = Array.from(photos.values())

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    const rawFiles = files.filter(file => 
      /\.(cr2|cr3|nef|arw|dng|raf|orf|rw2|pef)$/i.test(file.name)
    )
    
    if (rawFiles.length > 0) {
      // Create photo objects and add to store
      const firstPhotoId = `photo-${Date.now()}-0`
      
      rawFiles.forEach((file, index) => {
        const photo: Photo = {
          id: `photo-${Date.now()}-${index}`,
          filename: file.name,
          rawUrl: URL.createObjectURL(file),
          metadata: {
            camera: 'Unknown',
            lens: 'Unknown',
            iso: 0,
            aperture: 0,
            shutterSpeed: '',
            focalLength: 0,
            date: new Date(file.lastModified),
            width: 0,
            height: 0,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        addPhoto(photo, file)
      })
      
      // Set current photo and navigate
      setCurrentPhoto(firstPhotoId)
      router.push(`/editor/${firstPhotoId}`)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const rawFiles = files.filter(file => 
      /\.(cr2|cr3|nef|arw|dng|raf|orf|rw2|pef)$/i.test(file.name)
    )
    
    if (rawFiles.length > 0) {
      // Create photo objects and add to store
      const firstPhotoId = `photo-${Date.now()}-0`
      
      rawFiles.forEach((file, index) => {
        const photo: Photo = {
          id: `photo-${Date.now()}-${index}`,
          filename: file.name,
          rawUrl: URL.createObjectURL(file),
          metadata: {
            camera: 'Unknown',
            lens: 'Unknown',
            iso: 0,
            aperture: 0,
            shutterSpeed: '',
            focalLength: 0,
            date: new Date(file.lastModified),
            width: 0,
            height: 0,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        addPhoto(photo, file)
      })
      
      // Set current photo and navigate
      setCurrentPhoto(firstPhotoId)
      router.push(`/editor/${firstPhotoId}`)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All Photos</h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Import Photos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".cr2,.cr3,.nef,.arw,.dng,.raf,.orf,.rw2,.pef"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </header>

      {/* Photo grid or empty state */}
      <div className="flex-1 p-6">
        {photosList.length === 0 ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`h-full flex items-center justify-center border-2 border-dashed rounded-lg transition-colors ${
              isDragging 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No photos yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Drop RAW files here or click Import Photos
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Supports: CR2, CR3, NEF, ARW, DNG, RAF, ORF, RW2, PEF
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {photosList.map((photo) => (
              <div
                key={photo.id}
                onClick={() => {
                  setCurrentPhoto(photo.id)
                  router.push(`/editor/${photo.id}`)
                }}
                className="aspect-[3/2] bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition"
              >
                {photo.thumbnailUrl ? (
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <span className="text-xs text-center px-2">{photo.filename}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}