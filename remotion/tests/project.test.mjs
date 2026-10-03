import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {displayText} from '../src/text.js';
import {captionPhrases, narrationCaptionCues} from '../src/captions.js';
import {validateProject} from '../src/project.js';
import {validatePrice, priceParts, saleAnnouncement} from '../src/pricing.js';
import {voiceMetadata} from '../src/narration.js';
import {spokenNumber, spokenSaleValues} from '../src/spoken-prices.js';

const cases = JSON.parse(await readFile(new URL('../../speech/tests/number-cases.json', import.meta.url)));
const sale = {status: 'sale', regularYen: 3980, currentYen: 1990, discountPercent: 50, region: 'JP',
  sourceUrl: 'https://store.steampowered.com/app/123456/', verifiedAt: '2026-10-03T12:00:00+09:00'};
const fixture = () => {
  const text = `『架空のゲーム』。${saleAnnouncement(sale)}。2人で一緒に遊ぶ。`;
  return {version: 1, title: 'Fixture', fps: 30, width: 1920, height: 1080,
    assets: {voice: {kind: 'audio', src: 'projects/fixture/assets/audio/voice.wav', durationSeconds: 5,
      narrationText: text, speechText: text, sha256: 'a'.repeat(64)}},
    scenes: [{id: 'game', narration: {asset: 'voice', text, speechText: text},
      overlays: [{type: 'label', text: '架空のゲーム', price: {...sale}}]}]};
};

test('counted numbers normalize in both caption paths; idioms survive', () => {
  for (const [input, expected] of cases) {
    assert.equal(displayText(input), expected);
    assert.equal(displayText(expected), expected);
    assert.equal(captionPhrases(input).join(''), expected);
    const cues = narrationCaptionCues(input, 8, 30, 252);
    assert.equal(cues.map((cue) => cue.text).join(''), expected);
    assert.equal(cues[0].from, 0);
    assert.equal(cues.at(-1).to, 240);
  }
});

test('price branches have no date, arrow, or normal-price prefix', () => {
  assert.deepEqual(priceParts(sale), {regular: '￥3,980', current: '￥1,990', discount: '（50%OFF）'});
  const regular = {...sale, status: 'regular', regularYen: 3980, currentYen: 3980, discountPercent: 0};
  validatePrice(regular);
  assert.deepEqual(priceParts(regular), {current: '￥3,980'});
  for (const [status, current] of [['unreleased', '未発売'], ['unknown', '価格不明']]) {
    validatePrice({status});
    assert.deepEqual(priceParts({status}), {current});
    assert.throws(() => validatePrice({status, currentYen: 100}));
  }
});

test('sale requires evidence, JP price, and consistent amounts', () => {
  validatePrice(sale);
  for (const change of [{discountPercent: 40}, {currentYen: 0}, {regularYen: -1}, {region: 'US'},
    {sourceUrl: 'https://example.com'}, {verifiedAt: '2026-10-03'}, {discountPercent: 0}]) {
    assert.throws(() => validatePrice({...sale, ...change}));
  }
  validatePrice({...sale, currentYen: 0, discountPercent: 100});
});

test('sale voice, displayed narration, and chip agree', () => {
  validateProject(fixture());
  for (const mutate of [
    (p) => {p.scenes[0].narration.text = p.scenes[0].narration.text.replace('1,990', '2,990');},
    (p) => {p.scenes[0].narration.speechText = p.scenes[0].narration.speechText.replace('50%', '40%');},
    (p) => {delete p.assets.voice.narrationText;},
    (p) => {delete p.assets.voice.sha256;},
    (p) => {p.scenes[0].overlays[0].meta = '別の価格';},
  ]) {
    const project = fixture(); mutate(project); assert.throws(() => validateProject(project));
  }
  const continuation = fixture();
  continuation.scenes[0].overlays[0].announcePrice = false;
  continuation.scenes[0].narration.text = continuation.assets.voice.narrationText = '冒険を続ける。';
  continuation.scenes[0].narration.speechText = continuation.assets.voice.speechText = 'ぼうけんをつづける。';
  validateProject(continuation);
});

test('transition stays silent and legacy demo remains valid', async () => {
  validateProject(JSON.parse(await readFile(new URL('../../projects/00000000-demo/project.json', import.meta.url))));
  const p = fixture(); p.scenes[0].overlays = [{type: 'transition', text: '次の作品'}];
  assert.throws(() => validateProject(p), /transition/);
  delete p.scenes[0].narration; p.scenes[0].durationSeconds = 2.4;
  validateProject(p);
  p.scenes[0].overlays.push({type: 'caption', text: '重なってはいけない字幕'});
  assert.throws(() => validateProject(p), /transition/);
});

test('phonetic price dictionary replacements pass, while different spoken prices/rates fail', () => {
  for (const [currentYen, regularYen, discountPercent, reading] of [
    [434, 620, 30, 'よんひゃくさんじゅうよんえん'],
    [874, 3499, 75, 'はっぴゃくななじゅうよんえん'],
  ]) {
    const project = fixture();
    const scene = project.scenes[0];
    scene.overlays[0].price = {...sale, currentYen, regularYen, discountPercent};
    scene.narration.text = project.assets.voice.narrationText = `『架空のゲーム』。${saleAnnouncement(scene.overlays[0].price)}。`;
    scene.narration.speechText = project.assets.voice.speechText = scene.narration.text.replace(`${currentYen}円`, reading);
    validateProject(project);
    assert.ok(scene.narration.text.includes(`${currentYen}円`));
    assert.ok(!scene.narration.speechText.includes(`${currentYen}円`));
    assert.ok(captionPhrases(scene.narration.text).join('').includes(`${currentYen}円`));
    // Update both scene and audio metadata: metadata equality alone must not
    // excuse a reading that denotes a different price or discount.
    const wrongAmount = structuredClone(project);
    wrongAmount.scenes[0].narration.speechText = wrongAmount.assets.voice.speechText = scene.narration.speechText.replace(reading, 'よんひゃくさんじゅうごえん');
    assert.throws(() => validateProject(wrongAmount), /spoken price\/discount/u);
    const wrongRate = structuredClone(project);
    wrongRate.scenes[0].narration.speechText = wrongRate.assets.voice.speechText = scene.narration.speechText.replace(`${discountPercent}%`, '31%');
    assert.throws(() => validateProject(wrongRate), /spoken price\/discount/u);
    const wrongDisplay = structuredClone(project);
    wrongDisplay.scenes[0].narration.text = wrongDisplay.assets.voice.narrationText = scene.narration.text.replace(`${currentYen}円`, '435円');
    assert.throws(() => validateProject(wrongDisplay), /display text/u);
  }
});

test('spoken number decoding supports conventional readings and rejects malformed ones', () => {
  for (const [reading, expected] of [['さんびゃく', 300], ['ろっぴゃく', 600], ['はっぴゃく', 800],
    ['さんぜん', 3000], ['はっせん', 8000], ['よんまんさんぜんにひゃくじゅういち', 43211],
    ['ゼロ', 0], ['四百三十四', 434], ['', null], ['1,990', null], ['じゅうひゃく', null], ['よえん', null], ['よんさん', null]]) {
    assert.equal(spokenNumber(reading), expected, reading);
  }
  assert.deepEqual(spokenSaleValues('いまはさんじゅうパーセントオフ、ヨンヒャクサンジュウヨンエンであそべるぞ。'), {discountPercent: 30, currentYen: 434});
  assert.deepEqual(spokenSaleValues('今は50%OFF、1,990円で遊べるぞ。'), {discountPercent: 50, currentYen: 1990});
});

test('voice metadata validates generated evidence without a character default', () => {
  const value = {text: '表示', speechText: 'ひょうじ', speakerId: 42, speedScale: null,
    sha256: 'b'.repeat(64), duration_seconds: 2};
  assert.equal(voiceMetadata(value).narrationText, '表示');
  assert.throws(() => voiceMetadata({...value, sha256: 'bad'}));
  assert.throws(() => voiceMetadata({...value, text: ''}));
});
