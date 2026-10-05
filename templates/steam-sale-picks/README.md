# Steamセール向け複数作品紹介

Steamの季節セールをきっかけに、視聴者が次に遊ぶ候補を選べる動画のひな形。2026年の協力PvE10作品紹介で使った構成を、セール名・ジャンル・作品数を替えて使えるように整理した。実プレイは前提にせず、公式情報と公開映像を基に語る。本人が遊んだ作品だけ、その体験を明示して加える。

## 使い始める

新規プロジェクトでだけ文書をコピーする。既存プロジェクトへ上書きしない。

```sh
cd remotion
npm run project -- init YYYYMMDD-sale-topic
cd ..
cp templates/steam-sale-picks/VIDEO.md projects/YYYYMMDD-sale-topic/VIDEO.md
cp templates/steam-sale-picks/SCRIPT.md projects/YYYYMMDD-sale-topic/SCRIPT.md
cp templates/steam-sale-picks/VISUALS.md projects/YYYYMMDD-sale-topic/notes/VISUALS.md
cp templates/steam-sale-picks/SALE_CHECK.md projects/YYYYMMDD-sale-topic/notes/SALE_CHECK.md
cp templates/steam-sale-picks/PUBLISH.md projects/YYYYMMDD-sale-topic/publish/PUBLISH.md
cp templates/steam-sale-picks/thumbnail.html projects/YYYYMMDD-sale-topic/publish/thumbnail.html
```

`YYYYMMDD` は日本時間の制作開始日で固定する。`{{...}}` を作品とセールに合わせて埋め、任意セクションは不要なら削る。`project.json` は `init` 後に動画固有の素材・場面・尺を設定する。背景とナレーションが決まるまで、ひな形の数値を完成映像の事実として扱わない。

`init` は共通の `publish/YOUTUBE_CHECKLIST.md` と未確認状態の `upload-record.json` も作る。冒頭・関連動画への導線を制作時に計画し、公開前後の実設定と次回の分析をチェックリストへ記録する。詳しくは [共通ひな形](../YOUTUBE_CHECKLIST.md) を参照。

| 文書 | 役割 |
| --- | --- |
| `VIDEO.md` | 企画、対象視聴者、選定基準、制作・公開状態 |
| `SCRIPT.md` | 語りと場面順。各作品で「遊びの核・友と楽しむ点・好みが分かれる点」を語る |
| `notes/SALE_CHECK.md` | セール日程、作品ごとの価格・割引・確認時刻と根拠 |
| `notes/VISUALS.md` | トレーラー背景、価格チップ、無声トランジション、タイトル画面 |
| `publish/PUBLISH.md` | 投稿タイトル、説明文、チャプター、公式ストア、ハッシュタグ、映像出典、必須表記、タグ欄 |
| `publish/thumbnail.html` | タイトル画面に合わせたサムネイルの編集原稿 |

素材の出典と利用条件はプロジェクトの `assets/SOURCES.md`、場面の実装は `project.json` に記録する。サムネイル用の背景画像は `assets/images/thumbnail-bg.png` に置き、HTMLの色・文字・パスを編集して `publish/thumbnail.png` を1280×720で書き出す。320×180でも主題が読めるか確認する。

## 企画を決めるとき

1. セール前に公開するなら「セールに備えて候補を選ぶ」とする。開催中に公開するなら、実際の割引を確認した作品だけを「セール対象」と呼ぶ。どちらもセールの開始・終了を公式日程から日本時間へ換算する。
2. ジャンルと視聴者の問いを一つに絞る。作品数は企画に合わせて決める。作品選びは割引率だけで決めず、遊び方の違いと購入前に知りたい制約を調べる。
3. 各作品の紹介で、視聴者が選ぶ理由を言う。独立した「次の一本の選び方」章を増やす必要はない。最後に投稿者が個人的に気になる作品を語るなら、実際の関心に沿う理由を使う。
4. 価格チップは確認できた日本向けSteam価格だけを載せる。今回のセール割引が未確認なら通常価格のみ。既存の別セールの割引を、今回のセール参加の証拠にしない。
5. 公開直前に、作品の販売状態・協力要素・日本語対応・早期アクセス表示、セール参加、価格、説明文の時制を再確認する。変更があれば映像と字幕を揃えて書き出し直す。

## 映像の型

背景は各作品の公式トレーラーを基本にする。静止画へ切り替える必要がある場合は理由・候補画像・表示箇所を事前に説明し、投稿者の確認後に採用する。共通の[素材選定方針](../README.md#映像素材の選び方)に従う。

冒頭ではセール期間と企画の範囲を示し、選んだ作品のトレーラーを背景にタイトルを重ねる。各作品ではその作品のトレーラーを流し、左上に作品名と価格を表示する。語りの終わりに短い余韻を置き、次の作品の背景映像へ切り替えて中央に白枠と作品名を約2.4秒表示する。トランジション中はナレーションを止め、BGMを続ける。個人的に気になる作品の章は任意。まとめは短く締め、冒頭とまとめの入口にトランジションは置かない。

`intro-title` のチップ・見出し・開催期間は `project.json` のオーバーレイ項目から指定できる。具体例と価格チップの書き方は [VISUALS.md](VISUALS.md) を参照する。作品の予告映像だけで十分伝わる場合はスクリーンショットを足さない。必要な画像は、画像そのもの・表示箇所・理由を投稿者に見せて確認後に採用する。

## 完成物

`publish/` には `final.mp4`、`subtitles.srt`、`thumbnail.png`、`thumbnail.html`、`title.txt`、`description.txt`、`tags.txt`、`PUBLISH.md`、`upload-record.json` を置く。試写や旧版は `work/`。台本を変更したら `project.json` の `narration.text`（字幕用）と `narration.speechText`（TTS用）、音声と生成メタデータ、字幕も更新する。投稿直前の確認結果と時刻を `notes/SALE_CHECK.md` に残す。
