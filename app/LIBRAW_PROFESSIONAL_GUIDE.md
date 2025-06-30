# LibRaw Professional Parameter Usage Guide

## 概要
LibRawは、プロフェッショナルRAW現像ソフトウェアのコア機能を提供する強力なライブラリです。このガイドでは、各パラメータの詳細な使用方法とユースケースを説明します。

## 基本パラメータ

### 1. ホワイトバランス (White Balance)
```cpp
setUseCameraWB(bool)    // カメラ設定のWBを使用
setUseAutoWB(bool)      // 自動ホワイトバランス
setCustomWB(r, g1, g2, b) // カスタムWB倍率
setGreyBox(x1, y1, x2, y2) // グレーカード領域指定
```

**ユースケース**:
- **スタジオ撮影**: グレーカードを使用して正確なWBを設定
- **ミックス光源**: カスタムWBで微調整
- **バッチ処理**: カメラWBで一貫性を保つ

### 2. 露出補正 (Exposure Correction)
```cpp
setBrightness(float)     // 明るさ (0.25-8.0, デフォルト1.0)
setExposure(shift, preserve) // 露出シフトとハイライト保護
setAutoBright(enabled, threshold) // 自動明るさ調整
```

**プロのヒント**:
- `shift`: -2.0〜+3.0 EVの範囲で調整
- `preserve`: 1.0でハイライトを保護、0.0で線形補正
- 風景写真では`preserve=0.8-1.0`を推奨

### 3. ハイライトリカバリー (Highlight Recovery)
```cpp
setHighlight(mode)
// 0: クリップ (高速、品質低)
// 1: アンクリップ (カメラWB必須)
// 2: ブレンド (バランス型)
// 3-9: 再構築 (高品質、低速)
```

**ユースケース**:
- **ウェディング**: mode=2でドレスのディテール保持
- **風景**: mode=3-5で空の階調を復元
- **スポーツ**: mode=0-1で高速処理

## デモザイク品質設定

### 4. 補間アルゴリズム (Interpolation Quality)
```cpp
setQuality(int)
// 0: リニア補間 (最速)
// 1: VNG (Variable Number of Gradients)
// 2: PPG (Patterned Pixel Grouping)
// 3: AHD (Adaptive Homogeneity-Directed) ★推奨
// 4: DCB (DCB interpolation)
// 11: DHT (最高品質、最低速)
```

**品質とスピードのトレードオフ**:
- **商用印刷**: AHD (3) または DHT (11)
- **Web用**: VNG (1) または PPG (2)
- **リアルタイムプレビュー**: リニア (0)

### 5. DCB設定 (高品質デモザイク)
```cpp
setDCBIterations(int)    // 反復回数 (1-10)
setDCBEnhance(bool)      // 偽色抑制
```

**推奨設定**:
- ポートレート: iterations=3, enhance=true
- 建築: iterations=5-7, enhance=true
- 自然風景: iterations=2, enhance=false

## ノイズリダクション

### 6. ノイズ処理
```cpp
setNoiseThreshold(float)  // ノイズ閾値 (0-1000)
setMedianPasses(int)      // メディアンフィルタ回数 (0-10)
```

**ISO別推奨値**:
- ISO 100-400: threshold=0, passes=0
- ISO 800-1600: threshold=100-200, passes=1
- ISO 3200-6400: threshold=300-500, passes=2-3
- ISO 12800+: threshold=600-1000, passes=3-5

## カラーマネジメント

### 7. 出力色空間
```cpp
setOutputColor(int)
// 0: RAW色空間 (リニア)
// 1: sRGB ★Web/一般用途
// 2: Adobe RGB ★印刷用
// 3: Wide Gamut RGB
// 4: ProPhoto RGB ★最大色域
// 5: XYZ
```

### 8. ガンマ補正
```cpp
setGamma(g1, g2)
// g1: ガンマ値 (1/2.4 = 0.417 for sRGB)
// g2: トーンカーブのトウ部分
```

**プリセット**:
- sRGB: g1=0.417, g2=12.92
- リニア: g1=1.0, g2=1.0
- 印刷用: g1=0.45, g2=4.5

### 9. ビット深度
```cpp
setOutputBPS(int)  // 8 or 16 bit
```
- **8bit**: Web、プレビュー、JPEG出力
- **16bit**: 後処理、印刷、アーカイブ

## 高度な設定

### 10. 黒レベル調整
```cpp
setUserBlack(int)  // 手動黒レベル (0-4095)
```
**用途**: 
- かぶり除去
- コントラスト強調
- センサーノイズ対策

### 11. 色収差補正
```cpp
setAberrationCorrection(r, b)
// r: 赤チャンネル倍率
// b: 青チャンネル倍率
```
**推奨値**: 
- 標準: r=1.0, b=1.0
- 望遠レンズ: r=0.9995, b=1.0005

### 12. トリミングと回転
```cpp
setCropArea(x1, y1, x2, y2)  // 切り抜き領域
setUserFlip(int)
// 0: なし
// 3: 180度
// 5: 90度反時計回り
// 6: 90度時計回り
```

### 13. マルチショット選択
```cpp
setShotSelect(int)  // 連写/ブラケット画像から選択
```

## プロフェッショナルワークフロー

### ポートレート撮影
```cpp
params.setUseCameraWB(true);
params.setQuality(3);  // AHD
params.setHighlight(2);  // ブレンド
params.setNoiseThreshold(100);
params.setDCBIterations(3);
params.setDCBEnhance(true);
params.setOutputColor(2);  // Adobe RGB
params.setOutputBPS(16);
```

### 風景写真
```cpp
params.setQuality(11);  // DHT最高品質
params.setHighlight(5);  // 高度な再構築
params.setExposure(0, 1.0);  // ハイライト保護
params.setOutputColor(4);  // ProPhoto RGB
params.setOutputBPS(16);
params.setVibrance(20);  // 自然な彩度
```

### 商用/製品撮影
```cpp
params.setGreyBox(x1, y1, x2, y2);  // グレーカード領域
params.setQuality(3);  // AHD
params.setGamma(0.45, 4.5);  // 印刷用ガンマ
params.setOutputColor(2);  // Adobe RGB
params.setOutputBPS(16);
params.setAberrationCorrection(0.9998, 1.0002);
```

### 高速プレビュー
```cpp
params.setHalfSize(true);  // 半分の解像度
params.setQuality(0);  // リニア補間
params.setOutputBPS(8);
params.setNoiseThreshold(0);
```

## 不要な機能の削除候補

1. **setOutputTiff()** - Webアプリケーションでは不要
2. **getFourColorRGB()** - 特殊用途で一般的には不要
3. **getRawBayerData()** - 研究用途以外では不要

## 追加すべきプロ機能

### 1. レンズプロファイル補正
```cpp
// 追加候補
setLensCorrection(bool enabled)
setVignettingCorrection(float amount)
setDistortionCorrection(float k1, float k2)
```

### 2. カラーグレーディング
```cpp
// 追加候補
setSplitToning(int highlightHue, int shadowHue, float balance)
setColorGrading(float r, float g, float b, int zone)
```

### 3. ローカル調整
```cpp
// 追加候補
setGradientFilter(x1, y1, x2, y2, float exposure, float contrast)
setRadialFilter(cx, cy, radius, float exposure, float contrast)
```

### 4. フィルムシミュレーション
```cpp
// 追加候補
setFilmSimulation(string profileName)
setGrainEffect(float amount, float size)
```

## パフォーマンスガイドライン

### 処理時間の目安 (24MP画像)
- リニア補間: 0.5-1秒
- VNG/PPG: 2-3秒
- AHD: 3-5秒
- DCB: 5-8秒
- DHT: 10-15秒

### メモリ使用量
- 基本: RAWファイルサイズ × 3
- 16bit処理: RAWファイルサイズ × 6
- 履歴保存時: + JPEG圧縮後サイズ

## まとめ

LibRawは非常に強力で、プロフェッショナルなRAW現像に必要な機能をほぼすべて提供しています。適切なパラメータ設定により、商用レベルの品質を実現できます。

重要なのは、用途に応じて品質とパフォーマンスのバランスを取ることです。リアルタイムプレビューには低品質設定を、最終出力には最高品質設定を使用することで、効率的なワークフローを構築できます。