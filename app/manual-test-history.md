# Manual Test Plan for History System

## Test 1: Basic History Addition
1. Load a RAW file
2. Click Process → History should show item #0
3. Change parameters (e.g., exposure to 1.5)
4. Click Process → History should show items #0 and #1
5. Change parameters again (e.g., contrast to 50)
6. Click Process → History should show items #0, #1, and #2

**Expected**: Each process creates exactly one history entry

## Test 2: No Duplicate on Mode Switch
1. Process an image (history #0)
2. Switch to Compare mode
3. Switch back to Single mode
4. Repeat switching several times

**Expected**: History count remains at 1

## Test 3: Single Mode Selection
1. Process 3 images with different parameters
2. In Single mode, click history item #1
3. Image should instantly display from cache
4. Parameters should update to match item #1

**Expected**: No re-processing, instant display

## Test 4: Compare Mode Selection
1. Process at least 2 images
2. Switch to Compare mode
3. Select items #0 and #2
4. Slider comparison should appear

**Expected**: Both selected images shown with slider

## Test 5: Parameter Display
1. Process with exposure=1.0, contrast=10
2. Process with exposure=2.0, contrast=20
3. Check history items show correct parameters

**Expected**: Each history item shows its specific parameters

## Test 6: History Persistence
1. Process several images
2. Navigate away and back
3. History should be cleared (not persisted)

**Expected**: History is session-based only