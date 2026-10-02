# レビュー動画の章トランジション

## 実例からの判断

- [IGN「Tunic Review」0:52〜1:00](https://www.youtube.com/watch?v=_pYNW9_tNJA&t=52s)では、ゲーム映像の上で文字と枠が現れ、タイトルを見せた後に通常の映像へ戻る。全体は約8〜9秒だが、章名を読ませる部分は約2〜3秒。これは導入後の演出であり、すべての話題変更に同じ長さを使ってはいない。
- [IGN「Unpacking Review」0:34](https://www.youtube.com/watch?v=7tOwjy0rP2E&t=34s)では導入後のタイトルを強調し、[2:46](https://www.youtube.com/watch?v=7tOwjy0rP2E&t=166s)の結論でも見出しを使う。[1:59](https://www.youtube.com/watch?v=7tOwjy0rP2E&t=119s)の欠点への転換はプレイ映像とナレーションを続ける。
- [GameSpot「Cult of the Lamb Review」4:43](https://www.youtube.com/watch?v=VFF0iQJAAdA&t=283s)では、拠点運営の話題に合ったプレイ映像へ移り、章カードを足していない。
- [ニチレビ「The Darkest Tales」0:47](https://www.youtube.com/watch?v=1jBPxkqzX8Q&t=47s)では小さな章ラベルを映像に重ね、[1:52](https://www.youtube.com/watch?v=1jBPxkqzX8Q&t=112s)では黒背景の章カードを使う。章によって強弱を付けている。

## 共通テンプレートの使い分け

| 境界 | 表示 | 初期値 |
| --- | --- | --- |
| 普段の話題変更 | 左上の章名を短く切り替える | 0.24秒 |
| 大きな話の転換 | 前の語りの後に無声の専用場面を置き、ゲーム映像とBGMを続けながら白い枠・番号・章名を画面中央で見せる | 2.2秒 |
| 長い本人録画に入る箇所 | 案内の語りが終わった後に無声の章タイトルを表示し、録画とゲーム音に切り替える | 2.2秒を出発点にする |
| 本人録画からまとめへ戻る箇所 | 録画の後に無声の章タイトルとBGMを開始し、タイトル終了後に語りを再開する | 2.2秒を出発点にする |

2.2秒は実例の章名を読ませる部分を参考にした制作上の初期値。実例そのものの正確な効果時間を指定する値ではない。タイトル表示中はナレーションと字幕を止め、次の語りを始める前にタイトルを消す。背景全体を暗転させず、元映像とBGMは続ける。

`project.json` では各場面の `chapterLabel` と、強調する無声の専用場面だけ `chapterStart: true` を使う。専用場面の長さを `chapterTransition.durationSeconds` 以上にし、次がナレーション場面なら同じ `chapterLabel` を付ける。大見出しは毎回必要とは限らない。中央のUIは白を基調にしてゲームを問わず使い、試写で字幕・アバター・画像との重なりを確認する。

本編の背景を章をまたいで流す場合は `backgroundPlaylist` を使い、章タイトル場面ごとに同じ動画の開始位置を指定し直さない。場面に `background` を個別指定する場合は、次の場面の開始位置を前の場面の続きに合わせる。

### 明るい背景での可読性

雪景色などで白文字が読みにくい場合は `chapterTransition.cardOpacity` を調整する。0〜1で枠内の背景の濃さを指定し、省略時は0.29。背景映像全体を暗転させず、明るいカットを使った試写で必要な濃さを選ぶ。特定作品で採用した数値を全作品の既定値にしない。

```json
{
  "chapterPlacement": "top-left-fixed",
  "chapterTransition": {"durationSeconds": 2.2, "minorDurationSeconds": 0.24, "cardOpacity": 0.29}
}
```

### 本人録画からの復帰

長い本人録画を入れる場合、録画場面には `rawBackground: true` を指定し、`chapterLabel` と `avatar` は付けない。録画の開始時刻で `soundtrack.endAtSeconds` と `backgroundPlaylistEndAtSeconds` を止める。録画後の「まとめ」タイトル場面からBGMを再開し、`endingSoundtrack.startSceneId` にそのタイトル場面のIDを指定する。タイトル場面にナレーションは置かず、続く「まとめ」の語りの場面に同じ `chapterLabel` を付ける。詳細な設定は [Remotionの説明](../../remotion/README.md) を参照する。
