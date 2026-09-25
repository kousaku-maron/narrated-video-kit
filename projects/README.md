# 動画プロジェクト

1本の動画を1フォルダで管理します。直下に置く制作ファイルは `VIDEO.md`、`SCRIPT.md`、`project.json` の3つです。サンプルの `demo/` と完成したレビューの `invokyr-review/` も同じ構成です。

```text
projects/<動画名>/
  VIDEO.md                 企画・状態・見せ方の方針
  SCRIPT.md                確定した台本
  project.json             Remotionが読む場面・尺・素材ID
  assets/
    SOURCES.md             素材の出典と取得メモ
    images/                採用した画像
    footage/               トレーラー・プレイ映像
    originals/             採用前のゲーム固有素材の原本（必要な場合）
    audio/
      narration/           場面IDに対応する音声と音声プラン
      music/               この動画で使うBGM
      sfx/                 効果音
  publish/
    PUBLISH.md             投稿用タイトル・説明文
    thumbnail.html         サムネイルの編集用原稿（必要な場合）
    thumbnail.png          完成サムネイル（必要な場合）
    final.mp4              完成動画（書き出し後）
    subtitles.srt          投稿用字幕（書き出し後）
  notes/                   参考動画の分析や画面設計（必要な場合）
  scripts/                 この動画に固有の再生成手順（必要な場合）
```

`remotion/` で実行する `npm run project -- init <動画名>` は基本のフォルダと文書を作ります。採用した素材は `npm run project -- add <動画名> <ファイル> --id <素材ID>` で `assets/` に取り込み、`project.json` に登録します。音声の種類は `--category narration|music|sfx` で指定できます。元ファイルの隣の `.source.txt` は `assets/SOURCES.md` にまとめます。共通素材の原本はリポジトリ直下の `assets/`、ゲーム固有の素材は各プロジェクトの `assets/`、語り手の設定とアバターは `pelsona/` に置きます。

音声生成プランは、その動画の `assets/audio/narration/` に置きます。試写は `remotion/out/<動画名>/`、完成版はプロジェクトの `publish/` に出します。`npm run final -- <動画名>` が `final.mp4` と `subtitles.srt` を作り、既存の完成動画がある場合は `--replace` を明示しない限り上書きしません。`remotion/public/projects/` は描画用のコピーで、チェック・プレビュー・書き出し前に更新されます。

`demo/` は新しい動画を作る人向けの完成例としてGitで管理します。背景・架空のゲーム画像・ナレーション・BGM・完成MP4を含め、AivisSpeechなしでもプレビューと書き出しができます。手順は [demo/VIDEO.md](demo/VIDEO.md) を参照してください。`demo/` 以外の動画プロジェクトは、台本・設定・素材・完成動画を含めてGitの対象外です。ローカル専用プロジェクトの再編集に必要なファイルは、別途バックアップしてください。

台本を変更したら `project.json` の `narration.text` と対応する音声を揃えます。`VIDEO.md` は現行の方針を短く保ち、変更履歴や調査メモは `notes/` に分けます。Remotionが自動で読むのは `project.json` です。
