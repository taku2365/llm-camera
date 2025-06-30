# MetaISP + LibRaw + ONNX Runtime WebGPU 統合設計書

## 1. MetaISP 技術解説

### 1.1 概要
MetaISPは、RAWセンサーデータをRGB画像に変換するニューラルISP（Image Signal Processing）パイプラインです。従来のISPと異なり、複数デバイス（iPhone、Samsung、Pixel）のカラーレンダリング特性を学習し、デバイス固有の色再現を実現します。

### 1.2 アーキテクチャ詳細

#### コア構成要素：
1. **入力処理層**
   - RAW入力（4ch Bayerパターン：RGGB）
   - ガンマ補正（1/2.2）
   - ホワイトバランススケーリング
   - ISO/露出補正（オプション）

2. **グローバル特徴抽出器**
   - XCiT（Cross-Covariance Image Transformer）
   - パラメータ：patch_size=16, embed_dim=128, depth=4, num_heads=4
   - シーン全体の文脈情報を抽出

3. **エンコーダ（ダウンサンプリング）**
   - 3段階のDWT（離散ウェーブレット変換）
   - RCAGroup（Residual Channel Attention）ブロック
   - チャンネル数：64 → 64 → 128

4. **ボトルネック**
   - デバイス固有埋め込み（3デバイス：Pixel=0, Samsung=1, iPhone=2）
   - グローバル特徴との特徴変調

5. **デコーダ（アップサンプリング）**
   - 3段階の逆DWT
   - スキップ接続
   - AdaINベースのスタイル変調
   - 出力：3チャンネルRGB画像

### 1.3 革新的な特徴
- **マルチデバイス適応**：単一モデルで複数デバイスの色特性を再現
- **グローバルコンテキスト活用**：Transformerによるシーン理解
- **ウェーブレット変換**：周波数領域での効率的な処理
- **スタイル補間**：デバイス間のスムーズな色変換

## 2. ONNX変換設計

### 2.1 変換戦略

#### Phase 1: モデル簡略化
```python
# 推論専用モデルの作成
class MetaISPONNX(nn.Module):
    def __init__(self, original_model):
        super().__init__()
        # PWCNetの除去（トレーニング専用）
        # 損失関数の除去
        # 固定入力サイズの設定
```

#### Phase 2: カスタム演算の処理
1. **DWT/IDWT実装**
   - ONNXカスタムオペレータとして実装
   - または、Conv2Dベースの近似実装

2. **XCiT Transformer**
   - 標準的なONNX演算に分解
   - MultiHeadAttentionの互換性確認

### 2.2 エクスポート設定
```python
# ONNX エクスポート例
def export_metaisp_onnx(model, device_id=0):
    model.eval()
    
    # 固定サイズ入力
    dummy_input = {
        'raw': torch.randn(1, 4, 448, 448),
        'raw_full': torch.randn(1, 3, 448, 448),
        'wb': torch.randn(1, 4, 1, 1),
        'coords': torch.randn(1, 2, 448, 448),
        'device': torch.tensor([device_id]),
        'iso': torch.tensor([100.0]),
        'exp': torch.tensor([1.0])
    }
    
    torch.onnx.export(
        model,
        dummy_input,
        "metaisp.onnx",
        input_names=['raw', 'raw_full', 'wb', 'coords', 'device', 'iso', 'exp'],
        output_names=['rgb'],
        dynamic_axes={
            'raw': {2: 'height', 3: 'width'},
            'rgb': {2: 'height', 3: 'width'}
        },
        opset_version=16
    )
```

### 2.3 WebGPU最適化
1. **演算精度**
   - FP16変換による高速化
   - 重要な層のみFP32維持

2. **メモリ最適化**
   - タイルベース処理
   - 中間テンソルの再利用

3. **並列化**
   - WebGPUシェーダーでの並列実行
   - バッチ処理のサポート

## 3. LibRaw + MetaISP 統合設計

### 3.1 処理パイプライン

```
[RAWファイル] 
    ↓
[LibRaw読み込み]
    ↓
[メタデータ抽出]
    - ISO値
    - 露出時間
    - ホワイトバランス係数
    - カメラモデル（→デバイスマッピング）
    ↓
[Bayerパターン抽出]
    - LibRawでunpack()
    - 4チャンネル形式に変換
    ↓
[前処理]
    - 正規化（0-1範囲）
    - パッチ分割（大画像対応）
    ↓
[MetaISP推論]
    - ONNX Runtime実行
    - WebGPU使用
    ↓
[後処理]
    - パッチ結合
    - ガンマ補正
    - クリッピング
    ↓
[出力]
```

### 3.2 インターフェース設計

```typescript
interface MetaISPProcessor {
  // 初期化
  async init(modelPath: string): Promise<void>;
  
  // RAW処理
  async processRAW(
    rawData: Uint8Array,
    metadata: LibRawMetadata,
    targetDevice?: 'iphone' | 'samsung' | 'pixel'
  ): Promise<ImageData>;
  
  // バッチ処理
  async processBatch(
    rawFiles: RAWFile[],
    targetDevice?: string
  ): Promise<ImageData[]>;
  
  // デバイス間補間
  async interpolateDevices(
    rawData: Uint8Array,
    metadata: LibRawMetadata,
    device1: string,
    device2: string,
    ratio: number
  ): Promise<ImageData>;
}
```

### 3.3 LibRaw拡張

```cpp
// libraw_wasm_wrapper.cpp への追加
class LibRawWASM {
public:
    // Bayerパターンをチャンネル分離形式で取得
    std::vector<float> getBayerChannels() {
        // R, G1, G2, B の4チャンネルに分離
    }
    
    // MetaISP用メタデータ取得
    MetaISPMetadata getMetaISPMetadata() {
        return {
            iso: imgdata.other.iso_speed,
            exposure: imgdata.other.shutter,
            wb_coeffs: {
                imgdata.color.cam_mul[0],
                imgdata.color.cam_mul[1],
                imgdata.color.cam_mul[2],
                imgdata.color.cam_mul[3]
            },
            camera_model: imgdata.idata.model
        };
    }
};
```

## 4. テスト計画

### 4.1 ONNX変換テスト

#### Step 1: 基本変換テスト
```python
# test_onnx_conversion.py
def test_basic_conversion():
    # 1. PyTorchモデルロード
    model = load_metaisp_model()
    
    # 2. ONNX変換
    export_to_onnx(model)
    
    # 3. 出力比較
    torch_output = model(test_input)
    onnx_output = run_onnx_model(test_input)
    
    assert np.allclose(torch_output, onnx_output, rtol=1e-3)
```

#### Step 2: カスタム演算テスト
- DWT/IDWT変換の精度確認
- Transformer層の互換性テスト

#### Step 3: パフォーマンステスト
- 推論速度測定
- メモリ使用量測定
- WebGPU vs CPU比較

### 4.2 統合テスト

1. **エンドツーエンドテスト**
   - LibRawでRAW読み込み
   - MetaISP処理
   - 出力品質評価

2. **デバイス別テスト**
   - iPhone/Samsung/Pixel各モード
   - デバイス間補間

3. **大画像テスト**
   - タイル処理の検証
   - メモリ効率の確認

### 4.3 品質評価
- PSNR/SSIM測定
- 色再現性評価
- アーティファクト検出

## 5. 実装ロードマップ

### Phase 1: ONNX変換検証（1-2週間）
- [ ] PyTorchモデルの簡略化
- [ ] 基本的なONNX変換
- [ ] ONNXRuntimeでの動作確認

### Phase 2: WebGPU対応（2-3週間）
- [ ] ONNX Runtime WebGPUバックエンド設定
- [ ] パフォーマンス最適化
- [ ] ブラウザ互換性テスト

### Phase 3: LibRaw統合（2-3週間）
- [ ] LibRaw拡張実装
- [ ] JavaScript統合レイヤー
- [ ] UIコンポーネント開発

### Phase 4: 本番環境準備（1-2週間）
- [ ] エラーハンドリング
- [ ] プログレッシブ処理
- [ ] ドキュメント作成

## 6. 技術的課題と解決策

### 6.1 課題
1. **DWT実装**：WebGPUでのウェーブレット変換
2. **メモリ制限**：大画像処理時のメモリ管理
3. **精度維持**：量子化による品質低下

### 6.2 解決策
1. **Conv2Dベース実装**：DWTをConvolutionで近似
2. **タイル処理**：画像を分割して処理
3. **混合精度**：重要層のみFP32維持

## 7. 期待される成果

- **高品質RAW現像**：プロ級の色再現
- **マルチデバイス対応**：異なるカメラスタイルの再現
- **リアルタイム処理**：WebGPUによる高速化
- **ブラウザ完結**：サーバー不要の処理