# ライセンス方針

このリポジトリのコード・ドキュメントは、以下の例外を除き [MIT License](LICENSE) で公開します。著作権表示とライセンス文を残せば、改変・再配布・商用利用もできます。デモを自分の動画の土台にする際は、下記のキャラクターと音声の扱いを確認してください。

| 対象 | 扱い |
| --- | --- |
| `speech/`、`remotion/`、`projects/demo/scripts/`、デモの設定と一般向けドキュメント | MIT |
| `projects/demo/assets/images/*.svg`、`projects/demo/assets/footage/sample-motion.webm`、`projects/demo/assets/audio/music/sample-ambient.wav` | このリポジトリ用に作成したサンプル素材。MIT |
| `pelsona/nosojii/` のキャラクター設定・名称・外見・アバター画像 | MIT対象外。利用条件は [のそ爺の権利表示](pelsona/nosojii/RIGHTS.md) を参照 |
| `projects/demo/assets/audio/narration/*.wav` | AivisSpeechの「ろてじん（長老ボイス）」で生成した音声。MIT対象外。下記のモデル利用条件を確認 |
| `projects/demo/publish/final.mp4`、`projects/demo/publish/subtitles.srt`、デモ台本ののそ爺固有の台詞 | キャラクターと合成音声を含む見本。MIT対象外。独立した動画・音声・台詞素材としての再利用は許可していません |
| `assets/` に記録した外部配布素材、各ゲームの画像・映像 | このリポジトリのMITでは許諾しません。各配布元の条件に従ってください。通常、素材の実ファイルはGitに含めません |

## 合成音声

デモ音声は [AivisHubの「ろてじん（長老ボイス）」](https://hub.aivis-project.com/aivm-models/696c98a2-c0b7-4fe7-8cf2-c7e9b8a9bd82) を使用しています。このモデルの表示ライセンスは [ACML 1.0](https://github.com/Aivis-Project/ACML/blob/master/ACML-1.0.md) です。ACMLは**音声合成モデルの利用条件**であり、生成されたWAVをこのリポジトリのMITで再許諾するものではありません。音声モデル本体はリポジトリに含めていません。

自分の動画に同じ声を使う場合は、モデルの利用条件を確認し、自分で音声を生成してください。のそ爺はこのモデルの公式キャラクターではありません。モデルとキャラクターの利用条件は別です。

## デモを改変するとき

デモは仕組みの確認と編集例として同梱しています。自分の動画を公開する場合は、のそ爺の画像・設定・固有の台詞を自分のキャラクターに差し替えてください。MIT対象のコード、抽象背景、架空のゲーム画像、BGMはそのまま利用できます。実在するゲームの素材や外部BGMを追加する場合は、それぞれの出典と利用条件を確認してください。
