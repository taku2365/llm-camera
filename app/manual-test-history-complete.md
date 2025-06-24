# Complete Manual Test Plan for History System

## Test Environment Setup
1. Start the development server: `npm run dev`
2. Navigate to the editor with a RAW file
3. Open browser DevTools Console to monitor for errors

## Test 1: History Addition Timing ✓
**Purpose**: Verify history is added ONLY after processing completes

**Steps**:
1. Load editor with a RAW file
2. Open Network tab in DevTools to monitor processing
3. Click "Process" button
4. **During processing**: Check that history still shows "No history yet"
5. **After processing completes**: History should show "History (1)"

**Expected Results**:
- No history entry appears during processing
- History entry appears immediately after processing completes
- No duplicate entries

## Test 2: Multiple Processing Cycles ✓
**Purpose**: Verify each processing creates exactly one history entry

**Steps**:
1. Process image with default parameters → History (1)
2. Change Exposure to 1.0, click Process → History (2)
3. Change Contrast to 50, click Process → History (3)
4. Change Saturation to 20, click Process → History (4)

**Expected Results**:
- Each process creates exactly one new entry
- History items numbered #0, #1, #2, #3 (newest first)
- Each item shows correct parameters

## Test 3: Single Mode Image Display ✓
**Purpose**: Verify cached images display immediately without re-processing

**Steps**:
1. Create 3 history entries with different parameters
2. Ensure you're in "Single" mode
3. Click history item #1
4. Observe: Image updates immediately (no processing)
5. Check parameters match history item
6. Click history item #2
7. Observe: Image updates immediately again

**Expected Results**:
- Instant image display from cache
- No "Processing..." message
- Parameters update to match selected item
- No comparison slider visible

## Test 4: Compare Mode Selection ✓
**Purpose**: Verify two-image comparison works correctly

**Steps**:
1. Create at least 3 history entries
2. Click "Compare" button
3. Click history item #0 (should highlight)
4. Click history item #2 (should highlight)
5. Observe comparison slider appears
6. Move slider to compare images

**Expected Results**:
- Can select exactly 2 items
- Both items highlighted in blue
- Comparison slider appears automatically
- Slider smoothly transitions between images

## Test 5: Mode Switching Behavior ✓
**Purpose**: Verify mode switching doesn't duplicate history

**Steps**:
1. Process one image → History (1)
2. Switch to Compare mode → Still History (1)
3. Switch back to Single mode → Still History (1)
4. Rapidly switch modes 10 times → Still History (1)

**Expected Results**:
- History count never changes when switching modes
- Selection clears when switching modes
- No errors in console

## Test 6: Selection Limits ✓
**Purpose**: Verify selection rules for each mode

**Single Mode**:
1. Click item #0 → Selected
2. Click item #1 → Item #0 deselected, #1 selected
3. Only one item selected at a time

**Compare Mode**:
1. Click item #0 → Selected
2. Click item #1 → Both selected
3. Click item #2 → Item #0 deselected, #1 and #2 selected
4. Click item #1 → Item #1 deselected, only #2 selected

## Test 7: Parameter Display Accuracy ✓
**Purpose**: Verify parameters shown match actual values

**Steps**:
1. Process with Exposure=1.5, Contrast=30, Saturation=10
2. Check history item shows "Exp: 1.5, Cont: 30, Sat: 10"
3. Click the history item
4. Verify adjustment sliders show same values

## Test 8: Time Display ✓
**Purpose**: Verify relative time updates correctly

**Steps**:
1. Process an image
2. Note time display (e.g., "5s ago")
3. Wait 1 minute
4. Time should update to "1m ago"
5. Process another image
6. New item shows seconds, old shows minutes

## Test 9: Error Handling
**Purpose**: Verify graceful handling of errors

**Steps**:
1. Create history entries
2. Open DevTools, set Network to "Offline"
3. Try to restore from history
4. Should show cached image (if available)
5. If cache fails, should show error message

## Test 10: Keyboard Shortcuts
**Purpose**: Verify keyboard navigation works

**Steps**:
1. Process image with Exposure=1.0
2. Change to Exposure=2.0
3. Press Spacebar → Processes image
4. Press Ctrl+Z → Restores previous (Exposure=1.0)

## Test 11: Performance with Many Items
**Purpose**: Verify UI remains responsive

**Steps**:
1. Process 20+ images with different parameters
2. History list should remain scrollable and responsive
3. Clicking items should still be instant
4. Mode switching should remain fast

## Common Issues to Check

### ❌ Issues that should NOT occur:
1. History added during processing
2. Duplicate history entries
3. Image not updating when clicking history in single mode
4. Comparison slider in single mode
5. More than 2 selections in compare mode
6. History count changing on mode switch
7. Parameters not matching displayed image

### ✓ Expected Behaviors:
1. History only after processing completes
2. Instant display from cache
3. Smooth mode transitions
4. Clear visual feedback for selections
5. Accurate parameter display
6. Responsive UI with many items

## Debug Information
If issues occur, check:
1. Browser Console for errors
2. Network tab for unexpected API calls
3. React DevTools for state changes
4. History state in ImageHistory component
5. Processing state in useLibRaw hook