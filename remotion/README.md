# Remotion 描画ツール

Remotion で画像・録画・文字・音声を場面ごとに組み合わせます。1本の動画をルートの `projects/<動画名>/` にまとめ、直下の `VIDEO.md` に企画、`SCRIPT.md` に台本、`project.json` に実際の場面設定を置きます。採用素材は `assets/`、完成動画・字幕・サムネイル・投稿文は `publish/`、調査と映像設計は `notes/` に分けます。

共通素材は [`../assets/README.md`](../assets/README.md) の置き場に、ゲーム固有の素材は各動画プロジェクトの `assets/` に保存してください。使う共通素材は動画プロジェクトに取り込みます。各フォルダの役割は [../projects/README.md](../projects/README.md) にまとめました。

## 準備とサンプル

Node.js 20 以降を用意し、このディレクトリで実行します。

```sh
cd remotion
npm install
npm run check -- 00000000-demo
npm run studio -- 00000000-demo
```

Studio で [完成デモ](../projects/00000000-demo/VIDEO.md) をプレビューできます。静止画と短い動画の背景、架空のゲーム画像、AivisSpeech「ろてじん（長老ボイス）」の音声、字幕、章タイトル、BGM、締め画面を収録しています。素材は同梱されているため、プレビューや書き出し時に AivisSpeech を起動する必要はありません。MP4 を作るには次を実行します。

```sh
npm run render -- 00000000-demo
```

出力は `out/00000000-demo/draft-日時.mp4` です。同じプロジェクトを再度書き出しても以前の版は残ります。

完成デモの `../projects/00000000-demo/publish/final.mp4` と `subtitles.srt` は同梱しています。再生成するときは `npm run final -- 00000000-demo --replace` を実行します。通常の新規プロジェクトでは `npm run final -- <動画名>` で初回の完成版を作ります。

## 自分のプロジェクトを作る

フォルダ名は `YYYYMMDD-name`。日付は制作開始日（日本時間）で、公開日が変わっても固定します。以下の `20260928-my-game` は例なので、新しい動画では開始日と名前を置き換えてください。

```sh
npm run project -- init 20260928-my-game
npm run project -- add 20260928-my-game /absolute/path/to/gameplay.mp4 --id gameplay
npm run project -- add 20260928-my-game /absolute/path/to/background.png --id background --origin generated
npm run project -- add 20260928-my-game /absolute/path/to/voice.wav --id voice-01 --origin aivis
npm run project -- add 20260928-my-game /absolute/path/to/music.mp3 --id music-01 --category music
npm run check -- 20260928-my-game
npm run studio -- 20260928-my-game
npm run render -- 20260928-my-game
npm run final -- 20260928-my-game
```

`init` は制作ファイルと種類別の `assets/`、`publish/`、`notes/` をルートの `projects/` に作ります。`add` は素材を `../projects/20260928-my-game/assets/` にコピーし、`project.json` の `assets` に登録します。`check`・`studio`・`render`・`final` は必要な素材を `public/projects/20260928-my-game/assets/` にコピーしてから実行します。`public/` のコピーを編集せず、原本を編集してください。

画像は PNG/JPEG/WebP/SVG、動画は MP4/WebM/MOV、音声は WAV/MP3/M4A を取り込めます。動画は `assets/footage/`、音声は `assets/audio/narration|music|sfx/` に入り、`--category` で音声の種類を明示できます。元ファイルの隣に `素材名.source.txt` があれば、その内容を `assets/SOURCES.md` に記録します。動画形式・コーデックによっては Remotion 側で再生できない場合があります。WAV なら長さを読み取って登録します。`--origin` は `provided`、`generated`、`aivis` から選べます。

`00000000-demo/` 以外の動画プロジェクトは、台本・設定・素材・完成動画を含めて Git の対象外です。ローカルの `projects/` をバックアップ対象に含めてください。

## 場面を追加する

`../projects/20260928-my-game/SCRIPT.md` に原稿と見せ方を書き、`project.json` の `scenes` に以下のような場面を追加します。順番が再生順です。音声を作り直す時は、確定した原稿を `narration.text` にも反映します。

```json
{
  "id": "gameplay-01",
  "background": {"asset": "gameplay", "trimStartSeconds": 12, "volume": 0, "fit": "cover"},
  "narration": {"asset": "voice-01", "text": "インボキアのデモ版を遊んでみたぞ。"},
  "padAfterSeconds": 0.5,
  "overlays": [
    {"type": "label", "text": "Invokyr", "meta": "デモ版"},
    {"type": "headline", "text": "ここに強調したい感想を書く"}
  ]
}
```

`narration.text` は原稿の記録用です。画面に表示する文字は `overlays` に別に書くので、表示名「Invokyr」と読み「インボキア」を使い分けられます。`durationSeconds` を指定すると場面の長さを固定できます。省略した場合は登録した WAV の長さに `padAfterSeconds`（既定 0.4 秒）を足します。

セール紹介などで `intro-title` を使う場合、`text` に加えて `badge`、`eyebrow`、`line1`、`line2`、`count`、`periodLabel`、`periodText` を指定します。`accentColor` は任意の6桁HEX色です。これらの文言は `project.json` から差し替えられます。配置と使用例は [セール紹介テンプレート](../templates/steam-sale-picks/VISUALS.md) を参照してください。

背景は `{"asset":"登録したID"}` か `{"color":"#172b3d"}`。文字部品は `title`、`label`、`headline`、`caption` に加え、短い主張の `statement`、問いの `question`、大きな数字の `stat`、順序を示す `steps`、2項目の対比を示す `pair` を使えます。`steps` は `items` に2〜4個、`pair` は2個の文字列を指定します。`overlays: []` なら素材を全面に見せられます。素材や場面を追加したら `npm run check -- 20260928-my-game` で参照切れを確認してください。Studio は `project.json` の変更を読み直します。

一つのナレーション場面で背景を切り替える場合は、`backgroundCuts` に場面開始からの秒数と素材IDを並べます。最初は `atSeconds: 0` にし、動画素材の途中から使うときは `trimStartSeconds` を指定します。

```json
"backgroundCuts": [
  {"atSeconds": 0, "asset": "trailer", "trimStartSeconds": 0, "volume": 0},
  {"atSeconds": 7, "asset": "screenshot"}
]
```

動画を背景に流しながら画像を重ねる場合は、場面に `"inset": {"asset": "登録した画像ID", "position": "right", "width": 950}` を追加します。`position` は `left` も選べます。資料を大きく見せる場面は `"layout": "feature", "width": 1220` を指定します。横長画像には数値の `aspectRatio` を指定できます。同じ画像を連続する場面で保持する場合、二つ目以降の `inset` / `insetSegments` に `"reveal": false` を付けると表示アニメーションが繰り返されません。

動画を場面をまたいで流し続けるには、プロジェクトに `backgroundPlaylist` を設定します。各動画に `durationSeconds` を指定し、必要な区間だけを使う場合は `trimStartSeconds` も指定します。場面に `background` を指定した場合、その場面だけ背景を上書きできます。画像を場面内の一部の時間だけ表示するには `insetSegments` を使います。

長い本人録画へ切り替える構成では `backgroundPlaylistEndAtSeconds` にトレーラー背景を止める時刻を指定します。本人録画の場面には `background` と `rawBackground: true` を指定すると、録画の明るさを変えずに表示できます。録画音声は `background.volume` で再生します。

```json
"backgroundPlaylist": [{"asset": "trailer", "trimStartSeconds": 0, "durationSeconds": 18}],
"insetSegments": [{"asset": "screenshot", "layout": "feature", "width": 1320, "atSeconds": 4, "durationSeconds": 8}]
```

発話全文を画面に焼き込まず、YouTube 側で選択できる字幕にする場合は SRT を書き出します。

```sh
node scripts/export-subtitles.mjs 20260928-my-game out/20260928-my-game/subtitles.srt
```

`npm run final -- 20260928-my-game` では、同じ字幕を `../projects/20260928-my-game/publish/subtitles.srt` に書き出します。

## BGM・効果音・動き

音声素材も `project -- add` で取り込み、`project.json` に設定します。BGM は動画全体で再生され、冒頭と終わりで音量が滑らかに変わります。場面ごとの効果音は `sfx` で再生時刻と音量を指定できます。

```json
"soundtrack": {"asset": "music-01", "volume": 0.09, "loop": true, "fadeInSeconds": 1.5, "fadeOutSeconds": 2}
```

動画の後半で別の収録音声に切り替える場合は、`soundtrack.endAtSeconds` にBGMを止める動画全体の秒数を指定できます。`fadeOutSeconds` はその時刻より前に適用されます。

長い実プレイ映像の後でBGMを再開する場合は、再開する無声タイトル場面を `endingSoundtrack.startSceneId` に指定します。指定した場面から動画の最後まで同じ曲を連続再生し、最初と最後にフェードを付けられます。

```json
"endingSoundtrack": {"asset": "music-01", "startSceneId": "transition-ending", "volume": 0.12, "loop": true, "fadeInSeconds": 1, "fadeOutSeconds": 2}
```

場面には次の項目を追加できます。

```json
"motion": {"backgroundZoom": true, "textEntrance": true, "fadeEdges": true},
"sfx": [{"asset": "scene-whoosh", "atSeconds": 0.3, "volume": 0.11}]
```

`backgroundZoom` は静止画をゆっくり拡大、`textEntrance` は文字を順に出現、`fadeEdges` は場面の前後を短く暗転させます。すべて省略可能です。音量は 0〜1 で、ナレーションを聞き取りやすいよう BGM と効果音は小さめから調整してください。

章見出しを左上に固定する動画では、次の設定で共通の章トランジションを使えます。各場面の `chapterLabel` が変わる時、通常は左上の小見出しだけを短く切り替えます。大きな転換点では、前のナレーション場面の後に、ナレーションのない専用場面を約2.2秒置きます。その場面に次の章の `chapterLabel` と `"chapterStart": true` を設定し、画面中央に白い枠・番号・章名を表示します。次のナレーションは専用場面の終了後に始めます。背景映像とBGMは続きます。`chapterIntro` も設定されている場合は、このトランジションを優先します。

```json
"chapterPlacement": "top-left-fixed",
"chapterTransition": {"durationSeconds": 2.2, "minorDurationSeconds": 0.24}
```

雪景色など明るい背景で中央の白枠が読みにくい場合は、`chapterTransition.cardOpacity` を 0〜1 で追加して枠内の暗さを調整できます。省略時は従来の 0.29 です。

```json
{"id":"transition-next","durationSeconds":2.2,"chapterLabel":"次の章","chapterStart":true,"overlays":[]}
```

この専用場面を次のナレーション場面の直前に置き、次の場面にも同じ `chapterLabel` を付けます。専用場面には `narration` を設定しません。
章名のない実プレイ映像を挟む場合も、映像の前後にこの専用場面を置けます。実プレイ映像には章見出しを重ねず、後続のタイトルは最後に表示した章名から切り替わります。

## 語り手のアバター

動画全体の `project.json` に `"persona": "nosojii"` を指定し、表示したい場面に `"avatar": true` を追加します。アバターは場面の外側のレイヤーで描画され、連続する表示場面ではスライドが切り替わっても立ち絵が消えません。アバターの原本は `../pelsona/nosojii/avatar/` に置いたままで、プレビュー・書き出し前に `public/pelsona/nosojii/` へコピーされます。音声のある場面ではナレーションWAVの音量で3種類の口を切り替え、音声のない場面では口を閉じます。BGMと効果音は口パクの判定に使いません。

## 音声を作る

リポジトリのルートで AivisSpeech を起動した状態で、既存の CLI から WAV を生成します。

```sh
PYTHONPATH=speech/src python3 -m indie_narration --engine aivis synthesize \
  --speaker-id 391794336 \
  --speed-scale 1.15 \
  --text 'インボキアのデモ版を遊んでみたぞ。' \
  --output work/voice-01.wav
```

その後 `cd remotion` して `npm run project -- add 20260928-my-game ../work/voice-01.wav --id voice-01 --origin aivis` で取り込みます。原稿、素材、場面を少しずつ足すことで途中版を育てられます。
