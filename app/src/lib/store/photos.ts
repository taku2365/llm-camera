import { create } from 'zustand'
import { Photo } from '@/lib/types'

interface PhotoWithFile extends Photo {
  file?: File
}

interface PhotosState {
  photos: Map<string, PhotoWithFile>
  currentPhotoId: string | null
  
  // Actions
  addPhoto: (photo: PhotoWithFile, file?: File) => void
  getPhoto: (id: string) => PhotoWithFile | undefined
  getCurrentPhoto: () => PhotoWithFile | undefined
  setCurrentPhoto: (id: string) => void
  updatePhoto: (id: string, updates: Partial<PhotoWithFile>) => void
  removePhoto: (id: string) => void
}

export const usePhotosStore = create<PhotosState>((set, get) => ({
  photos: new Map(),
  currentPhotoId: null,
  
  addPhoto: (photo, file) => {
    set((state) => {
      const newPhotos = new Map(state.photos)
      newPhotos.set(photo.id, { ...photo, file })
      return { photos: newPhotos }
    })
  },
  
  getPhoto: (id) => {
    return get().photos.get(id)
  },
  
  getCurrentPhoto: () => {
    const state = get()
    if (!state.currentPhotoId) return undefined
    return state.photos.get(state.currentPhotoId)
  },
  
  setCurrentPhoto: (id) => {
    set({ currentPhotoId: id })
  },
  
  updatePhoto: (id, updates) => {
    set((state) => {
      const photo = state.photos.get(id)
      if (!photo) return state
      
      const newPhotos = new Map(state.photos)
      newPhotos.set(id, { ...photo, ...updates })
      return { photos: newPhotos }
    })
  },
  
  removePhoto: (id) => {
    set((state) => {
      const newPhotos = new Map(state.photos)
      newPhotos.delete(id)
      return { 
        photos: newPhotos,
        currentPhotoId: state.currentPhotoId === id ? null : state.currentPhotoId
      }
    })
  },
}))