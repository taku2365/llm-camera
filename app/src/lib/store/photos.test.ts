import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePhotosStore } from './photos'
import { Photo } from '@/lib/types'

describe('Photos Store', () => {
  // Helper to create mock photo
  const createMockPhoto = (id: string, overrides?: Partial<Photo>): Photo => ({
    id,
    filename: `photo-${id}.raw`,
    size: 1024 * 1024, // 1MB
    type: 'image/raw',
    timestamp: new Date(),
    metadata: {
      width: 6000,
      height: 4000,
      camera: 'Sony A7IV',
      iso: 100,
      aperture: 2.8,
      shutterSpeed: '1/100',
      focalLength: 50,
    },
    ...overrides,
  })

  // Create mock file
  const createMockFile = (name: string) => 
    new File(['mock content'], name, { type: 'image/raw' })

  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => usePhotosStore())
    act(() => {
      // Clear all photos
      const photos = Array.from(result.current.photos.keys())
      photos.forEach(id => result.current.removePhoto(id))
      // Reset current photo
      result.current.setCurrentPhoto('')
    })
  })

  describe('addPhoto', () => {
    it('should add a photo to the store', () => {
      const { result } = renderHook(() => usePhotosStore())
      const mockPhoto = createMockPhoto('1')
      
      act(() => {
        result.current.addPhoto(mockPhoto)
      })
      
      expect(result.current.photos.size).toBe(1)
      expect(result.current.photos.get('1')).toEqual(mockPhoto)
    })

    it('should add a photo with file', () => {
      const { result } = renderHook(() => usePhotosStore())
      const mockPhoto = createMockPhoto('1')
      const mockFile = createMockFile('photo.raw')
      
      act(() => {
        result.current.addPhoto(mockPhoto, mockFile)
      })
      
      const storedPhoto = result.current.photos.get('1')
      expect(storedPhoto?.file).toBe(mockFile)
    })

    it('should handle multiple photos', () => {
      const { result } = renderHook(() => usePhotosStore())
      const photos = [
        createMockPhoto('1'),
        createMockPhoto('2'),
        createMockPhoto('3'),
      ]
      
      act(() => {
        photos.forEach(photo => result.current.addPhoto(photo))
      })
      
      expect(result.current.photos.size).toBe(3)
      expect(result.current.photos.get('2')).toEqual(photos[1])
    })

    it('should overwrite existing photo with same id', () => {
      const { result } = renderHook(() => usePhotosStore())
      const photo1 = createMockPhoto('1', { filename: 'first.raw' })
      const photo2 = createMockPhoto('1', { filename: 'second.raw' })
      
      act(() => {
        result.current.addPhoto(photo1)
        result.current.addPhoto(photo2)
      })
      
      expect(result.current.photos.size).toBe(1)
      expect(result.current.photos.get('1')?.filename).toBe('second.raw')
    })
  })

  describe('getPhoto', () => {
    it('should return photo by id', () => {
      const { result } = renderHook(() => usePhotosStore())
      const mockPhoto = createMockPhoto('1')
      
      act(() => {
        result.current.addPhoto(mockPhoto)
      })
      
      const retrieved = result.current.getPhoto('1')
      expect(retrieved).toEqual(mockPhoto)
    })

    it('should return undefined for non-existent id', () => {
      const { result } = renderHook(() => usePhotosStore())
      
      const retrieved = result.current.getPhoto('non-existent')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('getCurrentPhoto', () => {
    it('should return current photo when set', () => {
      const { result } = renderHook(() => usePhotosStore())
      const mockPhoto = createMockPhoto('1')
      
      act(() => {
        result.current.addPhoto(mockPhoto)
        result.current.setCurrentPhoto('1')
      })
      
      const current = result.current.getCurrentPhoto()
      expect(current).toEqual(mockPhoto)
    })

    it('should return undefined when no current photo', () => {
      const { result } = renderHook(() => usePhotosStore())
      
      const current = result.current.getCurrentPhoto()
      expect(current).toBeUndefined()
    })

    it('should return undefined when current photo id is invalid', () => {
      const { result } = renderHook(() => usePhotosStore())
      
      act(() => {
        result.current.setCurrentPhoto('non-existent')
      })
      
      const current = result.current.getCurrentPhoto()
      expect(current).toBeUndefined()
    })
  })

  describe('setCurrentPhoto', () => {
    it('should set current photo id', () => {
      const { result } = renderHook(() => usePhotosStore())
      
      act(() => {
        result.current.setCurrentPhoto('123')
      })
      
      expect(result.current.currentPhotoId).toBe('123')
    })

    it('should update current photo when changed', () => {
      const { result } = renderHook(() => usePhotosStore())
      const photo1 = createMockPhoto('1')
      const photo2 = createMockPhoto('2')
      
      act(() => {
        result.current.addPhoto(photo1)
        result.current.addPhoto(photo2)
        result.current.setCurrentPhoto('1')
      })
      
      expect(result.current.getCurrentPhoto()).toEqual(photo1)
      
      act(() => {
        result.current.setCurrentPhoto('2')
      })
      
      expect(result.current.getCurrentPhoto()).toEqual(photo2)
    })
  })

  describe('updatePhoto', () => {
    it('should update existing photo', () => {
      const { result } = renderHook(() => usePhotosStore())
      const mockPhoto = createMockPhoto('1')
      
      act(() => {
        result.current.addPhoto(mockPhoto)
        result.current.updatePhoto('1', { 
          filename: 'updated.raw',
          metadata: {
            ...mockPhoto.metadata!,
            iso: 200
          }
        })
      })
      
      const updated = result.current.getPhoto('1')
      expect(updated?.filename).toBe('updated.raw')
      expect(updated?.metadata?.iso).toBe(200)
      expect(updated?.metadata?.camera).toBe('Sony A7IV') // Unchanged
    })

    it('should not create photo if id does not exist', () => {
      const { result } = renderHook(() => usePhotosStore())
      
      act(() => {
        result.current.updatePhoto('non-existent', { filename: 'new.raw' })
      })
      
      expect(result.current.photos.size).toBe(0)
    })

    it('should preserve file reference when updating', () => {
      const { result } = renderHook(() => usePhotosStore())
      const mockPhoto = createMockPhoto('1')
      const mockFile = createMockFile('photo.raw')
      
      act(() => {
        result.current.addPhoto(mockPhoto, mockFile)
        result.current.updatePhoto('1', { filename: 'updated.raw' })
      })
      
      const updated = result.current.getPhoto('1')
      expect(updated?.file).toBe(mockFile)
      expect(updated?.filename).toBe('updated.raw')
    })
  })

  describe('removePhoto', () => {
    it('should remove photo by id', () => {
      const { result } = renderHook(() => usePhotosStore())
      const mockPhoto = createMockPhoto('1')
      
      act(() => {
        result.current.addPhoto(mockPhoto)
        result.current.removePhoto('1')
      })
      
      expect(result.current.photos.size).toBe(0)
      expect(result.current.getPhoto('1')).toBeUndefined()
    })

    it('should handle removing non-existent photo', () => {
      const { result } = renderHook(() => usePhotosStore())
      const mockPhoto = createMockPhoto('1')
      
      act(() => {
        result.current.addPhoto(mockPhoto)
        result.current.removePhoto('non-existent')
      })
      
      expect(result.current.photos.size).toBe(1)
    })

    it('should clear currentPhotoId when removing current photo', () => {
      const { result } = renderHook(() => usePhotosStore())
      const mockPhoto = createMockPhoto('1')
      
      act(() => {
        result.current.addPhoto(mockPhoto)
        result.current.setCurrentPhoto('1')
      })
      
      expect(result.current.currentPhotoId).toBe('1')
      
      act(() => {
        result.current.removePhoto('1')
      })
      
      expect(result.current.currentPhotoId).toBeNull()
    })

    it('should not clear currentPhotoId when removing different photo', () => {
      const { result } = renderHook(() => usePhotosStore())
      const photo1 = createMockPhoto('1')
      const photo2 = createMockPhoto('2')
      
      act(() => {
        result.current.addPhoto(photo1)
        result.current.addPhoto(photo2)
        result.current.setCurrentPhoto('1')
        result.current.removePhoto('2')
      })
      
      expect(result.current.currentPhotoId).toBe('1')
      expect(result.current.photos.size).toBe(1)
    })
  })

  describe('Store Integration', () => {
    it('should handle complex workflow', () => {
      const { result } = renderHook(() => usePhotosStore())
      
      // Add multiple photos
      const photos = Array.from({ length: 5 }, (_, i) => 
        createMockPhoto(`photo-${i}`)
      )
      
      act(() => {
        photos.forEach(photo => result.current.addPhoto(photo))
      })
      
      expect(result.current.photos.size).toBe(5)
      
      // Set current photo
      act(() => {
        result.current.setCurrentPhoto('photo-2')
      })
      
      expect(result.current.getCurrentPhoto()?.id).toBe('photo-2')
      
      // Update current photo
      act(() => {
        result.current.updatePhoto('photo-2', { 
          filename: 'edited.raw' 
        })
      })
      
      expect(result.current.getCurrentPhoto()?.filename).toBe('edited.raw')
      
      // Remove some photos
      act(() => {
        result.current.removePhoto('photo-0')
        result.current.removePhoto('photo-4')
      })
      
      expect(result.current.photos.size).toBe(3)
      
      // Remove current photo
      act(() => {
        result.current.removePhoto('photo-2')
      })
      
      expect(result.current.currentPhotoId).toBeNull()
      expect(result.current.photos.size).toBe(2)
    })

    it('should maintain immutability', () => {
      const { result } = renderHook(() => usePhotosStore())
      const mockPhoto = createMockPhoto('1')
      
      act(() => {
        result.current.addPhoto(mockPhoto)
      })
      
      const firstMap = result.current.photos
      
      act(() => {
        result.current.updatePhoto('1', { filename: 'new.raw' })
      })
      
      const secondMap = result.current.photos
      
      // Maps should be different instances
      expect(firstMap).not.toBe(secondMap)
      
      // But contain the same number of items
      expect(firstMap.size).toBe(secondMap.size)
    })
  })
})