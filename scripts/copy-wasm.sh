#!/bin/bash
# Copy WASM files from LibRaw build output to app public directory

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
LIBRAW_WASM_DIR="$ROOT_DIR/external/LibRaw/wasm"
APP_WASM_DIR="$ROOT_DIR/app/public/wasm"

echo "Copying WASM files from LibRaw to app..."

# Ensure destination directory exists
mkdir -p "$APP_WASM_DIR"

# Copy the built WASM files
if [ -f "$LIBRAW_WASM_DIR/libraw.js" ]; then
    cp "$LIBRAW_WASM_DIR/libraw.js" "$APP_WASM_DIR/"
    echo "Copied libraw.js"
fi

if [ -f "$LIBRAW_WASM_DIR/libraw.wasm" ]; then
    cp "$LIBRAW_WASM_DIR/libraw.wasm" "$APP_WASM_DIR/"
    echo "Copied libraw.wasm"
fi

if [ -f "$LIBRAW_WASM_DIR/libraw-node.js" ]; then
    cp "$LIBRAW_WASM_DIR/libraw-node.js" "$APP_WASM_DIR/"
    echo "Copied libraw-node.js"
fi

echo "WASM files copied successfully!"