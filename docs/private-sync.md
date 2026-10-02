# 公開フレームと非公開の制作記録

制作はこれまでどおり公開フレームの作業フォルダで行う。公開リポジトリの `origin` と `.gitignore` は維持し、別フォルダの非公開リポジトリへ選択したファイルを同期する。両者のGit履歴は独立しており、私用側のコミットを公開側へ取り込まない。

## 日常の操作

公開フレームの作業フォルダで実行する。

```sh
git private-plan       # 同期対象の件数・容量・追加・変更・削除を確認
git private-push       # 私用コピーを更新し、commitしてprivate/mainへpush
```

追加引数も渡せる。

```sh
git private-plan --list
git private-push --message 'Archive completed project records'
```

同じ操作をPythonから直接実行する場合:

```sh
python3 scripts/sync-private.py          # 読み取り専用
python3 scripts/sync-private.py --apply  # 私用コピーの更新とcommitだけ
python3 scripts/sync-private.py --push   # 更新・commit・push
```

公開フレームの変更は従来どおり公開側でcommitし、`git push origin main` で送る。私用側の保存は `git private-push` を使う。公開側で `git push private` を使うと公開側の履歴を送ってしまうため、このリモートの直接pushは無効にする。同期コマンドは私用コピー内の `private` リモートを使う。

## 保存対象

- 公開側でGitに登録されたコード・テンプレート・スキル・文書の現在のファイル。新しいフレームのファイルは公開側で `git add` してから同期する。
- `projects/`、`assets/`、`pelsona/` の文書、設定、画像、音声、字幕、HTML、制作スクリプト。Gitignoreされている個別プロジェクトも含む。`work/` にある画像や文書も保存する。
- YouTubeのURL、素材の出典、存在確認・cleanup履歴。

動画はデモを含めて私用側には保存しない。動画拡張子に加え、`project.json` に `kind: video` として登録された素材も除外する。依存パッケージ、描画用コピー、キャッシュ、ログ、環境変数ファイルや鍵も除外する。対応するデータ形式はスクリプトの `DATA`、除外した件数と理由は計画出力で確認できる。100MiBを超える保存対象があれば、コピー前に停止する。

動画を一度Gitへ登録すると、通常の削除コミットだけでは過去の履歴から消えない。この運用では最初から動画を登録せず、制作中はローカルで保持し、完成後はcleanup方針に従う。私用リポジトリだけから動画を再制作できることは保証しない。

## 初期設定

Python 3.10以上、Git、認証済みのGitHub CLI（`gh`）を使う。`OWNER/PRIVATE_REPO` と `../PRIVATE_REPO` は実際の名前へ置き換える。作成先は既存の作業を上書きしない空のフォルダにする。

```sh
gh repo create OWNER/PRIVATE_REPO --private
git init --initial-branch=main ../PRIVATE_REPO
git -C ../PRIVATE_REPO remote add private https://github.com/OWNER/PRIVATE_REPO.git
git -C ../PRIVATE_REPO config privateSync.role mirror
git -C ../PRIVATE_REPO config privateSync.repository OWNER/PRIVATE_REPO

git config privateSync.repository OWNER/PRIVATE_REPO
git config privateSync.directory /absolute/path/to/PRIVATE_REPO
git remote add private https://github.com/OWNER/PRIVATE_REPO.git
git config remote.private.pushurl disabled://use-git-private-push
git config alias.private-plan '!python3 scripts/sync-private.py'
git config alias.private-push '!python3 scripts/sync-private.py --push'
git private-plan
git private-push
```

Gitの名前・メールがグローバル設定にない場合は、私用コピー内にも `user.name` と `user.email` を設定する。リポジトリ名、保存先、aliasはローカルのGit設定だけに置く。

## 同期の動作と復旧

初回は公開側の履歴を複製せず、選択したファイルから私用側の最初のコミットを作る。以後はファイルのハッシュで変更を判定する。作業元で消したファイルは私用コピーからも削除し、以前の私用コミットには残る。同じ内容の再実行ではコミットを増やさない。

同期前とpush直前にGitHub APIで非公開設定とリポジトリ名を確認する。私用コピーには専用のpre-pushフックも設定し、別の送信先や公開リポジトリへのpushを止める。私用コピーに手動変更がある場合、またはGitHub側に未取得の更新がある場合は、自動で上書き・マージ・force pushせず停止する。私用コピーは同期専用とし、通常の編集は作業元で行う。

失敗時は私用コピーの `git status` と `git diff` を確認する。コピー途中やcommit失敗で変更が残った場合も、内容を確認してから復旧する。元の制作フォルダや公開側のGit履歴には書き込まない。

私用側の `.private-sync/manifest.json` は保存対象・ハッシュ・対応する公開側のコミットを記録する。`.private-sync/public.gitignore` は公開側の除外ルールの控えで、私用側の `.gitignore` は同期専用ルールになっている。

別のPCでは公開フレームと私用リポジトリを別々にcloneする。私用コピーの `projects/`、`assets/`、`pelsona/` から必要なファイルを公開フレームの作業フォルダへ戻し、上記のローカルGit設定をやり直す。私用側の `.git` と `.gitignore` を公開側へコピーしない。動画は復元対象に含まれない。cloneにはフックやローカル設定が付かないため、私用コピーの設定を済ませ、最初の同期でフックを再作成する。

## 検証

```sh
python3 -B scripts/test_sync_private.py
```

一時リポジトリで対象選別、公開履歴との分離、再実行、更新・削除、シンボリックリンク、保存先や公開設定の取り違えを検証する。実プロジェクトの変更やGitHubへの送信は行わない。
