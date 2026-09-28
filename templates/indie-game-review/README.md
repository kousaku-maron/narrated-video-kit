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

`20260928-my-game` は例です。日付を制作開始日（日本時間）、`my-game` を動画の英数字名に置き換えます。各文書の `{{...}}` を埋め、使わない任意パートを削除します。`thumbnail.html` は背景・ロゴ・アバターの画像パスと文字を編集し、PNGへ書き出します。`init` が作った `project.json` は動画固有の場面と素材IDに編集します。既存プロジェクトへ無条件にコピーすると文書を上書きするため、新規作成時に使ってください。

サムネイル原稿の初期パスは `assets/images/thumbnail-bg.jpg`、`thumbnail-logo.png`、`thumbnail-avatar.png` です。素材をその名前で置くか、HTMLの `src` を実際のファイルに合わせます。ロゴやアバターを使わない場合は該当する `<img>` を削除します。

## ひな形の役割

| 文書 | 決めること |
| --- | --- |
| `VIDEO.md` | 視聴者・企画の核・体験と公式情報の境界・素材・制作状態 |
| `SCRIPT.md` | 読み上げる言葉、章の順番、各章で見せる素材 |
| `notes/VISUALS.md` | トレーラー背景、スクショ、章見出し、字幕、締め、サムネイルの画面ルール |
| `publish/PUBLISH.md` | 投稿タイトル・説明文・チャプター・タグ・サムネイル文言 |
| `publish/thumbnail.html` | 画像・文字を差し替えるサムネイルのレイアウト |

映像の最終的な場面・尺・素材IDは `project.json`、素材の出典は `assets/SOURCES.md` に記録します。原稿を変更したら `project.json` の `narration.text` と音声も揃えます。`publish/` には最終的に `final.mp4`、`subtitles.srt`、`thumbnail.png` を置きます。試写や旧版は `work/` に置き、`publish/` に積み重ねません。

## 毎回変えるところ

- 冒頭で提示する、このゲームならではの感想。面白かった場面と難しかった場面を具体的に。
- デモ版・Playtestなど、遊んだ範囲。体験した事実、公式説明、今後への予想を区別する。
- スクショは少数に絞る。候補画像そのものと表示する章・時間帯・理由を投稿者に見せ、了承された箇所だけ `project.json` に入れる。背景動画で伝わる箇所には足さない。
- プレイ映像の有無。長い録画やネタバレ区間は必要な動画にだけ入れる。
- 結論で薦める相手、締めで一言振り返る内容、タイトル・サムネイルの訴求。

画面の基調は [VISUALS.md](VISUALS.md) にまとめています。Stink Buddiesの「ボス戦を約17分流す」構成や、個別のゲーム画像・台詞は標準形ではありません。

## 公開タイトルの型

`【プレイ段階のレビュー】『作品名』体験から分かった特徴` の順にします。公開デモを遊んだ動画は `【体験版レビュー】`、Steam Playtestを遊んだ動画は `【プレイテストレビュー】` と表記し、遊んだ範囲を正確に伝えます。作品名の後には、その動画ならではの感想を短く置きます。
