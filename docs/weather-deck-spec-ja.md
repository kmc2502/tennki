# 天気カードアプリ 詳細仕様書（v1.0）

- 文書名: 天気カードアプリ 詳細仕様書
- 版数: v1.0
- 作成対象: 個人開発用 / 実装用
- 公開先想定: GitHub Pages
- 実行環境想定: モダンブラウザ向け Web アプリ
- 保存方式: LocalStorage

---

## 1. アプリ概要

### 1.1 アプリ名（仮）
- Weather Deck（本仕様書での仮称）
- Card Forecast
- Trump Weather
- Forecast in Cards

### 1.2 目的
数値・アイコン中心の一般的な天気表示ではなく、トランプカードの見た目と階級表現で天気を視覚的に楽しく確認できる体験を提供する。

### 1.3 利用者
- 利用者種別: 自分用
- 想定人数: 単独利用
- 主目的: 実用性より見た目・体験・UI の楽しさを重視

### 1.4 コンセプト
- 天気を「読む」のではなく「配られる」体験
- 4つの気象要素を 4 スートに対応
- 数値をカードランクに変換して直感把握
- ダークで高級感ある UI

### 1.5 対応プラットフォーム
- Web アプリ
- GitHub Pages 配信
- インストール不要 / ログイン不要

---

## 2. 前提条件

- 天気データは外部 API から取得
- 初回表示・検索時はネット接続が必要
- 設定・お気に入りは LocalStorage 保存
- 対応ブラウザ: Chrome / Safari / Edge / Firefox 最新版
- 画面優先度: スマホ縦持ち > PC > タブレット
- UI 言語: 日本語

---

## 3. スコープ

### 3.1 含む
- 都市名検索（1地点）
- 現在時間帯の4枚カード表示
- 3時間ごとの予報一覧
- 注意報以上でジョーカー表示
- カード配布アニメーション
- 効果音 ON/OFF
- お気に入り登録/削除/切替（最大5件）
- LocalStorage による保存
- GitHub Pages 前提の静的構成

### 3.2 含まない
- ログイン/会員機能
- SNS共有/プッシュ通知
- 位置情報取得/地図/レーダー
- 複数地点同時比較
- PWA 必須対応
- オフライン完全動作

---

## 4. 用語定義
- カード: 天気情報をトランプ形式で表示する UI
- スート: ハート=雲量, スペード=気圧, クラブ=湿度, ダイヤ=気温
- ランク: 数値を固定ルールで変換したカード表現
- ランク順: `3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2`
- ジョーカー: 注意報以上の情報がある場合に表示する特別カード
- 3時間枠: 3時間単位の予報データ区間

---

## 5. 必須要件
1. 都市名検索
2. 1地点表示
3. 現在時間帯の4枚カード大表示
4. 3時間予報一覧表示
5. カードにランク＋元の値表示
6. 注意報以上でジョーカー表示
7. お気に入り最大5件
8. 効果音 ON/OFF
9. 配布モーション
10. GitHub Pages で配信可能

---

## 6. 情報設計

### 6.1 表示対象
- 雲量 / 気圧 / 湿度 / 気温 / 注意報以上

### 6.2 各カード表示
- スート記号
- スート名
- ランク
- 元値
- 単位
- 補助ラベル（低い〜高い）

### 6.3 時間軸
- 3時間単位
- 現在を含む最適枠をメイン表示
- 以降枠を一覧表示

### 6.4 都市情報
- 検索入力値 / 検索候補 / 選択中都市 / お気に入り

---

## 7. スート設計
- ♥ ハート: 雲量
- ♠ スペード: 気圧
- ♣ クラブ: 湿度
- ♦ ダイヤ: 気温
- JOKER: 注意報以上（特別警報 > 警報 > 注意報 の順）

---

## 8. ランク変換仕様

### 8.1 共通
- 13段階へ変換（`3,4,5,6,7,8,9,10,J,Q,K,A,2`）
- 下限/上限外は端に丸める
- 欠損は `-`（半透明表示）

### 8.2 雲量（0〜100 / 逆順マッピング）
- 0〜7:2, 8〜15:A, 16〜23:K, 24〜31:Q, 32〜39:J, 40〜47:10, 48〜55:9, 56〜63:8, 64〜71:7, 72〜79:6, 80〜87:5, 88〜95:4, 96〜100:3
- 低い値ほど強いランク（2）になり、高い値ほど弱いランク（3）になる

### 8.3 湿度（0〜100）
- 0〜7:3, 8〜15:4, ..., 88〜95:A, 96〜100:2

### 8.4 気圧（980〜1040 hPa）
- 980.0〜984.5:3, 984.6〜989.1:4, ..., 1030.6〜1035.1:A, 1035.2〜1040.0:2

### 8.5 気温（-5〜40 ℃）
- -5.0〜-1.5:3, -1.4〜2.0:4, ..., 33.6〜37.0:A, 37.1〜40.0:2

### 8.6 補助ラベル
- 低い / やや低い / ふつう / やや高い / 高い

---

## 9. ジョーカー表示仕様
- 条件: 注意報以上が1件以上
- 表示: メインの5枚目＋一覧のマーカー
- 表示内容: JOKER、レベル、件数、代表1件、詳細展開
- 先頭優先: 特別警報 > 警報 > 注意報

---

## 10. 画面一覧
1. ローディング
2. メイン
3. 都市検索
4. お気に入り管理
5. ジョーカー詳細
6. 設定
7. エラー状態

---

## 11. 画面遷移（概要）

### 初回起動
1. 起動
2. LocalStorage 読込
3. 保存都市優先で API 取得
4. なければ初期都市で取得
5. メイン表示

### 都市変更
検索 → 候補選択 → 取得 → 配布アニメーション → 更新 → 都市保存

### お気に入り切替
一覧選択 → 取得 → 再描画 → アニメーション

---

## 12. メイン画面仕様

### 構成
1. ヘッダー
2. 対象時刻
3. メインカード4枚
4. ジョーカー
5. 3時間予報一覧
6. フッター操作

### カード順序（固定）
1. ハート（雲量）
2. スペード（気圧）
3. クラブ（湿度）
4. ダイヤ（気温）

### レイアウト
- スマホ: 2x2
- PC: 横4枚可

---

## 13. 3時間予報一覧
- 初期8枠（24時間）推奨
- 1枠: 時刻 + 4要素要約 + 必要時ジョーカー
- 初期実装は方式C（1枚サマリーカード）

---

## 14. 検索機能
- 都市名入力で候補表示、1件選択確定
- ひらがな/カタカナ/漢字/英字考慮
- 失敗時: 「都市が見つかりませんでした」
- 確定時: 取得・更新・都市保存

---

## 15. お気に入り機能
- 最大5件
- 重複不可
- 保存項目: city情報 + 登録日時
- 上限時: 「お気に入りは 5 件までです」
- 重複時: 「すでに登録済みです」

---

## 16. 設定
- 効果音 ON/OFF（初期値 ON）
- LocalStorage 保存
- 将来拡張: アニメーションON/OFF, 単位, 表示件数

---

## 17. アニメーション
- 初回/都市変更/再読込で配布アニメーション
- 山札表示→4枚順次配布→着地→必要時ジョーカー遅延表示
- 1枚あたり 180〜260ms（合計約1秒）

---

## 18. 効果音
- 配布時に再生
- ジョーカー別音可
- OFF時は無音
- 自動再生制限を考慮（初回操作後有効化）


---

## 19. ディーラー演出仕様
- 条件: 現在の天気状態が「雨 / 雪 / みぞれ / 快晴」のいずれかに該当する場合に表示
- UI: 画面下部またはメインカード横にディーラーキャラクターを表示
- 吹き出し: 例「本日は雨です」「本日は雪です」「本日はみぞれです」「本日は快晴です」
- 更新タイミング: 初回読み込み、都市変更、スロット切替、再読み込み時
- 非該当時: ディーラーは非表示または通常待機状態

---

## 20. デザイン
- ダーク・高級感・落ち着き
- 背景: 黒〜濃紺
- 文字: アイボリー/白/薄灰
- アクセント: 金/銀/深紅/深緑（限定）
- カード: 角丸、縦長、影、内枠

---

## 21. レスポンシブ
- スマホ最優先
- タブレット追従
- PCは4枚横並びやサイド導線を許容

---

## 22. コンポーネント一覧
Header, CitySearchInput, SearchResultList, FavoriteButton, FavoriteListModal, SettingsModal, MainCardGrid, WeatherCard, JokerCard, ForecastTimeline, ForecastSummaryCard, DealerCharacter, LoadingDeck, ToastMessage, ErrorStatePanel

---

## 23. 主要コンポーネント仕様（要約）
- WeatherCard: `suit, rank, value, unit, label, title, animated, emphasis`
- JokerCard: `alerts, topAlert, severity, count, expanded`
- ForecastSummaryCard: 時刻 + 4要素 + joker marker

---

## 24. エラー表示
- ネットワーク、検索失敗、形式不整合、警報未取得、欠損
- 方針: 全画面クラッシュ回避・部分表示維持・短い日本語メッセージ
- リトライボタンを表示

---

## 25. データ取得/抽象化
- 外部API利用（GitHub Pages向け CORS 配慮）
- UI層と API レスポンス層を分離
- 必要: city/lat/lon/time/cloud/pressure/humidity/temperature/alerts
- 欠損時は該当カードを「取得不可」で表示継続

---

## 26. 内部データモデル

```ts
type City = {
  id: string
  name: string
  region?: string
  country?: string
  lat: number
  lon: number
}

type WeatherValue = {
  raw: number | null
  unit: string
  rank: string | null
  label?: string
}

type ForecastSlot = {
  timeIso: string
  localLabel: string
  cloud: WeatherValue
  pressure: WeatherValue
  humidity: WeatherValue
  temperature: WeatherValue
  alerts: AlertItem[]
}

type AlertItem = {
  id: string
  level: 'advisory' | 'warning' | 'special'
  title: string
  description?: string
  start?: string
  end?: string
}

type Settings = {
  soundEnabled: boolean
}

type FavoriteCity = {
  city: City
  addedAt: string
}

type AppState = {
  currentCity: City | null
  favorites: FavoriteCity[]
  settings: Settings
  forecastSlots: ForecastSlot[]
  selectedSlotIndex: number
  loading: boolean
  error: string | null
}
```

---

## 27. LocalStorage 設計
- `weatherDeck.currentCity`
- `weatherDeck.favorites`
- `weatherDeck.settings`
- JSON パース失敗時は初期値へフォールバック

---

## 28. 初期値
- 初期都市: 主要都市（東京推奨、徳島候補）
- `soundEnabled: true`
- `favorites: []`
- `selectedSlotIndex: 0`

---

## 29. ユーティリティ/関数仕様

```ts
interface WeatherApiService {
  searchCities(query: string): Promise<City[]>
  getForecast(city: City): Promise<ForecastSlot[]>
}

function getRankByThreshold(value: number | null, table: ThresholdRule[]): string | null
function getJokerInfo(alerts: AlertItem[]): JokerInfo | null
function addFavorite(city: City, favorites: FavoriteCity[]): FavoriteCity[]
function playDealSound(enabled: boolean): void
```

---

## 30. テスト観点
- 単体: ランク変換 / ジョーカー判定 / 上限 / LocalStorage
- 結合: 検索〜表示更新 / お気に入り切替 / 効果音設定反映
- UI: スマホ崩れ / 可読性 / アニメーション自然さ / ディーラー吹き出し文言の状態切替

---

## 31. 受け入れ基準
- 4枚カードにランク＋元値表示
- 3時間一覧から枠選択でメイン切替
- 注意報以上でジョーカー表示
- お気に入り5件保持（再起動後も）
- 効果音設定保持
- GitHub Pages で正常動作
- 雨/雪/みぞれ/快晴時にディーラーと吹き出し文言が表示される

---

## 32. 実装優先順位

### Phase 1
- 検索 / 取得 / 4枚表示 / 一覧 / ランク変換

### Phase 2
- お気に入り / LocalStorage / ジョーカー

### Phase 3
- 配布アニメーション / 効果音 / UI磨き込み

---

## 33. 推奨ディレクトリ構成

```txt
src/
  components/
    WeatherCard/
    JokerCard/
    ForecastSummaryCard/
    Header/
    SettingsModal/
    FavoriteModal/
    SearchModal/
  pages/
    Home/
  services/
    weatherApi/
    storage/
  utils/
    rank/
    alert/
    time/
  hooks/
  types/
  assets/
    sounds/
    images/
```

---

## 34. 補足方針
- ランクは「良し悪し」でなく「数値の大小」を表す
- ランク主役 + 元値併記で実用性担保
- 4枚同時表示で比較しやすさを確保
- 閾値定数・APIモデル・Storageキーを分離固定して将来変更に備える

---

## 35. 実装着手の推奨順
1. 画面モック
2. カードコンポーネント
3. ダミーデータ4枚表示
4. 一覧
5. API連携
6. LocalStorage
7. アニメーション/音

以上。
