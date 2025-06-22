# Before/After Image Comparison Feature

## Overview
Implemented a comprehensive before/after comparison feature that allows users to visually compare images before and after applying parameter changes.

## Features

### 1. Automatic Previous Image Storage
- When processing with new parameters, the current image is automatically saved as the "before" image
- Comparison mode is automatically enabled when a previous image exists

### 2. Two Comparison Modes

#### Slider Mode (Default)
- Interactive slider that reveals the new image from left to right
- Draggable handle with visual indicator
- Smooth transition between before and after images
- Percentage-based positioning (0-100%)

#### Side-by-Side Mode
- Shows both images next to each other
- Clear "Before" and "After" labels
- Maintains zoom and pan synchronization

### 3. Keyboard Shortcuts
- **C key**: Toggle comparison on/off
- **M key**: Switch between slider and side-by-side modes
- **Space key**: Process image (when parameters changed)

### 4. Visual Indicators
- Helpful overlay showing available keyboard shortcuts
- Only shown when comparison is available
- Non-intrusive positioning (top-right corner)

## Implementation Details

### State Management
```typescript
const [previousImageData, setPreviousImageData] = useState<ImageData | null>(null)
const [showComparison, setShowComparison] = useState(false)
const [comparisonMode, setComparisonMode] = useState<'slider' | 'side-by-side'>('slider')
```

### Image Storage
- Previous image is stored in state when processing new parameters
- Uses the same ImageData format for consistency
- Memory efficient - only stores one previous image

### UI Components
- Extended ImageViewer component with comparison support
- Separate canvas elements for current and previous images
- CSS clip-path for slider effect
- Flexible layout for side-by-side view

## Usage
1. Load a RAW image and process it
2. Adjust any parameters
3. Click "Process" to apply changes
4. The comparison view automatically activates
5. Use C to toggle comparison, M to change mode

## Benefits
- Instant visual feedback on parameter changes
- No need to manually save/load images
- Intuitive interaction with keyboard shortcuts
- Minimal performance impact