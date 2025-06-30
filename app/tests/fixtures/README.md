# Test Fixtures

This directory contains test images for development and testing purposes.

## Important Note

RAW image files (`.arw`, `.cr2`, `.nef`, etc.) are excluded from Git due to their large size.

To run tests locally, you need to add your own test RAW files to this directory:

1. Add any RAW image file (e.g., `test-image.arw`)
2. The files will be ignored by Git automatically
3. Tests will use these local files

## Supported Formats

- Sony ARW
- Canon CR2/CR3
- Nikon NEF
- Adobe DNG
- Fuji RAF
- Olympus ORF
- Other RAW formats supported by LibRaw

## File Size Recommendation

For testing purposes, use smaller RAW files (10-30MB) when possible to speed up test execution.