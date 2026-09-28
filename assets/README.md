# 共通素材

このフォルダは、複数の動画で再利用する素材の原本を置く場所です。`music/`、`sfx/`、`backgrounds/`、`branding/` を直接並べます。使う素材は `remotion/` の `npm run project -- add` で `projects/<動画名>/assets/` にコピーしてください。ここに置くだけでは動画に自動挿入されません。

ゲーム固有の画像や録画は、使う動画プロジェクトの `assets/` に保存します。採用前の元ファイルを残す場合は、そのプロジェクトの `assets/originals/` を使います。たとえば Invokyr の元画像は `projects/20260923-invokyr-review/assets/originals/images/` にあります。語り手の設定とアバターは `pelsona/` で管理します。

## 置き場

| 種類 | フォルダ | 例 |
| --- | --- | --- |
| BGM | `music/` | 紹介用、不穏な場面用、盛り上げ用 |
| 効果音 | `sfx/` | 場面切替、短い衝撃音、操作音 |
| 汎用背景 | `backgrounds/` | 紙、カード、無地の背景 |
| チャンネル共通素材 | `branding/` | ロゴ、共通のデザイン素材 |

音声や画像などの実ファイルはGitの対象外です。このフォルダと、Git対象外の動画プロジェクトは別途バックアップしてください。

## 取り込む素材

- BGM・効果音はWAVまたはMP3をそのまま置きます。動画に取り込んだ後で音量を調整できます。
- ファイル名は `calm-loop.wav`、`scene-switch.wav` のように内容が分かるものにします。
- ダウンロード素材には同じフォルダに `素材名.source.txt` を添え、配布元URL・作者・利用条件・必要なクレジットを記録します。

最初から大量に集めず、制作中に必要になったものから追加します。

## 現在の素材

| ファイル | 出典 | 用途 |
| --- | --- | --- |
| `music/echoes-andrew-ev.mp3` | [Mixkit: Echoes](https://mixkit.co/free-stock-music/tag/horror/) / Andrew Ev | 静かな不穏さ。以前の Invokyr 試作で使用 |
| `music/piano-horror-francisco-alvear.mp3` | [Mixkit: Piano Horror](https://mixkit.co/free-stock-music/tag/horror/) / Francisco Alvear | 強めのホラー曲。今は未使用 |
| `music/spirit-in-the-woods-alejandro-magana.mp3` | [Mixkit: Spirit in the Woods](https://mixkit.co/free-stock-music/instrument/sound-effects/) / Alejandro Magaña | 静かな紹介・探索向け。今は未使用 |
| `music/driving-ambition-ahjay-stelino.mp3` | [Mixkit: Driving Ambition](https://mixkit.co/free-stock-music/mood/uplifting/) / Ahjay Stelino | 明るい紹介・まとめ向け。今は未使用 |
| `music/bombinsound-advertising-presentation-beat-way-up.mp3` | [Pixabay: Advertising Presentation (Beat Way Up)](https://pixabay.com/music/alternative-hip-hop-advertising-presentation-beat-way-up-601205/) / BombinSound | ユーザー提供。Invokyr 本編の仮 BGM |
| `music/sekuora-bgm-videogame-song.mp3` | ユーザー提供。[Pixabay 掲載曲](https://pixabay.com/music/pop-bgm-videogame-song-242440/)と曲名・作者・尺が一致 | Invokyr レビューの BGM |
| `sfx/cinematic-whoosh-fast-transition.wav` | [Mixkit: Transition SFX](https://mixkit.co/free-sound-effects/transition/) | 場面切替 |
| `sfx/horror-impact.wav` | [Mixkit: Impact SFX](https://mixkit.co/free-sound-effects/impact/) | 強調・締め |
| `sfx/select-click.wav` | [Mixkit: Interface SFX](https://mixkit.co/free-sound-effects/interface/) | 小さなUI操作音。今は未使用 |

素材そのものを再配布する際の条件は、動画内で使用する条件とは異なる場合があります。元ページやライセンスへのリンクは、各ファイルの `.source.txt` でも確認できます。
