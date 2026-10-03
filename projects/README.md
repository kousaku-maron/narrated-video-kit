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
    PUBLISH.md             投稿方針と公開記録の書き方
    title.txt              採用タイトル
    description.txt        貼り付け用説明文
    tags.txt               タグ欄
    upload-record.json     最新YouTube ID・日時JST・設定・チェック結果
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

`00000000-demo/` は構成と操作を確認できる完成例として公開Gitで管理します。手順は [00000000-demo/VIDEO.md](00000000-demo/VIDEO.md) を参照してください。それ以外の動画プロジェクトは公開Gitの対象外です。台本・設定・画像・音声などは、[私用同期](../docs/private-sync.md) を設定して `git private-push` で非公開リポジトリへ保存できます。動画は両方の保存先で対象外（公開デモの既存動画を除く）で、制作中だけローカルで保持します。

台本を変更したら `project.json` の字幕用 `narration.text`、TTS用 `narration.speechText` と対応する音声・生成メタデータを揃えます。`VIDEO.md` は現行の方針を短く保ち、変更履歴や調査メモは `notes/` に分けます。Remotionが自動で読むのは `project.json` です。

投稿文は紹介 → 必要な場合のみセール情報 → チャプター → 公式Steamストア → ハッシュタグ → 映像出典の順にします。任意の音声・BGMクレジットは加えず、素材ごとの必須表記は保持します。`upload-record.json` は最新YouTube ID・URL、日時（`+09:00`、JST）、実際の設定とチェック結果を記録し、未確認は `null` / `pending` のままにします。

## 公開後の整理

公開後は再制作を前提にせず、動画ファイルを削除して制作記録を残します。YouTubeの公開リンクを開き、対象の完成動画が存在することを確認してから、`VIDEO.md` に公開URL、`assets/SOURCES.md` に動画素材の元URLや出典を記録し、素材・原本・完成動画・試写・描画用コピーの動画を削除します。リンクが不明ならユーザーに求め、存在や対象との一致を確認できなければ削除しません。存在確認の内容は `notes/published-video-verification.json` と削除履歴に残します。ネットにない本人録画やユーザー提供動画も削除対象です。

企画・台本・`project.json`・メモ・出典・画像・音声・字幕・サムネイル・投稿文は残します。削除後の `project.json` は制作時点の構成記録であり、そのまま再描画できる状態ではありません。デモと共通素材は整理対象外です。残す記録はデモ以外は公開Git対象外ですが、私用同期で非公開リポジトリへ保存できます。

Codexには「`$published-video-cleanup` で `YYYYMMDD-name` を整理して。公開URLは……」と依頼できます。手順と実行前の容量確認用スクリプトは [公開済み動画の整理スキル](../.agents/skills/published-video-cleanup/SKILL.md) にあります。
