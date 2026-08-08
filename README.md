# STARFALL DASH

隕石を避け、できるだけ長く生き残るシンプルなブラウザゲームです。

## Play

https://04masaki18.github.io/starfall-dash/

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

## License

MIT
