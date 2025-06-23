export async function imageDataToJpeg(imageData: ImageData): Promise<string> {
  // Create a canvas to convert ImageData to JPEG
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get canvas context')
  
  // Draw the ImageData onto the canvas
  ctx.putImageData(imageData, 0, 0)
  
  // Convert to JPEG data URL
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to convert to JPEG'))
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert to data URL'))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    }, 'image/jpeg', 0.9)
  })
}

export async function jpegToImageData(jpegDataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      resolve(imageData)
    }
    
    img.onerror = reject
    img.src = jpegDataUrl
  })
}