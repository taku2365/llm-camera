import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdvancedAdjustments from './AdvancedAdjustments'

describe('AdvancedAdjustments', () => {
  const mockOnChange = vi.fn()
  
  const defaultParams = {
    cropEnabled: false,
    cropArea: { x1: 0, y1: 0, x2: 6000, y2: 4000 },
    userFlip: 0,
    shotSelect: 0,
    noiseThreshold: 100,
    medianPasses: 0,
    dcbIterations: 2,
    dcbEnhance: false,
    outputBPS: 8,
  }

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe('Expand/Collapse', () => {
    it('should be collapsed by default', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      expect(screen.queryByText('Crop')).not.toBeInTheDocument()
      expect(screen.queryByText('Rotation')).not.toBeInTheDocument()
    })

    it('should expand when header is clicked', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      const expandButton = screen.getByText('Advanced Settings')
      fireEvent.click(expandButton)
      
      expect(screen.getByText('Crop')).toBeInTheDocument()
      expect(screen.getByText('Rotation')).toBeInTheDocument()
    })

    it('should toggle expand state', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      const expandButton = screen.getByText('Advanced Settings')
      
      // Expand
      fireEvent.click(expandButton)
      expect(screen.getByText('Crop')).toBeInTheDocument()
      
      // Collapse
      fireEvent.click(expandButton)
      expect(screen.queryByText('Crop')).not.toBeInTheDocument()
    })
  })

  describe('Crop Controls', () => {
    it('should toggle crop enabled state', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      // Expand first
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      // Find the checkbox by its position in the DOM (next to the Crop label)
      const cropSection = screen.getByText('Crop').closest('div')
      const cropCheckbox = cropSection?.querySelector('input[type="checkbox"]') as HTMLInputElement
      fireEvent.click(cropCheckbox)
      
      expect(mockOnChange).toHaveBeenCalledWith('cropEnabled', true)
    })

    it('should show crop inputs when enabled', () => {
      const enabledParams = { ...defaultParams, cropEnabled: true }
      render(<AdvancedAdjustments params={enabledParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      expect(screen.getByText('X1')).toBeInTheDocument()
      expect(screen.getByText('Y1')).toBeInTheDocument()
      expect(screen.getByText('X2')).toBeInTheDocument()
      expect(screen.getByText('Y2')).toBeInTheDocument()
    })

    it('should update crop coordinates', () => {
      const enabledParams = { ...defaultParams, cropEnabled: true }
      render(<AdvancedAdjustments params={enabledParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      // Find X1 input - it's the first number input after the X1 label
      const x1Label = screen.getByText('X1')
      const x1Input = x1Label.parentElement?.querySelector('input[type="number"]') as HTMLInputElement
      fireEvent.change(x1Input, { target: { value: '100' } })
      
      expect(mockOnChange).toHaveBeenCalledWith('cropArea', {
        x1: 100,
        y1: 0,
        x2: 6000,
        y2: 4000
      })
    })

    it('should reset crop to full image size', () => {
      const enabledParams = { 
        ...defaultParams, 
        cropEnabled: true,
        cropArea: { x1: 100, y1: 100, x2: 500, y2: 500 }
      }
      render(
        <AdvancedAdjustments 
          params={enabledParams} 
          onChange={mockOnChange}
          imageWidth={8000}
          imageHeight={6000}
        />
      )
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      fireEvent.click(screen.getByText('Reset Crop'))
      
      expect(mockOnChange).toHaveBeenCalledWith('cropArea', {
        x1: 0,
        y1: 0,
        x2: 8000,
        y2: 6000
      })
    })

    it('should enforce min/max values on crop inputs', () => {
      const enabledParams = { ...defaultParams, cropEnabled: true }
      render(<AdvancedAdjustments params={enabledParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      const x1Label = screen.getByText('X1')
      const x1Input = x1Label.parentElement?.querySelector('input[type="number"]') as HTMLInputElement
      expect(x1Input.min).toBe('0')
      expect(x1Input.max).toBe('6000')
    })
  })

  describe('Rotation Control', () => {
    it('should update rotation value', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      // Find the select element after the Rotation label
      const rotationLabel = screen.getByText('Rotation')
      const rotationSelect = rotationLabel.parentElement?.querySelector('select') as HTMLSelectElement
      fireEvent.change(rotationSelect, { target: { value: '3' } })
      
      expect(mockOnChange).toHaveBeenCalledWith('userFlip', 3)
    })

    it('should display all rotation options', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      const rotationLabel = screen.getByText('Rotation')
      const rotationSelect = rotationLabel.parentElement?.querySelector('select') as HTMLSelectElement
      const options = within(rotationSelect).getAllByRole('option')
      
      expect(options).toHaveLength(4)
      expect(options[0]).toHaveTextContent('None')
      expect(options[1]).toHaveTextContent('180°')
      expect(options[2]).toHaveTextContent('90° CCW')
      expect(options[3]).toHaveTextContent('90° CW')
    })
  })

  describe('Shot Selection', () => {
    it('should update shot select value', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      const shotLabel = screen.getByText('Shot Select')
      const shotInput = shotLabel.parentElement?.querySelector('input[type="number"]') as HTMLInputElement
      fireEvent.change(shotInput, { target: { value: '2' } })
      
      expect(mockOnChange).toHaveBeenCalledWith('shotSelect', 2)
    })

    it('should have correct min/max values', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      const shotLabel = screen.getByText('Shot Select')
      const shotInput = shotLabel.parentElement?.querySelector('input[type="number"]') as HTMLInputElement
      expect(shotInput.min).toBe('0')
      expect(shotInput.max).toBe('10')
    })

    it('should show helper text', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      expect(screen.getByText('For multi-shot RAW files')).toBeInTheDocument()
    })
  })

  describe('Noise Reduction Controls', () => {
    it('should update noise threshold', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      const noiseLabel = screen.getByText(/Noise Threshold:/)
      const noiseSlider = noiseLabel.parentElement?.querySelector('input[type="range"]') as HTMLInputElement
      fireEvent.change(noiseSlider, { target: { value: '500' } })
      
      expect(mockOnChange).toHaveBeenCalledWith('noiseThreshold', 500)
    })

    it('should display current noise threshold value', () => {
      const params = { ...defaultParams, noiseThreshold: 250 }
      render(<AdvancedAdjustments params={params} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      expect(screen.getByText('Noise Threshold: 250')).toBeInTheDocument()
    })

    it('should update median passes', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      const medianLabel = screen.getByText(/Median Passes:/)
      const medianSlider = medianLabel.parentElement?.querySelector('input[type="range"]') as HTMLInputElement
      fireEvent.change(medianSlider, { target: { value: '3' } })
      
      expect(mockOnChange).toHaveBeenCalledWith('medianPasses', 3)
    })
  })

  describe('DCB Controls', () => {
    it('should update DCB iterations', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      const dcbLabel = screen.getByText(/DCB Iterations:/)
      const dcbSlider = dcbLabel.parentElement?.querySelector('input[type="range"]') as HTMLInputElement
      fireEvent.change(dcbSlider, { target: { value: '5' } })
      
      expect(mockOnChange).toHaveBeenCalledWith('dcbIterations', 5)
    })

    it('should toggle DCB enhance', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      const dcbLabel = screen.getByText('DCB False Color Suppression')
      const dcbCheckbox = dcbLabel.parentElement?.querySelector('input[type="checkbox"]') as HTMLInputElement
      fireEvent.click(dcbCheckbox)
      
      expect(mockOnChange).toHaveBeenCalledWith('dcbEnhance', true)
    })

    it('should have correct range for DCB iterations', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      const dcbLabel = screen.getByText(/DCB Iterations:/)
      const dcbSlider = dcbLabel.parentElement?.querySelector('input[type="range"]') as HTMLInputElement
      expect(dcbSlider.min).toBe('1')
      expect(dcbSlider.max).toBe('10')
    })
  })

  describe('Output Settings', () => {
    it('should update output bit depth', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      const bitDepthLabel = screen.getByText('Output Bit Depth')
      const bitDepthSelect = bitDepthLabel.parentElement?.querySelector('select') as HTMLSelectElement
      fireEvent.change(bitDepthSelect, { target: { value: '16' } })
      
      expect(mockOnChange).toHaveBeenCalledWith('outputBPS', 16)
    })

    it('should display bit depth options', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      const bitDepthLabel = screen.getByText('Output Bit Depth')
      const bitDepthSelect = bitDepthLabel.parentElement?.querySelector('select') as HTMLSelectElement
      const options = within(bitDepthSelect).getAllByRole('option')
      
      expect(options).toHaveLength(2)
      expect(options[0]).toHaveTextContent('8-bit')
      expect(options[1]).toHaveTextContent('16-bit')
    })
  })

  describe('Integration', () => {
    it('should handle multiple parameter changes', () => {
      render(<AdvancedAdjustments params={defaultParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      // Change multiple parameters
      const cropSection = screen.getByText('Crop').closest('div')
      const cropCheckbox = cropSection?.querySelector('input[type="checkbox"]') as HTMLInputElement
      fireEvent.click(cropCheckbox)
      
      const rotationLabel = screen.getByText('Rotation')
      const rotationSelect = rotationLabel.parentElement?.querySelector('select') as HTMLSelectElement
      fireEvent.change(rotationSelect, { target: { value: '6' } })
      
      const noiseLabel = screen.getByText(/Noise Threshold:/)
      const noiseSlider = noiseLabel.parentElement?.querySelector('input[type="range"]') as HTMLInputElement
      fireEvent.change(noiseSlider, { target: { value: '200' } })
      
      expect(mockOnChange).toHaveBeenCalledTimes(3)
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 'cropEnabled', true)
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 'userFlip', 6)
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 'noiseThreshold', 200)
    })

    it('should display current values correctly', () => {
      const customParams = {
        ...defaultParams,
        userFlip: 3,
        noiseThreshold: 500,
        medianPasses: 3,
        dcbIterations: 5,
        dcbEnhance: true,
        outputBPS: 16,
      }
      
      const { container } = render(<AdvancedAdjustments params={customParams} onChange={mockOnChange} />)
      
      fireEvent.click(screen.getByText('Advanced Settings'))
      
      // Check select values
      const selects = container.querySelectorAll('select')
      expect(selects[0]).toHaveValue('3') // Rotation
      expect(selects[1]).toHaveValue('16') // Output bit depth
      
      // Check displayed text values
      expect(screen.getByText('Noise Threshold: 500')).toBeInTheDocument()
      expect(screen.getByText('Median Passes: 3')).toBeInTheDocument()
      expect(screen.getByText('DCB Iterations: 5')).toBeInTheDocument()
      
      // Check checkbox
      const dcbLabel = screen.getByText('DCB False Color Suppression')
      const dcbCheckbox = dcbLabel.parentElement?.querySelector('input[type="checkbox"]') as HTMLInputElement
      expect(dcbCheckbox).toBeChecked()
    })
  })
})