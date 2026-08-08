# STARFALL DASH

隕石を避け、できるだけ長く生き残るシンプルなブラウザゲームです。

**Release:** `v1.0.0` (Stable)  
**Released:** 2026-08-08

## Play

https://04masaki18.github.io/starfall-dash/

GitHub Pages で公開しています。インストール不要でブラウザからそのままプレイできます。

## Controls

- PC: `←` `→` または `A` `D`
- Mobile: 画面上を左右にドラッグ
- `Enter` / `Space`: スタート・リトライ

## Rules

- 隕石に当たるとゲームオーバー
- 生存時間に応じてスコアが増加
- 隕石をギリギリでかわすと `NEAR MISS +25`
- ベストスコアはブラウザの `localStorage` に保存
- 時間経過で隕石の速度・出現頻度が上昇

## v1.0.0 completion criteria

- タイトル画面からゲームを開始できる
- PCキーボードとスマホのドラッグ操作に対応
- 隕石との衝突でゲームオーバーになる
- スコアとベストスコアを表示・保存できる
- リトライできる
- GitHub Pages 上で公開・実プレイ確認済み
- JavaScript 構文チェックおよびゲームロジックテストを通過

## Tech

- HTML5 Canvas
- CSS
- Vanilla JavaScript (ES Modules)
- 画像・外部ライブラリ・外部APIなし
- 効果音は Web Audio API で生成

## Local run

ES Modules を使用しているため、ローカルサーバー経由で開いてください。

```bash
python -m http.server 8080
```

その後 `http://localhost:8080` を開きます。

## Test

```bash
npm test
```

## Changelog

リリース履歴は [`CHANGELOG.md`](CHANGELOG.md) を参照してください。

## License

MIT
