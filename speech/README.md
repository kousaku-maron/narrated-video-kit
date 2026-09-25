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
