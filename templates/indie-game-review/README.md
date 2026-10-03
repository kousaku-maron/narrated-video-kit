# インディーゲーム体験レビュー

日本語で発売前の協力・PvEインディーゲームを探す視聴者に、**実際に遊んで分かったこと**を短く伝えるためのひな形です。デモ版・Steam Playtestのどちらにも使えます。発売日未定でも、ウィッシュリスト候補として紹介できます。

## 新しい動画で使う

リポジトリのルートから、まず通常のプロジェクトを作り、この文書群をコピーします。

```sh
cd remotion
npm run project -- init 20260928-my-game
cd ..
cp templates/indie-game-review/VIDEO.md projects/20260928-my-game/VIDEO.md
cp templates/indie-game-review/SCRIPT.md projects/20260928-my-game/SCRIPT.md
cp templates/indie-game-review/VISUALS.md projects/20260928-my-game/notes/VISUALS.md
cp templates/indie-game-review/PUBLISH.md projects/20260928-my-game/publish/PUBLISH.md
cp templates/indie-game-review/thumbnail.html projects/20260928-my-game/publish/thumbnail.html
```

`20260928-my-game` は例です。日付を制作開始日（日本時間）、`my-game` を動画の英数字名に置き換えます。各文書の `{{...}}` を埋め、使わない任意パートを削除します。`publish/thumbnail.html` は背景・ロゴ・アバターの画像パス、文言、色変数を編集し、完成PNGを `publish/thumbnail.png` に書き出します。試作・旧版のHTMLと確認画像は `work/` に置きます。`init` が作った `project.json` は動画固有の場面と素材IDに編集します。既存プロジェクトへ無条件にコピーすると文書を上書きするため、新規作成時に使ってください。

サムネイル原稿の初期パスは `assets/images/thumbnail-bg.jpg`、`thumbnail-avatar.png` です。素材をその名前で置くか、HTMLの `src` を実際のファイルに合わせます。ロゴが背景に入っていない場合は、コメントアウトされた `thumbnail-logo.png` の `<img>` を使います。アバターを使わない場合は `.avatar-ring` と `.avatar` を削除します。

サムネイルは左上の塗りチップ、左下の二段見出しと体験の根拠、右上のロゴ、右下のアバターを出発点にします。色・背景の彩度・文字サイズは `:root` の変数で作品ごとに調整します。背景に人物がいる場合は顔を隠さず、主文が短く読める位置に置きます。1280×720で書き出し、320×180へ縮小してチップ・主文・根拠の読みやすさを確認します。

## ひな形の役割

| 文書 | 決めること |
| --- | --- |
| `VIDEO.md` | 視聴者・企画の核・体験と公式情報の境界・素材・制作状態 |
| `SCRIPT.md` | 読み上げる言葉、章の順番、各章で見せる素材 |
| `notes/VISUALS.md` | トレーラー背景、スクショ、章見出し、字幕、まとめ、サムネイルの画面ルール |
| `publish/PUBLISH.md` | 投稿タイトル・説明文・チャプター・タグ・サムネイル文言 |
| `publish/thumbnail.html` | 画像・文字・配色を差し替える採用版サムネイルの編集原稿 |

映像の最終的な場面・尺・素材IDは `project.json`、素材の出典は `assets/SOURCES.md` に記録します。原稿や尺を変更したら `project.json` の `narration.text`、音声、字幕、画像の表示区間、投稿用チャプターを揃えます。`publish/` には最終的に `final.mp4`、`subtitles.srt`、`thumbnail.png`、`thumbnail.html`、`PUBLISH.md` を置きます。試写や旧版は `work/` に置き、`publish/` に積み重ねません。

## 毎回変えるところ

- 冒頭で提示する、このゲームならではの感想。面白かった場面と難しかった場面を具体的に。
- デモ版・Playtestなど、遊んだ範囲。体験した事実、公式説明、今後への予想を区別する。
- スクショは少数に絞る。候補画像そのものと表示する章・時間帯・理由を投稿者に見せ、了承された箇所だけ `project.json` に入れる。背景動画で伝わる箇所には足さない。
- プレイ映像の有無。長い録画やネタバレ区間は必要な動画にだけ入れる。
- 結論で薦める相手、まとめで一言振り返る内容、タイトル・サムネイルの訴求。

画面の基調は [VISUALS.md](VISUALS.md)、章の切り替え方と参考資料は [TRANSITIONS.md](TRANSITIONS.md) にまとめています。Stink Buddiesの「ボス戦を約17分流す」構成や、個別のゲーム画像・台詞は標準形ではありません。

章の切り替えには共通のトランジションを使えます。`project.json` の各場面に `chapterLabel` を設定し、プロジェクト全体に `"chapterPlacement": "top-left-fixed"` と `"chapterTransition": {"durationSeconds": 2.2, "minorDurationSeconds": 0.24}` を追加します。大きな転換点では、前の語りが終わってから2.2秒の無声の章タイトル場面を置き、その場面に次の章名と `"chapterStart": true` を設定します。次のナレーションはタイトルが消えてから始めます。背景映像とBGMは続きます。ゲーム固有の素材は必要ありません。

長い本人録画を入れる場合は、案内の語りの後に「実プレイ映像」の無声タイトルを置き、録画中は章見出し・アバター・レビューBGMを外します。録画が終わったらまとめの背景とBGMへ直接戻し、短く語ります。冒頭と締めの入口にトランジションは置きません。本編の章間では必要な演出を維持します。BGMを録画後に再開する設定は [TRANSITIONS.md](TRANSITIONS.md) に記載しています。音量は素材によって違うので、数値だけで決めず試写で声とBGMの聞こえ方を確認します。

## 公開タイトルの型

`【プレイ段階のレビュー】『作品名』体験から分かった特徴` の順にします。公開デモを遊んだ動画は `【体験版レビュー】`、Steam Playtestを遊んだ動画は `【プレイテストレビュー】` と表記し、遊んだ範囲を正確に伝えます。作品名の後には、その動画ならではの感想を短く置きます。
