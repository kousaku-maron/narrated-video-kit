# のそ爺 アバター素材 v1

口パク用の独自デザインの「きもかわ」なナマケモノ長老です。公式の「ろてじん」キャラクター画像を使ったものではありません。

このキャラクターと画像はMIT対象外です。利用範囲は [のそ爺の権利表示](../RIGHTS.md) を参照してください。

## ファイル

- `base.png`：口のない立ち絵。背景は透過済み。
- `mouth_closed.png`：閉じた口。
- `mouth_half.png`：半開きの口。
- `mouth_open.png`：開いた口。
- `preview_mouth_states.png`：3状態を重ねた確認画像。

立ち絵と口3枚はすべて **1186 × 1327 px** です。同じ位置と大きさで重ねてください。口の画像には口以外を描いていません。声がない時は `mouth_closed.png` を表示します。

## 動画での使い方

AivisSpeechのナレーションWAVから音量を読み取り、Remotionで3枚の口を切り替えます。BGMは判定に混ぜません。キャラを小さく表示する用途なので、母音単位の厳密な口形はまだ作っていません。

## 出典と制作

- 立ち絵：Codex built-in image generationで生成し、同じ画像を編集して小さく丸いマスコットに調整。
- 口パーツ：Codexが図形からPNGを作成。3枚は同じ座標で描画。
- 声として使う予定のモデル：[ろてじん（長老ボイス）](https://hub.aivis-project.com/aivm-models/696c98a2-c0b7-4fe7-8cf2-c7e9b8a9bd82?owner=Rotejin)／[ACML 1.0](https://github.com/Aivis-Project/ACML/blob/master/ACML-1.0.md)。この画像は音声モデルの公式キャラクターを表すものではありません。

### 最終生成プロンプト

> Use case: illustration-story. Asset type: reusable talking mascot sprite for a Japanese indie-game review video. Create ONE original NON-HUMAN, sloth-inspired elderly mascot: a tiny endearingly weird grandfather sloth creature. Clearly recognizable sloth traits: shaggy muted taupe-brown fur, dark soft eye-mask patches, unusually long thin arms ending in three small curved claws, rounded hunched body, little feet, broad small nose. Elder cues: uneven fluffy ivory eyebrows, a short scruffy ivory chin tuft, slightly droopy mismatched eyes with a curious kindly stare, a few odd whisker-like fur wisps. Wears only a simple faded mustard scarf. 'Kimo-kawa' mood: mildly uncanny and quirky but affectionate and approachable, like a strange old creature you want to protect; not grotesque or scary. Clean original 2D picture-book cartoon, hand-drawn dark outlines, restrained warm colors, flat color with subtle textured shading, readable at 250px tall. Centered straight-on full-body pose with both long arms visible; exact front view makes layering easy. Critical lip-sync requirement: absolutely NO MOUTH or mouth line; leave a smooth unobstructed fur area immediately below the nose and above the chin tuft where separate mouth sprites will be composited. The chin tuft must not overlap the mouth area. Genuinely transparent alpha background. No text, logo, props, scenery, shadow, border, extra characters, or resemblance to any existing franchise mascot.

### マスコット化の編集プロンプト

> Edit this original sloth elder mascot into a smaller, simpler 2D kawaii mascot sprite while retaining its distinctive mildly uncanny old-sloth identity. Keep the sloth eye patches, uneven sleepy eyes and silver eyebrows, shaggy ivory chin tuft, mustard scarf, long sloth arms with three claws, front-facing pose, and warm brown palette. Make the head rounder and larger relative to the body, body compact and squat, claws shorter and less threatening. Simplify the fur into clean bold shapes with sparse texture and dark tidy outlines so the character remains readable at 250px tall. The resulting mood should be 'kimo-kawa': oddly charming, slightly unsettling, very lovable, not realistic or threatening. Critical: NO MOUTH or mouth line, and leave a smooth unobstructed fur-colored area below the nose and above the chin tuft for later mouth overlay. Genuine transparent alpha background. No text, scenery, props, shadow, border, extra characters, or resemblance to existing mascots.
