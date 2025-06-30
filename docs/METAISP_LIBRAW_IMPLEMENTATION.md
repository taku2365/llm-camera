# MetaISP + LibRaw 実装計画書

## 1. アーキテクチャ概要

### 1.1 システム構成
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   RAW File      │────▶│   LibRaw WASM    │────▶│  MetaISP ONNX   │
│  (CR2/ARW/NEF)  │     │   (C++ → JS)     │     │  (WebGPU)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                           │
                               ▼                           ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  Bayer Pattern   │     │   RGB Output    │
                        │  + Metadata      │     │   (Device Style)│
                        └──────────────────┘     └─────────────────┘
```

### 1.2 処理フロー
1. **LibRaw**: RAWファイル読み込み、Bayerパターン抽出
2. **前処理**: MetaISP用のデータ形式に変換
3. **MetaISP**: ニューラルネットワークによるISP処理
4. **後処理**: 最終的な画像生成

## 2. LibRaw拡張実装

### 2.1 MetaISP対応メソッド追加

```cpp
// libraw_wasm_wrapper.cpp に追加

class LibRawWASM {
public:
    // MetaISP用にBayerパターンを4チャンネル形式で取得
    EMSCRIPTEN_KEEPALIVE
    std::vector<float> getBayerChannelsForMetaISP() {
        if (imgdata.idata.cdesc[imgdata.idata.fc(0, 0)] != 'R') {
            throw std::runtime_error("Unsupported CFA pattern for MetaISP");
        }
        
        int raw_width = imgdata.sizes.raw_width;
        int raw_height = imgdata.sizes.raw_height;
        int output_width = raw_width / 2;
        int output_height = raw_height / 2;
        
        // R, G1, G2, B の4チャンネル
        std::vector<float> channels(4 * output_width * output_height);
        
        // Bayerパターンを分離
        for (int row = 0; row < output_height; row++) {
            for (int col = 0; col < output_width; col++) {
                int idx = row * output_width + col;
                int raw_row = row * 2;
                int raw_col = col * 2;
                
                // RGGB pattern assumed
                channels[0 * output_width * output_height + idx] = 
                    imgdata.rawdata.raw_image[raw_row * raw_width + raw_col] / 65535.0f;  // R
                channels[1 * output_width * output_height + idx] = 
                    imgdata.rawdata.raw_image[raw_row * raw_width + raw_col + 1] / 65535.0f;  // G1
                channels[2 * output_width * output_height + idx] = 
                    imgdata.rawdata.raw_image[(raw_row + 1) * raw_width + raw_col] / 65535.0f;  // G2
                channels[3 * output_width * output_height + idx] = 
                    imgdata.rawdata.raw_image[(raw_row + 1) * raw_width + raw_col + 1] / 65535.0f;  // B
            }
        }
        
        return channels;
    }
    
    // MetaISP用メタデータ取得
    EMSCRIPTEN_KEEPALIVE
    std::string getMetaISPMetadataJSON() {
        json metadata;
        
        // 基本情報
        metadata["iso"] = imgdata.other.iso_speed;
        metadata["exposure"] = imgdata.other.shutter;
        metadata["aperture"] = imgdata.other.aperture;
        metadata["focal_length"] = imgdata.other.focal_len;
        
        // ホワイトバランス係数
        metadata["wb_coeffs"] = {
            imgdata.color.cam_mul[0],
            imgdata.color.cam_mul[1],
            imgdata.color.cam_mul[2],
            imgdata.color.cam_mul[3]
        };
        
        // カメラ情報
        metadata["camera_make"] = imgdata.idata.make;
        metadata["camera_model"] = imgdata.idata.model;
        
        // デバイスマッピング（MetaISPの学習済みデバイスへ）
        std::string model = imgdata.idata.model;
        if (model.find("iPhone") != std::string::npos) {
            metadata["device_id"] = 2;  // iPhone
        } else if (model.find("Samsung") != std::string::npos || 
                   model.find("Galaxy") != std::string::npos) {
            metadata["device_id"] = 1;  // Samsung
        } else if (model.find("Pixel") != std::string::npos) {
            metadata["device_id"] = 0;  // Pixel
        } else {
            metadata["device_id"] = -1;  // Unknown (will use default)
        }
        
        // 画像サイズ
        metadata["raw_width"] = imgdata.sizes.raw_width;
        metadata["raw_height"] = imgdata.sizes.raw_height;
        metadata["width"] = imgdata.sizes.width;
        metadata["height"] = imgdata.sizes.height;
        
        // ブラックレベル
        metadata["black_level"] = imgdata.color.black;
        metadata["maximum"] = imgdata.color.maximum;
        
        return metadata.dump();
    }
    
    // バイリニア補間されたRGB画像を取得（MetaISPのraw_full入力用）
    EMSCRIPTEN_KEEPALIVE
    std::vector<float> getBilinearRGB() {
        // 簡易デモザイク（バイリニア補間）
        dcraw_process();
        
        int width = imgdata.sizes.iwidth;
        int height = imgdata.sizes.iheight;
        std::vector<float> rgb(3 * width * height);
        
        for (int i = 0; i < width * height; i++) {
            rgb[0 * width * height + i] = imgdata.image[i][0] / 65535.0f;
            rgb[1 * width * height + i] = imgdata.image[i][1] / 65535.0f;
            rgb[2 * width * height + i] = imgdata.image[i][2] / 65535.0f;
        }
        
        return rgb;
    }
};
```

### 2.2 JavaScript統合レイヤー

```typescript
// app/src/lib/libraw/metaisp-integration.ts

export interface MetaISPMetadata {
  iso: number;
  exposure: number;
  aperture: number;
  focal_length: number;
  wb_coeffs: [number, number, number, number];
  camera_make: string;
  camera_model: string;
  device_id: number;
  raw_width: number;
  raw_height: number;
  width: number;
  height: number;
  black_level: number;
  maximum: number;
}

export class LibRawMetaISPBridge {
  private libraw: LibRawImage;
  
  constructor(libraw: LibRawImage) {
    this.libraw = libraw;
  }
  
  /**
   * MetaISP用のデータを準備
   */
  async prepareForMetaISP(): Promise<{
    bayerChannels: Float32Array;
    bilinearRGB: Float32Array;
    metadata: MetaISPMetadata;
  }> {
    // Bayerチャンネル取得
    const bayerChannels = await this.libraw.getBayerChannelsForMetaISP();
    
    // バイリニアRGB取得
    const bilinearRGB = await this.libraw.getBilinearRGB();
    
    // メタデータ取得
    const metadataJSON = await this.libraw.getMetaISPMetadataJSON();
    const metadata = JSON.parse(metadataJSON) as MetaISPMetadata;
    
    return {
      bayerChannels,
      bilinearRGB,
      metadata
    };
  }
  
  /**
   * MetaISP用の入力テンソルを作成
   */
  createMetaISPInputs(data: {
    bayerChannels: Float32Array;
    bilinearRGB: Float32Array;
    metadata: MetaISPMetadata;
  }): {
    raw: Float32Array;
    raw_full: Float32Array;
    wb: Float32Array;
    device: Int32Array;
    iso: Float32Array;
    exp: Float32Array;
  } {
    const { bayerChannels, bilinearRGB, metadata } = data;
    
    // 4チャンネルBayerデータ
    const raw = bayerChannels;
    
    // 3チャンネルバイリニアRGB
    const raw_full = bilinearRGB;
    
    // ホワイトバランス係数
    const wb = new Float32Array(metadata.wb_coeffs);
    
    // デバイスID
    const device = new Int32Array([
      metadata.device_id >= 0 ? metadata.device_id : 0
    ]);
    
    // ISO値（正規化）
    const iso = new Float32Array([metadata.iso / 1000.0]);
    
    // 露出時間（対数スケール）
    const exp = new Float32Array([Math.log2(metadata.exposure)]);
    
    return { raw, raw_full, wb, device, iso, exp };
  }
}
```

## 3. MetaISP ONNX実装

### 3.1 ONNX変換スクリプト

```python
# scripts/convert_metaisp_to_onnx.py

import torch
import torch.nn as nn
from metaisp_onnx_wrapper import MetaISPONNXWrapper

def convert_metaisp_to_onnx(
    checkpoint_path: str,
    output_path: str,
    device_id: int = 0
):
    """MetaISPをONNX形式に変換"""
    
    # モデルロード
    model = MetaISPONNXWrapper(checkpoint_path)
    model.eval()
    
    # ダミー入力
    batch_size = 1
    height, width = 448, 448  # 固定サイズから開始
    
    dummy_inputs = {
        'raw': torch.randn(batch_size, 4, height//2, width//2),
        'raw_full': torch.randn(batch_size, 3, height, width),
        'wb': torch.randn(batch_size, 4),
        'device': torch.tensor([device_id]),
        'iso': torch.tensor([100.0]),
        'exp': torch.tensor([1.0])
    }
    
    # ONNX変換
    torch.onnx.export(
        model,
        (dummy_inputs,),
        output_path,
        input_names=list(dummy_inputs.keys()),
        output_names=['rgb'],
        dynamic_axes={
            'raw': {2: 'height', 3: 'width'},
            'raw_full': {2: 'height_full', 3: 'width_full'},
            'rgb': {2: 'height_out', 3: 'width_out'}
        },
        opset_version=16,
        do_constant_folding=True
    )
    
    print(f"Model exported to {output_path}")
```

### 3.2 WebGPU統合

```typescript
// app/src/lib/metaisp/metaisp-processor.ts

import * as ort from 'onnxruntime-web';

export class MetaISPProcessor {
  private session: ort.InferenceSession | null = null;
  private initialized = false;
  
  async init(modelPath: string) {
    // WebGPUバックエンドの設定
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.simd = true;
    
    try {
      // WebGPUが利用可能か確認
      if ('gpu' in navigator) {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          this.session = await ort.InferenceSession.create(
            modelPath,
            {
              executionProviders: ['webgpu', 'wasm']
            }
          );
          console.log('MetaISP initialized with WebGPU');
        }
      }
    } catch (e) {
      console.warn('WebGPU not available, falling back to WASM');
    }
    
    // WebGPUが使えない場合はWASMフォールバック
    if (!this.session) {
      this.session = await ort.InferenceSession.create(
        modelPath,
        {
          executionProviders: ['wasm']
        }
      );
      console.log('MetaISP initialized with WASM');
    }
    
    this.initialized = true;
  }
  
  async process(inputs: {
    raw: Float32Array;
    raw_full: Float32Array;
    wb: Float32Array;
    device: Int32Array;
    iso: Float32Array;
    exp: Float32Array;
    dimensions: { width: number; height: number };
  }): Promise<ImageData> {
    if (!this.initialized || !this.session) {
      throw new Error('MetaISP not initialized');
    }
    
    const { width, height } = inputs.dimensions;
    
    // ONNXテンソル作成
    const feeds: Record<string, ort.Tensor> = {
      raw: new ort.Tensor('float32', inputs.raw, [1, 4, height/2, width/2]),
      raw_full: new ort.Tensor('float32', inputs.raw_full, [1, 3, height, width]),
      wb: new ort.Tensor('float32', inputs.wb, [1, 4]),
      device: new ort.Tensor('int32', inputs.device, [1]),
      iso: new ort.Tensor('float32', inputs.iso, [1]),
      exp: new ort.Tensor('float32', inputs.exp, [1])
    };
    
    // 推論実行
    const results = await this.session.run(feeds);
    const output = results.rgb as ort.Tensor;
    
    // Float32ArrayからImageDataに変換
    const rgbData = output.data as Float32Array;
    const imageData = this.tensorToImageData(rgbData, width, height);
    
    return imageData;
  }
  
  private tensorToImageData(
    tensor: Float32Array,
    width: number,
    height: number
  ): ImageData {
    const data = new Uint8ClampedArray(width * height * 4);
    
    // CHW -> HWC変換 & 正規化
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const r = Math.round(tensor[0 * width * height + idx] * 255);
        const g = Math.round(tensor[1 * width * height + idx] * 255);
        const b = Math.round(tensor[2 * width * height + idx] * 255);
        
        data[idx * 4 + 0] = r;
        data[idx * 4 + 1] = g;
        data[idx * 4 + 2] = b;
        data[idx * 4 + 3] = 255;
      }
    }
    
    return new ImageData(data, width, height);
  }
  
  /**
   * デバイス間のスタイル補間
   */
  async interpolateStyles(
    inputs: any,
    device1: number,
    device2: number,
    ratio: number
  ): Promise<ImageData[]> {
    // 複数デバイスでの推論を実行し、結果を補間
    // 実装は省略
    throw new Error('Not implemented');
  }
}
```

## 4. 統合UI実装

### 4.1 React Hook

```typescript
// app/src/lib/hooks/useMetaISP.ts

import { useState, useCallback, useRef } from 'react';
import { LibRawMetaISPBridge } from '@/lib/libraw/metaisp-integration';
import { MetaISPProcessor } from '@/lib/metaisp/metaisp-processor';

export interface MetaISPOptions {
  targetDevice?: 'iphone' | 'samsung' | 'pixel' | 'auto';
  quality?: 'fast' | 'balanced' | 'best';
  enableProgress?: boolean;
}

export function useMetaISP() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const processorRef = useRef<MetaISPProcessor | null>(null);
  const bridgeRef = useRef<LibRawMetaISPBridge | null>(null);
  
  const initialize = useCallback(async () => {
    if (!processorRef.current) {
      processorRef.current = new MetaISPProcessor();
      await processorRef.current.init('/models/metaisp.onnx');
    }
  }, []);
  
  const processRAW = useCallback(async (
    librawImage: any,
    options: MetaISPOptions = {}
  ): Promise<ImageData> => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    
    try {
      // 初期化
      await initialize();
      setProgress(10);
      
      // LibRawブリッジ作成
      if (!bridgeRef.current) {
        bridgeRef.current = new LibRawMetaISPBridge(librawImage);
      }
      setProgress(20);
      
      // MetaISP用データ準備
      const data = await bridgeRef.current.prepareForMetaISP();
      setProgress(40);
      
      // 入力テンソル作成
      const inputs = bridgeRef.current.createMetaISPInputs(data);
      setProgress(50);
      
      // デバイス選択
      if (options.targetDevice && options.targetDevice !== 'auto') {
        const deviceMap = { iphone: 2, samsung: 1, pixel: 0 };
        inputs.device[0] = deviceMap[options.targetDevice];
      }
      
      // MetaISP処理
      const result = await processorRef.current!.process({
        ...inputs,
        dimensions: {
          width: data.metadata.width,
          height: data.metadata.height
        }
      });
      setProgress(90);
      
      setProgress(100);
      return result;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [initialize]);
  
  return {
    processRAW,
    isProcessing,
    progress,
    error
  };
}
```

### 4.2 UIコンポーネント

```tsx
// app/src/app/components/editor/MetaISPPanel.tsx

import React from 'react';
import { useMetaISP } from '@/lib/hooks/useMetaISP';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

export function MetaISPPanel({ librawImage }: { librawImage: any }) {
  const { processRAW, isProcessing, progress, error } = useMetaISP();
  const [targetDevice, setTargetDevice] = useState<string>('auto');
  const [result, setResult] = useState<ImageData | null>(null);
  
  const handleProcess = async () => {
    try {
      const imageData = await processRAW(librawImage, {
        targetDevice: targetDevice as any,
        quality: 'balanced',
        enableProgress: true
      });
      setResult(imageData);
    } catch (err) {
      console.error('MetaISP processing failed:', err);
    }
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">MetaISP Neural Processing</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Target Device Style</label>
        <Select
          value={targetDevice}
          onValueChange={setTargetDevice}
          disabled={isProcessing}
        >
          <option value="auto">Auto Detect</option>
          <option value="iphone">iPhone Style</option>
          <option value="samsung">Samsung Style</option>
          <option value="pixel">Pixel Style</option>
        </Select>
      </div>
      
      <Button
        onClick={handleProcess}
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : 'Process with MetaISP'}
      </Button>
      
      {isProcessing && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-gray-600">
            {progress < 20 && 'Initializing...'}
            {progress >= 20 && progress < 50 && 'Preparing data...'}
            {progress >= 50 && progress < 90 && 'Neural processing...'}
            {progress >= 90 && 'Finalizing...'}
          </p>
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
      {result && (
        <div className="border rounded p-4">
          <h4 className="font-medium mb-2">Processed Result</h4>
          <canvas
            ref={(canvas) => {
              if (canvas && result) {
                canvas.width = result.width;
                canvas.height = result.height;
                const ctx = canvas.getContext('2d');
                ctx?.putImageData(result, 0, 0);
              }
            }}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
```

## 5. パフォーマンス最適化

### 5.1 タイル処理
大きな画像を処理する際のメモリ制限を回避：

```typescript
class TiledMetaISPProcessor {
  async processTiled(
    inputs: any,
    tileSize: number = 448
  ): Promise<ImageData> {
    // 画像をタイルに分割
    const tiles = this.splitIntoTiles(inputs, tileSize);
    
    // 各タイルを処理
    const processedTiles = await Promise.all(
      tiles.map(tile => this.processSingleTile(tile))
    );
    
    // タイルを結合
    return this.mergeTiles(processedTiles);
  }
}
```

### 5.2 プログレッシブ処理
ユーザー体験向上のための段階的処理：

```typescript
async function progressiveMetaISP(inputs: any) {
  // 1. 低解像度プレビュー（高速）
  const preview = await processDownscaled(inputs, 0.25);
  yield { type: 'preview', data: preview };
  
  // 2. 中解像度（バランス）
  const medium = await processDownscaled(inputs, 0.5);
  yield { type: 'medium', data: medium };
  
  // 3. フル解像度（最高品質）
  const full = await processFull(inputs);
  yield { type: 'full', data: full };
}
```

## 6. エラーハンドリングと互換性

### 6.1 フォールバック戦略
```typescript
class RobustMetaISPProcessor {
  async process(inputs: any): Promise<ImageData> {
    try {
      // WebGPU試行
      return await this.processWebGPU(inputs);
    } catch (e1) {
      console.warn('WebGPU failed, trying WASM');
      try {
        // WASMフォールバック
        return await this.processWASM(inputs);
      } catch (e2) {
        console.warn('WASM failed, using LibRaw fallback');
        // LibRawの従来処理にフォールバック
        return await this.processLibRawFallback(inputs);
      }
    }
  }
}
```

## 7. テスト戦略

### 7.1 単体テスト
- LibRaw拡張メソッドのテスト
- MetaISP前処理のテスト
- ONNX推論のテスト

### 7.2 統合テスト
- エンドツーエンドのRAW処理
- 各デバイススタイルの検証
- パフォーマンス測定

### 7.3 互換性テスト
- 各種RAWフォーマット対応
- ブラウザ互換性
- WebGPU可用性