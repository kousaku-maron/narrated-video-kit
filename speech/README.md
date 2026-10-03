# 音声生成ツール

AivisSpeech または VOICEVOX のローカルエンジンから WAV を作る Python CLI です。`src/indie_narration/` に実装、`tests/` にテスト、`pyproject.toml` にパッケージ設定をまとめています。動画ごとの台本と生成した音声はルートの `projects/` に保存します。

リポジトリのルートから実行する例：

```sh
PYTHONPATH=speech/src python3 -m indie_narration --engine aivis voices
PYTHONPATH=speech/src python3 -m indie_narration --engine aivis synthesize \
  --speaker-id 391794336 --text 'こんにちは。' --output work/sample.wav
PYTHONPATH=speech/src python3 -m unittest discover -s speech/tests -v
```

継続して使う場合は `python3 -m pip install -e ./speech` で `indie-narration` コマンドをインストールできます。動画の描画は `remotion/` で行います。

## 表示原稿と読みを分ける

字幕の日時・人数・数量・価格はアラビア数字にする。`prepare` と `synthesize` は `二人` → `2人`、`十月三日` → `10月3日` のように数量だけを正規化する。「十分に」「一緒」「一部」などの熟語は保持する。単独の「十分」は意味が曖昧なので、時間なら原稿から `10分` と書く。固有名詞に漢数字と助数詞が含まれる場合は表示結果を確認し、原稿を調整する。

TTS用の読み辞書はUTF-8 JSONの「表記: 読み」のオブジェクト。共通語、語り手、作品の順で `--readings` を繰り返すと、後の辞書が同じ語を上書きする。最長の一致を優先し、一度読み替えた文字を再度置換しない。作品固有の誤読は、その作品の `notes/readings.json` に置く。例えば必要な作品だけ `{"神獣":"しんじゅう","挑める":"いどめる","延長":"えんちょう"}` を指定する。共通engineへ作品の語彙を埋め込まない。

```sh
# エンジンへの接続や音声生成なしで表示・読みを確認
PYTHONPATH=speech/src python3 -m indie_narration prepare \
  --text '二人で神獣に挑めるぞ。' \
  --readings projects/YYYYMMDD-name/notes/readings.json

# のそ爺を選んだ制作例。声・話速は語り手設定で決める
PYTHONPATH=speech/src python3 -m indie_narration --engine aivis synthesize \
  --speaker-id 391794336 --speed-scale 1.15 \
  --text '二人で神獣に挑めるぞ。' \
  --readings pelsona/nosojii/readings.json \
  --readings projects/YYYYMMDD-name/notes/readings.json \
  --output work/voice-01.wav > work/voice-01.json

cd remotion
npm run project -- add YYYYMMDD-name ../work/voice-01.wav \
  --id voice-01 --origin aivis --voice-metadata ../work/voice-01.json
```

生成結果のJSONには `text`（字幕用）、`speechText`（実際のTTS入力）、`speakerId`、`speedScale`、WAVの `sha256` と実音声の長さを保存する。`--voice-metadata` はWAVとのハッシュ一致を確認して素材へ登録し、`text` を素材の `narrationText` に写す。場面の `narration.text` / `speechText` に同じ2つの原稿を設定する。原稿や辞書を変えたら音声とメタデータも作り直す。`check` は古い生成原稿や変更されたWAVを検出する。

価格を誤読する場合は、作品の読み辞書で `434円` → `よんひゃくさんじゅうよんえん` のように直せる。字幕用 `text` とチップは数字のまま保持する。価格検証は `speechText` のアラビア数字・漢数字・一般的なひらがな／カタカナの数詞を数値へ戻し、率と円額が字幕・チップと同値かを確認する。`%OFF` を `パーセントオフ` と読む指定も使える。意味が違う価格への読み替えや、解釈できない読みは通さない。読み替え後も実音声は試聴する。

全文を明示的に読ませたい場合は `--speech-text` を使える。字幕用 `text` は変えず、その文をTTSへ渡す。実際の発音・間・字幕タイミングは試聴と試写で確認する。

プロジェクト固有の音声準備スクリプトでも同じ処理を使う：

```python
from indie_narration.text import load_readings, prepare_text

readings = load_readings([project_dir / "notes/readings.json"])
pair = prepare_text(sentence, readings)
client.synthesize(pair["speechText"], speaker_id, output, speed_scale=speed_scale)
# 音声プランとproject.jsonへ pair["text"] / pair["speechText"] を保存する。
# 生成したWAVのsha256、話者・話速も記録する。
```

privateの制作スクリプトにある語彙リストは、対象作品の辞書へ移してこの関数を呼ぶ。共有フレームは語り手・作品の既定値を持たず、`pelsona/` と作品の `notes/` がそれぞれの設定を所有する。
