# Test Inventory for LibRaw Camera App

## Current Test Coverage

### ✅ Unit Tests

#### Components
- [x] **Histogram** (`src/app/components/editor/Histogram.test.tsx`)
  - Color distribution visualization
  - Data processing and display

- [x] **BasicAdjustments** (`src/app/components/editor/BasicAdjustments.test.tsx`)
  - Parameter controls (exposure, contrast, etc.)
  - Value changes and callbacks

- [x] **ImageViewer** (`src/app/components/editor/ImageViewer.test.tsx`, `ImageViewer.unit.test.tsx`)
  - Image display and canvas rendering
  - Comparison mode functionality
  - Zoom and pan controls

- [x] **ImageHistory** (`src/app/components/editor/ImageHistory.test.tsx`)
  - History item display
  - Single/compare mode switching
  - Selection behavior
  - Cache restoration

- [x] **HistoryLogic** (`src/app/components/editor/HistoryLogic.test.tsx`)
  - History addition timing
  - Processing state management

#### Pages
- [x] **EditorPage** (`src/app/editor/EditorPage.test.tsx`)
  - Integration of all editor components
  - Processing workflow
  - History management

#### Hooks
- [x] **useLibRaw** (`src/lib/hooks/useLibRaw.test.tsx`)
  - File loading
  - Processing state
  - Parameter mapping

#### Libraries
- [x] **LibRaw Wrapper** (`src/lib/libraw/index.unit.test.ts`)
  - WASM module loading
  - Image processing methods

### ✅ Integration Tests
- [x] **Routing** (`src/tests/integration/routing.test.tsx`)
  - Navigation between pages
  - Route parameters

- [x] **RAW Processing** (`src/test/integration/raw-processing.test.ts`)
  - End-to-end processing flow
  - Parameter application

### ✅ E2E Tests
- [x] **Library** (`tests/e2e/library.spec.ts`)
  - Photo import and management
  - Grid display

- [x] **Editor** (`tests/e2e/editor.spec.ts`)
  - RAW file editing
  - UI interactions

- [x] **Comparison** (`tests/e2e/comparison.spec.ts`)
  - Before/after comparison
  - Slider functionality

- [x] **History System** (`tests/history-system.spec.ts`)
  - Undo/redo functionality
  - Cache management

## 🚨 Missing Tests

### Components That Need Tests
1. **AdvancedAdjustments** - No test file found
   - Crop controls
   - Rotation settings
   - Noise reduction
   - DCB settings

2. **ComparisonDebugger** - No test file found
   - Debug information display

3. **ComparisonControls** - No test file found (if still exists)
   - Mode toggle UI

### Store Tests
1. **Photos Store** (`src/lib/store/photos.ts`)
   - State management
   - Photo CRUD operations
   - Persistence

### Utility Tests
1. **Image Utils** (`src/lib/utils/image-utils.ts`)
   - JPEG conversion
   - ImageData manipulation
   - Canvas operations

### LibRaw Client/Worker Tests
1. **LibRaw Client** (`src/lib/libraw/client.ts`)
   - Worker communication
   - Message handling
   - Error handling

2. **LibRaw Worker** (`src/lib/libraw/worker.ts`)
   - WASM module management
   - Processing queue
   - Memory management

3. **Processor Factory** (`src/lib/libraw/processor-factory.ts`)
   - Instance creation
   - Resource management

### Additional E2E Scenarios
1. **Error Handling**
   - Invalid file types
   - Large file handling
   - Network failures

2. **Performance**
   - Multiple file processing
   - Memory usage
   - Processing cancellation

3. **Cross-browser**
   - Safari-specific tests
   - Firefox-specific tests
   - Mobile browsers

## Test Execution Commands

```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- Histogram.test.tsx

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E with UI
npm run test:e2e:headed
```

## Priority for New Tests

### High Priority
1. AdvancedAdjustments component
2. Photos store
3. Image utils
4. LibRaw client/worker

### Medium Priority
1. ComparisonDebugger
2. Error handling E2E
3. Processor factory

### Low Priority
1. Cross-browser E2E
2. Performance tests
3. Mobile-specific tests

## Test Guidelines

1. **Mock Heavy Operations**
   - Always mock image files and processing
   - Use small ImageData objects (e.g., 100x100)
   - Mock WASM module loading

2. **Test User Interactions**
   - Focus on user-facing behavior
   - Test error states and edge cases
   - Verify accessibility

3. **Keep Tests Fast**
   - Avoid real file I/O
   - Use test doubles for external dependencies
   - Parallelize where possible

4. **Maintain Test Quality**
   - Clear test descriptions
   - Arrange-Act-Assert pattern
   - Clean up after tests