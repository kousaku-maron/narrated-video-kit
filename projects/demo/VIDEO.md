# 動画制作デモ

新しい動画を作る人向けの、約42秒の完成例です。架空のゲーム画面とオリジナルBGMを使い、静止画・動画の背景、のそ爺の音声と発話字幕、中央の画像、無言の章タイトル、締め画面を一通り見られます。素材と音声は同梱しているので、AivisSpeechを起動しなくても再生・書き出しできます。

## まず見る

同梱の [完成MP4](publish/final.mp4) をすぐ視聴できます。場面を編集しながら見る場合は、リポジトリのルートから次を実行します。

```sh
cd remotion
npm install
npm run check -- demo
npm run studio -- demo
```

Studio では `IndieVideo` を再生します。自分で試写を書き出す場合は `npm run render -- demo` を実行し、`remotion/out/demo/` のMP4を確認してください。完成版と字幕を再生成する場合は `npm run final -- demo --replace` を使います。

## ファイルの読み方

1. [SCRIPT.md](SCRIPT.md)：のそ爺が話す文と、無言の場面を再生順に記録します。
2. [project.json](project.json)：場面、素材ID、尺、字幕、BGM、章タイトルをRemotionに渡します。音声の `narration.text` は台本と同じ文です。
3. `assets/`：採用した素材の原本です。[SOURCES.md](assets/SOURCES.md) に出典を書きます。架空の画像2枚、短い背景映像、ナレーション4本、オリジナルBGMを同梱しています。
4. `publish/`：完成動画、字幕、投稿文の置き場です。このデモの完成MP4はすぐ見られるようGitに含めます。通常の動画プロジェクトのMP4はGit管理外です。

`opening` でタイトルとナレーション、`chapter-assets` で無言の章タイトル、`background-and-voice` で背景と字幕、`image-inset` で中央画像、`chapter-finish` と `finish` で話題の切り替え、`end-card` で締めを確認できます。アバターはルートの `pelsona/nosojii/` を参照します。

## 自分の動画を始める

`remotion/` から `npm run project -- init my-game` を実行すると、ルートの `projects/my-game/` に空の制作フォルダができます。以下の順に埋めてください。

1. `VIDEO.md` に動画の目的と素材、`SCRIPT.md` に実際に読む文を書く。
2. `npm run project -- add my-game /absolute/path/to/image.png --id image-01` のように素材を登録する。手元の映像、画像、生成画像を同じ方法で追加できます。
3. 音声を `speech/` のCLIで作って登録し、`project.json` の `scenes` に素材IDと発話文を並べる。このデモの場面設定を必要な部分だけ参考にする。
4. `npm run check -- my-game`、`npm run studio -- my-game` で確認し、`npm run final -- my-game` で書き出す。

詳しいフィールドとコマンドは [Remotionの説明](../../remotion/README.md) を参照してください。`demo/` だけをGitで管理し、新しく作るプロジェクトはローカル専用です。公開する自分の動画には、のそ爺の画像と台詞をそのまま流用せず、自分のキャラクターに差し替えてください。コードと各素材の利用範囲は [ライセンス方針](../../LICENSING.md) を参照してください。
