# LibRaw最適化計画

## 現在の実装で不要な機能

### 1. ❌ 削除候補機能

#### getRawBayerData()
- **理由**: 研究用途の生データアクセスで、一般的なRAW現像には不要
- **代替**: 通常のprocess()で十分

#### get4ChannelData() 
- **理由**: 特殊な4チャンネル処理で、通常の現像では使用しない
- **代替**: 通常のgetImageData()で十分

#### setOutputTiff()
- **理由**: WebアプリケーションではTIFF出力は不要
- **代替**: Canvas APIでJPEG/PNG変換

#### loadFromMemory() (string版)
- **理由**: 非効率で廃止予定
- **代替**: loadFromUint8Array()を使用

### 2. ⚠️ 統合・簡略化候補

#### setCustomWB()の4パラメータ
- **現状**: r, g1, g2, b の4つのパラメータ
- **改善案**: g1とg2を統合して3パラメータに
- **理由**: ほとんどの場合g1=g2で十分

#### 複数のガンマ設定
- **現状**: setGamma(g1, g2)で2つのパラメータ
- **改善案**: プリセット方式に変更
  - "linear", "sRGB", "print" などの文字列指定

## 追加すべきプロ機能（優先順位付き）

### 🔴 高優先度（必須）

#### 1. getExifData() - 詳細なEXIF情報
```javascript
// 実装案
getExifData() {
  return {
    camera: { make, model, serial },
    shooting: { iso, shutter, aperture, focal_length },
    lens: { name, min_focal, max_focal },
    gps: { lat, lon, alt },
    timestamp: Date
  }
}
```

#### 2. getClippingWarnings() - ハイライト/シャドウ警告
```javascript
// 実装案
getClippingWarnings() {
  return {
    highlight_map: Uint8Array,
    shadow_map: Uint8Array,
    highlight_percentage: float,
    shadow_percentage: float
  }
}
```

#### 3. getWhiteBalanceFromArea() - エリア指定WB
```javascript
// 実装案
getWhiteBalanceFromArea(x, y, radius) {
  return { r: 1.0, g: 1.0, b: 1.0 }
}
```

### 🟡 中優先度（推奨）

#### 4. setLensCorrection() - レンズ補正
- 色収差補正
- 周辺減光補正
- 歪曲収差補正（要レンズプロファイル）

#### 5. getHistogramData() - 詳細ヒストグラム
- RGB各チャンネルの分布
- 統計情報（平均、中央値、標準偏差）

#### 6. setBadPixels() - ホットピクセル除去
- カメラ固有の不良ピクセルマップ

### 🟢 低優先度（オプション）

#### 7. setDarkFrame() - ダークフレーム減算
- 長時間露光ノイズ対策
- 天体写真向け

#### 8. getFocusPeakingMap() - フォーカスピーキング
- エッジ検出によるフォーカス確認
- マニュアルフォーカス支援

## アプリケーション側の改善点

### 1. パラメータマッピングの最適化

現在の`mapEditToProcessParams()`関数の問題点:
- 複雑すぎる変換ロジック
- 直感的でないパラメータ名

改善案:
```javascript
// より直感的なパラメータ構造
const processParams = {
  exposure: {
    brightness: 1.0,    // 0.25-8.0
    highlights: 0,      // -100 to +100
    shadows: 0,        // -100 to +100
  },
  color: {
    whiteBalance: 'camera', // 'camera', 'auto', 'custom'
    temperature: 5500,  // ケルビン値
    tint: 0,           // -100 to +100
    saturation: 0,     // -100 to +100
    vibrance: 0,       // -100 to +100
  },
  quality: {
    algorithm: 'ahd',   // 'linear', 'vng', 'ppg', 'ahd', 'dcb', 'dht'
    noiseReduction: 0,  // 0-1000
    sharpening: 0,     // 0-100
  }
}
```

### 2. プリセットシステムの追加

```javascript
const presets = {
  portrait: {
    quality: 'ahd',
    highlights: 2,
    dcbIterations: 3,
    dcbEnhance: true,
    vibrance: 10
  },
  landscape: {
    quality: 'dht',
    highlights: 5,
    saturation: 20,
    sharpening: 30
  },
  lowLight: {
    quality: 'ahd',
    noiseThreshold: 500,
    medianPasses: 3,
    brightness: 1.5
  }
}
```

### 3. パフォーマンス最適化

#### プレビューモード
```javascript
const previewParams = {
  halfSize: true,
  quality: 'linear',
  outputBPS: 8,
  skipNoiseReduction: true
}
```

#### 最終出力モード
```javascript
const finalParams = {
  halfSize: false,
  quality: 'ahd',
  outputBPS: 16,
  fullProcessing: true
}
```

## 実装優先順位

1. **Phase 1** (1週間)
   - ExportDialog機能の完成 ✅
   - Undo/Redo削除 ✅
   - getExifData()追加
   - getClippingWarnings()追加

2. **Phase 2** (2週間)
   - パラメータ構造の改善
   - プリセットシステム
   - getWhiteBalanceFromArea()
   - レンズ補正基本機能

3. **Phase 3** (1週間)
   - 不要機能の削除
   - パフォーマンス最適化
   - UI/UXの改善

## まとめ

現在のLibRaw実装は基本的な機能は充実していますが、プロフェッショナル向けの機能がいくつか不足しています。特に、詳細なメタデータアクセス、クリッピング警告、エリア指定ホワイトバランスは優先的に追加すべきです。

一方で、研究用途の機能（RawBayerData、4ChannelData）は削除し、コードベースをシンプルに保つことを推奨します。