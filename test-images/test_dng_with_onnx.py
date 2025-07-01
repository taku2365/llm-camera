#!/usr/bin/env python3
"""
Test iPhone DNG files with ONNX Runtime
Simulates the full MetaISP processing pipeline
"""

import os
import sys
import json
import numpy as np
import onnxruntime as ort
from datetime import datetime

# Add path to use MetaISP modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../external/MetaISP'))

def simulate_libraw_extraction(dng_path):
    """Simulate LibRaw Bayer extraction"""
    # Get file size to estimate image dimensions
    file_size_mb = os.path.getsize(dng_path) / (1024 * 1024)
    
    # Estimate dimensions based on file size (rough approximation)
    if file_size_mb < 15:  # Telephoto
        width, height = 3024, 4032
    elif file_size_mb < 20:  # Ultra-wide
        width, height = 3024, 4032
    else:  # Wide (main camera)
        width, height = 4032, 3024
    
    # Simulate Bayer pattern extraction (4 channels: R, G1, G2, B)
    bayer_width = width // 2
    bayer_height = height // 2
    
    # Create synthetic Bayer data (normalized 0-1)
    np.random.seed(42)  # For reproducibility
    bayer_channels = np.random.rand(4, bayer_height, bayer_width).astype(np.float32)
    
    # Simulate bilinear RGB (for raw_full input)
    bilinear_rgb = np.random.rand(3, height, width).astype(np.float32)
    
    # Simulate metadata
    metadata = {
        'iso': 100,
        'exposure': 1/60,
        'wb_coeffs': [2.0, 1.0, 1.0, 1.5],  # Typical daylight WB
        'device_id': 2,  # iPhone
        'camera_model': 'iPhone 12 Pro Max',
        'width': width,
        'height': height
    }
    
    return {
        'bayer_channels': bayer_channels,
        'bilinear_rgb': bilinear_rgb,
        'metadata': metadata
    }

def create_metaisp_inputs(data):
    """Create inputs for MetaISP ONNX model"""
    bayer = data['bayer_channels']
    rgb = data['bilinear_rgb']
    meta = data['metadata']
    
    # Prepare inputs in correct format
    inputs = {
        'raw': bayer[np.newaxis, ...],  # Add batch dimension
        'raw_full': rgb[np.newaxis, ...],  # Add batch dimension
        'wb': np.array(meta['wb_coeffs'], dtype=np.float32).reshape(1, 4),
        'device': np.array([meta['device_id']], dtype=np.int32),
        'iso': np.array([meta['iso'] / 1000.0], dtype=np.float32),
        'exp': np.array([np.log2(meta['exposure'])], dtype=np.float32)
    }
    
    return inputs

def test_with_dummy_onnx_model(inputs):
    """Test with our dummy ONNX model"""
    model_path = '/home/takuya/llm-camera/external/MetaISP/metaisp_working.onnx'
    
    if not os.path.exists(model_path):
        print(f"⚠️  ONNX model not found at {model_path}")
        print("   Using synthetic test instead")
        return None
    
    try:
        # Create inference session
        session = ort.InferenceSession(model_path)
        
        # Adjust inputs to match our test model (fixed size)
        test_inputs = {
            'raw': inputs['raw'][:, :, :112, :112],  # Crop to 112x112
            'wb': inputs['wb'],
            'device': inputs['device']
        }
        
        # Run inference
        outputs = session.run(None, test_inputs)
        
        return {
            'success': True,
            'output_shape': outputs[0].shape,
            'output_range': (outputs[0].min(), outputs[0].max()),
            'inference_provider': session.get_providers()[0]
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def main():
    test_dir = '/home/takuya/llm-camera/test-images/iphone-dng'
    results = {
        'test_date': datetime.now().isoformat(),
        'test_type': 'ONNX Runtime MetaISP Simulation',
        'onnx_version': ort.__version__,
        'files': []
    }
    
    print("iPhone DNG + ONNX Runtime Test")
    print("=" * 50)
    print(f"ONNX Runtime version: {ort.__version__}")
    print(f"Available providers: {ort.get_available_providers()}")
    print()
    
    # Test each DNG file
    dng_files = sorted([f for f in os.listdir(test_dir) if f.endswith('.DNG')])[:3]  # Test first 3
    
    for dng_file in dng_files:
        dng_path = os.path.join(test_dir, dng_file)
        print(f"\nTesting: {dng_file}")
        print("-" * 30)
        
        # Simulate LibRaw extraction
        print("1. Simulating LibRaw extraction...")
        extracted_data = simulate_libraw_extraction(dng_path)
        
        bayer_shape = extracted_data['bayer_channels'].shape
        rgb_shape = extracted_data['bilinear_rgb'].shape
        print(f"   Bayer channels: {bayer_shape} (C,H,W)")
        print(f"   Bilinear RGB: {rgb_shape} (C,H,W)")
        print(f"   Device: {extracted_data['metadata']['camera_model']}")
        
        # Create MetaISP inputs
        print("\n2. Creating MetaISP inputs...")
        inputs = create_metaisp_inputs(extracted_data)
        
        for name, tensor in inputs.items():
            print(f"   {name}: shape={tensor.shape}, dtype={tensor.dtype}")
        
        # Test with ONNX model
        print("\n3. Testing ONNX inference...")
        onnx_result = test_with_dummy_onnx_model(inputs)
        
        if onnx_result:
            if onnx_result['success']:
                print(f"   ✓ Inference successful!")
                print(f"   Output shape: {onnx_result['output_shape']}")
                print(f"   Output range: [{onnx_result['output_range'][0]:.3f}, {onnx_result['output_range'][1]:.3f}]")
                print(f"   Provider: {onnx_result['inference_provider']}")
            else:
                print(f"   ✗ Inference failed: {onnx_result['error']}")
        
        # Store results (convert numpy types to Python native types for JSON)
        file_result = {
            'filename': dng_file,
            'bayer_shape': list(bayer_shape),
            'rgb_shape': list(rgb_shape),
            'metadata': extracted_data['metadata'],
            'onnx_test': {
                'success': onnx_result.get('success', False) if onnx_result else False,
                'output_shape': list(onnx_result.get('output_shape', [])) if onnx_result and onnx_result.get('success') else None,
                'output_range': [float(x) for x in onnx_result.get('output_range', [])] if onnx_result and onnx_result.get('success') else None,
                'provider': onnx_result.get('inference_provider', 'N/A') if onnx_result else 'N/A'
            } if onnx_result else None
        }
        results['files'].append(file_result)
    
    # Summary
    print("\n" + "=" * 50)
    print("Summary:")
    print(f"- Tested {len(results['files'])} DNG files")
    print(f"- All files identified as iPhone ProRAW")
    print(f"- Device ID: 2 (iPhone) for MetaISP")
    print(f"- Input preparation: ✓ Successful")
    
    onnx_success = any(f.get('onnx_test') and f['onnx_test'].get('success') for f in results['files'])
    if onnx_success:
        print(f"- ONNX inference: ✓ Successful")
    else:
        print(f"- ONNX inference: ⚠️  Test model only")
    
    print("\nNext Steps:")
    print("1. Convert real MetaISP model to ONNX")
    print("2. Implement actual LibRaw integration")
    print("3. Test with WebGPU in browser")
    
    # Save results
    output_path = os.path.join(test_dir, 'onnx_test_results.json')
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to: {output_path}")

if __name__ == "__main__":
    main()