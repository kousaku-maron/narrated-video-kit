import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {copyFile, mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('init records pending upload fields; voice import checks WAV evidence and protects existing folders', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'narrated-video-cli-'));
  try {
    for (const directory of ['remotion/src', 'remotion/scripts', 'projects', 'templates']) {
      await mkdir(path.join(root, directory), {recursive: true});
    }
    for (const name of ['src/project.js', 'src/pricing.js', 'src/spoken-prices.js', 'src/text.js', 'src/narration.js', 'src/captions.js', 'scripts/project.mjs', 'scripts/export-subtitles.mjs']) {
      await copyFile(new URL(`../${name}`, import.meta.url), path.join(root, 'remotion', name));
    }
    await writeFile(path.join(root, 'remotion/package.json'), '{"type":"module"}');
    await copyFile(new URL('../../templates/upload-record.json', import.meta.url), path.join(root, 'templates/upload-record.json'));
    const run = (...args) => spawnSync(process.execPath, [path.join(root, 'remotion/scripts/project.mjs'), ...args], {encoding: 'utf8'});
    const slug = '20991231-integration';
    const initialized = run('init', slug);
    assert.equal(initialized.status, 0, initialized.stderr);
    const publish = path.join(root, 'projects', slug, 'publish');
    const record = JSON.parse(await readFile(path.join(publish, 'upload-record.json')));
    assert.equal(record.latestYouTubeId, null);
    assert.equal(record.publishedAtJst, null);
    assert.ok(Object.values(record.settings).every((value) => value === null));
    assert.ok(Object.values(record.checks).every((check) => check.status === 'pending'));
    for (const file of ['title.txt', 'description.txt', 'tags.txt']) assert.equal(await readFile(path.join(publish, file), 'utf8'), '');
    await writeFile(path.join(publish, 'title.txt'), 'User title');
    assert.notEqual(run('init', slug).status, 0);
    assert.equal(await readFile(path.join(publish, 'title.txt'), 'utf8'), 'User title');

    const wav = Buffer.alloc(4844);
    wav.write('RIFF'); wav.writeUInt32LE(4836, 4); wav.write('WAVEfmt ', 8);
    wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(24000, 24); wav.writeUInt32LE(48000, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
    wav.write('data', 36); wav.writeUInt32LE(4800, 40);
    const input = path.join(root, 'voice.wav'); await writeFile(input, wav);
    const meta = path.join(root, 'voice.json');
    const metadata = {text: '2人で遊ぶ。', speechText: 'ふたりであそぶ。', speakerId: 42, speedScale: 1.15,
      duration_seconds: 0.1, sha256: '0'.repeat(64)};
    await writeFile(meta, JSON.stringify(metadata));
    assert.notEqual(run('add', slug, input, '--id', 'voice', '--voice-metadata', meta).status, 0);
    metadata.sha256 = createHash('sha256').update(wav).digest('hex');
    await writeFile(meta, JSON.stringify(metadata));
    const added = run('add', slug, input, '--id', 'voice', '--voice-metadata', meta);
    assert.equal(added.status, 0, added.stderr);
    const manifest = path.join(root, 'projects', slug, 'project.json');
    const project = JSON.parse(await readFile(manifest));
    assert.equal(project.assets.voice.narrationText, metadata.text);
    assert.equal(project.assets.voice.speechText, metadata.speechText);
    project.scenes[0].narration = {asset: 'voice', text: metadata.text, speechText: metadata.speechText};
    await writeFile(manifest, JSON.stringify(project));
    const srt = path.join(publish, 'subtitles.srt');
    const exported = spawnSync(process.execPath, [path.join(root, 'remotion/scripts/export-subtitles.mjs'), slug, srt], {encoding: 'utf8'});
    assert.equal(exported.status, 0, exported.stderr);
    const subtitles = await readFile(srt, 'utf8');
    assert.match(subtitles, /2人で遊ぶ。/u);
    assert.doesNotMatch(subtitles, /ふたりであそぶ/u);
    // A changed WAV cannot pass check even if its path and duration still exist.
    const imported = path.join(root, 'projects', slug, 'assets/audio/sfx/voice.wav');
    await writeFile(imported, Buffer.from(wav).fill(1, 44));
    const changed = run('check', slug);
    assert.notEqual(changed.status, 0);
    assert.match(changed.stderr, /sha256/);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
