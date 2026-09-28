# 動画プロジェクト

1本の動画を1フォルダで管理します。フォルダ名は `YYYYMMDD-name` とし、日付は**制作を始めた日**（日本時間）で固定します。公開日が変わってもフォルダ名は変えません。英数字小文字とハイフンで名前を付けます（例: `20260928-sample-video/`）。`00000000-demo/` は一覧の先頭に置くサンプル専用の例外です。

直下に置く制作ファイルは `VIDEO.md`、`SCRIPT.md`、`project.json` の3つです。

```text
projects/YYYYMMDD-name/
  VIDEO.md                 企画・状態・見せ方の方針
  SCRIPT.md                確定した台本
  project.json             Remotionが読む場面・尺・素材ID
  assets/
    SOURCES.md             素材の出典と取得メモ
    images/                採用した画像
    footage/               動画素材
    originals/             採用前の素材の原本（必要な場合）
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
  work/                    中間映像・確認用動画・旧版・レイアウト確認画像（必要な場合）
```

`remotion/` で実行する `npm run project -- init YYYYMMDD-name` は基本のフォルダと文書を作ります。新規作成時は実在する日付を必須とし、`00000000` はデモ用に予約しています。採用した素材は `npm run project -- add YYYYMMDD-name <ファイル> --id <素材ID>` で `assets/` に取り込み、`project.json` に登録します。音声の種類は `--category narration|music|sfx` で指定できます。元ファイルの隣の `.source.txt` は `assets/SOURCES.md` にまとめます。共通素材の原本はリポジトリ直下の `assets/`、プロジェクト固有の素材は各プロジェクトの `assets/`、語り手の設定とアバターは `pelsona/` に置きます。

用途別の企画・台本・画面設計・投稿文のひな形は [templates/](../templates/README.md) にまとめます。

音声生成プランは、その動画の `assets/audio/narration/` に置きます。試写は `remotion/out/<動画名>/`、完成版はプロジェクトの `publish/` に出します。`npm run final -- <動画名>` が `final.mp4` と `subtitles.srt` を作り、既存の完成動画がある場合は `--replace` を明示しない限り上書きしません。`remotion/public/projects/` は描画用のコピーで、チェック・プレビュー・書き出し前に更新されます。

`00000000-demo/` は構成と操作を確認できる完成例としてGitで管理します。手順は [00000000-demo/VIDEO.md](00000000-demo/VIDEO.md) を参照してください。それ以外の動画プロジェクトは、台本・設定・素材・完成動画を含めてGitの対象外です。ローカル専用プロジェクトの再編集に必要なファイルは、別途バックアップしてください。

台本を変更したら `project.json` の `narration.text` と対応する音声を揃えます。`VIDEO.md` は現行の方針を短く保ち、変更履歴や調査メモは `notes/` に分けます。Remotionが自動で読むのは `project.json` です。
