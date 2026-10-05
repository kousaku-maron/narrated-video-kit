# Narrated Video Kit

台本・素材・音声をプロジェクトごとにまとめ、ナレーション付き動画を作るローカルツールです。ゲーム紹介・レビューを例にしていますが、題材は限定しません。Python の音声生成 CLI が AivisSpeech / VOICEVOX から WAV を作り、`remotion/` の描画ツールが画像・録画・文字・音声を組み合わせて MP4 にします。

## フォルダ構成

- `projects/`: 動画ごとの台本・素材・完成版
- `templates/`: 次の動画に使う企画・台本・画面設計・投稿文のひな形
- `pelsona/`: 語り手ごとの設定とアバター
- `assets/`: 複数の動画で再利用する素材の原本
- `remotion/`: プレビューと動画書き出しの実装
- `speech/`: AivisSpeech / VOICEVOX の音声生成 CLI・設定・テスト

## まず完成デモを見る

[動画制作デモ](projects/00000000-demo/VIDEO.md) に約42秒の完成MP4、台本、素材、場面設定を同梱しています。MP4はそのまま再生できます。場面を編集してプレビューする場合は Node.js 20 以降を用意し、次を実行します。

```sh
cd remotion
npm install
npm run check -- 00000000-demo
npm run studio -- 00000000-demo
```

デモの再生・書き出しには音声エンジンは不要です。

## 新しい音声を作る場合の準備

- Python 3.10 以降
- 起動済みの [AivisSpeech](https://aivis-project.com/) または [VOICEVOX](https://voicevox.hiroshiba.jp/)

このツール自体には追加の Python パッケージは必要ありません。リポジトリ内で `PYTHONPATH=speech/src python3 -m indie_narration` と実行できます。継続して使う場合は `python3 -m pip install -e ./speech` で `indie-narration` コマンドも入ります。

## 使い方

まず利用できる話者とスタイル ID を確認します。

```sh
PYTHONPATH=speech/src python3 -m indie_narration --engine aivis voices
PYTHONPATH=speech/src python3 -m indie_narration --engine voicevox voices
```

現在のナレーションには、AivisSpeech の「ろてじん（長老ボイス）」のノーマル（話者 ID `391794336`）を使います。選んだ ID で短い原稿を WAV にします。

```sh
PYTHONPATH=speech/src python3 -m indie_narration --engine aivis synthesize \
  --speaker-id 391794336 \
  --text 'インボキアのデモ版を遊んでみたぞ。' \
  --output work/sample.wav
```

話者 ID は `voices` の出力でも確認できます。長めの原稿は `--text-file script.txt` で渡せます。生成後は WAV の絶対パスと秒数を JSON で表示します。独自のエンジン URL を使う場合はサブコマンドの前に `--url http://127.0.0.1:PORT` を指定します。

デフォルトの接続先は AivisSpeech が `127.0.0.1:10101`、VOICEVOX が `127.0.0.1:50021` です。どちらのエンジンも `/speakers`、`/audio_query`、`/synthesis` を使用します。AivisSpeech の API は VOICEVOX と概ね互換ですが、得られた音声クエリは書き換えずに返しています。

## 現時点の範囲

- 1 回の実行で 1 つの WAV を生成します。動画に使う場合は場面ごとに実行します。
- エンジンのインストールや起動、声の選定はまだ自動化していません。
- 「ろてじん（長老ボイス）」のライセンスは [ACML 1.0](https://github.com/Aivis-Project/ACML/blob/master/ACML-1.0.md) です。営利利用は認められ、クレジットは任意です。体験を伝える感想や評論そのものを禁じる記述はありませんが、実在する商品などへの批判を目的とした活動への利用は禁止されています。レビューで否定的な所感を述べることと、作品への批判を動画の主目的にすることは区別して考えてください。ライセンスにはゲームレビューの具体例がないため、境界が気になる企画は権利者に確認してください。

## 動画を作る

映像の準備、素材の追加、プレビュー、MP4 書き出しは [remotion/README.md](remotion/README.md) を参照してください。動画ごとに `VIDEO.md`、`SCRIPT.md`、`project.json`、素材の原本を [projects/](projects/README.md) にまとめます。用途別のひな形は [templates/](templates/README.md) にあります。新規制作の冒頭・投稿文・導線・公開前後の確認は [YouTube制作・公開チェック](templates/YOUTUBE_CHECKLIST.md) に沿って進め、`project init` が作る `publish/YOUTUBE_CHECKLIST.md` に結果を残します。`00000000-demo/` 以外の動画プロジェクトは公開リポジトリには含めません。共通素材の原本は [assets/](assets/README.md) に置きます。場面を追加するたびに途中版を確認できます。手持ちの動画・画像と生成画像を同じように背景素材として使えます。

個別プロジェクトの記録と画像・音声は、動画を除いて別の非公開リポジトリへ保存できます。初期設定と `git private-push` の使い方は [公開フレームと非公開の制作記録](docs/private-sync.md) を参照してください。

制作を支援するエージェントの進め方は [AGENTS.md](AGENTS.md) に記録しています。新規動画では最初にテンプレートを提案し、スクリーンショットは候補画像を見せて表示箇所を確認してから採用します。

語り手の口調・性格・音声とアバター画像は、[pelsona/](pelsona/README.md) にキャラクターごとにまとめます。動画で使う際は、そのキャラクターの `PELSONA.md` を台本の基準にします。

## ライセンス

コードと一般向けドキュメント、独自制作した一部のデモ素材は [MIT License](LICENSE) です。**のそ爺のキャラクターとアバター、ろてじんで生成したデモ音声、完成デモ動画にはMITを適用しません。** 自分の動画を作る際はキャラクター素材を差し替え、音声モデルと外部素材それぞれの利用条件を確認してください。対象ファイルごとの扱いは [ライセンス方針](LICENSING.md) にまとめています。

## テスト

実際の音声エンジンなしで API の呼び出し順と WAV の検証を試せます。

```sh
PYTHONPATH=speech/src python3 -m unittest discover -s speech/tests -v
```

## 参照

- [VOICEVOX ENGINE API](https://github.com/VOICEVOX/voicevox_engine)
- [AivisSpeech Engine API](https://github.com/Aivis-Project/AivisSpeech-Engine)
- [Remotion](https://www.remotion.dev/docs/)
