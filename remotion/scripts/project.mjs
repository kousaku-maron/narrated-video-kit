import {constants} from 'node:fs';
import {copyFile, mkdir, open, readFile, rename, stat, unlink, utimes, writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sceneSeconds, totalFrames, validateProject} from '../src/project.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const projectsDir = path.join(root, '..', 'projects');
const personasDir = path.join(root, '..', 'pelsona');
const supported = {
  '.png': 'image', '.jpg': 'image', '.jpeg': 'image', '.webp': 'image', '.svg': 'image',
  '.mp4': 'video', '.webm': 'video', '.mov': 'video',
  '.wav': 'audio', '.mp3': 'audio', '.m4a': 'audio',
};

const fail = (message) => { throw new Error(message); };
const safeSlug = (value) => {
  if (!/^[a-z0-9][a-z0-9-]{0,49}$/.test(value ?? '')) fail('Project name must use lowercase letters, numbers, and hyphens');
  return value;
};
const manifestPath = (slug) => path.join(projectsDir, safeSlug(slug), 'project.json');
const projectAssetsDir = (slug) => path.join(projectsDir, safeSlug(slug), 'assets');
const save = async (filename, value) => {
  const temporary = `${filename}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporary, filename);
};
const load = async (slug) => {
  const project = JSON.parse(await readFile(manifestPath(slug), 'utf8'));
  return validateProject(project);
};

async function stageFile(source, destination, label) {
  const sourceInfo = await stat(source).catch(() => null);
  if (!sourceInfo?.isFile()) fail(`${label} is missing: ${source}`);
  const stagedInfo = await stat(destination).catch(() => null);
  if (!stagedInfo?.isFile() || stagedInfo.size !== sourceInfo.size || Math.abs(stagedInfo.mtimeMs - sourceInfo.mtimeMs) > 1) {
    await mkdir(path.dirname(destination), {recursive: true});
    await copyFile(source, destination);
    await utimes(destination, sourceInfo.atime, sourceInfo.mtime);
  }
}

async function wavSeconds(filename) {
  const handle = await open(filename, 'r');
  try {
    const header = Buffer.alloc(12);
    await handle.read(header, 0, 12, 0);
    if (header.toString('ascii', 0, 4) !== 'RIFF' || header.toString('ascii', 8, 12) !== 'WAVE') return null;
    const fileSize = (await handle.stat()).size;
    let offset = 12;
    let byteRate = null;
    let dataSize = null;
    while (offset + 8 <= fileSize) {
      const chunk = Buffer.alloc(8);
      await handle.read(chunk, 0, 8, offset);
      const size = chunk.readUInt32LE(4);
      const type = chunk.toString('ascii', 0, 4);
      if (type === 'fmt ' && size >= 16) {
        const format = Buffer.alloc(16);
        await handle.read(format, 0, 16, offset + 8);
        byteRate = format.readUInt32LE(8);
      }
      if (type === 'data') {
        dataSize = size;
        break;
      }
      offset += 8 + size + (size % 2);
    }
    return byteRate && dataSize ? Number((dataSize / byteRate).toFixed(3)) : null;
  } finally {
    await handle.close();
  }
}

async function check(slug) {
  const project = await load(slug);
  for (const [id, asset] of Object.entries(project.assets)) {
    const filename = path.resolve(publicDir, asset.src);
    if (!filename.startsWith(`${publicDir}${path.sep}`)) fail(`Asset ${id} points outside public/`);
    const prefix = `projects/${slug}/assets/`;
    if (!asset.src.startsWith(prefix)) fail(`Asset ${id} must be stored under ${prefix}`);
    const source = path.resolve(projectAssetsDir(slug), asset.src.slice(prefix.length));
    if (!source.startsWith(`${projectAssetsDir(slug)}${path.sep}`)) fail(`Asset ${id} points outside the project assets/`);
    await stageFile(source, filename, `Asset ${id}`);
  }
  if (project.persona) {
    const persona = safeSlug(project.persona);
    for (const name of ['base.png', 'mouth_closed.png', 'mouth_half.png', 'mouth_open.png']) {
      await stageFile(
        path.join(personasDir, persona, 'avatar', name),
        path.join(publicDir, 'pelsona', persona, name),
        `Avatar ${persona}/${name}`,
      );
    }
  }
  for (const scene of project.scenes) {
    const narration = scene.narration?.asset && project.assets[scene.narration.asset];
    if (narration?.durationSeconds && scene.durationSeconds && scene.durationSeconds < narration.durationSeconds) {
      console.warn(`warning: Scene ${scene.id} is shorter than its narration (${narration.durationSeconds}s)`);
    }
  }
  console.log(`${project.title}: ${project.scenes.length} scenes, ${Object.keys(project.assets).length} assets, ${(totalFrames(project) / project.fps).toFixed(2)}s`);
  return project;
}

async function init(slug) {
  const filename = manifestPath(slug);
  if (await stat(filename).catch(() => null)) fail(`Project already exists: ${slug}`);
  await mkdir(path.dirname(filename), {recursive: true});
  for (const category of ['images', 'footage', 'audio/narration', 'audio/music', 'audio/sfx']) {
    const directory = path.join(projectAssetsDir(slug), category);
    await mkdir(directory, {recursive: true});
    await writeFile(path.join(directory, '.gitkeep'), '');
  }
  await writeFile(path.join(projectAssetsDir(slug), 'SOURCES.md'), '# 素材出典\n\n追加した素材の出典は `project -- add` で記録されます。\n');
  await mkdir(path.join(projectsDir, slug, 'publish'), {recursive: true});
  await writeFile(path.join(projectsDir, slug, 'publish', 'PUBLISH.md'), `# ${slug}｜投稿用テキスト\n\n## タイトル\n\n## 説明文\n`);
  await mkdir(path.join(projectsDir, slug, 'notes'), {recursive: true});
  await writeFile(path.join(projectsDir, slug, 'notes', '.gitkeep'), '');
  await save(filename, {
    version: 1, title: slug, fps: 30, width: 1920, height: 1080,
    theme: {accent: '#f6c84c'}, assets: {},
    scenes: [{id: 'opening', durationSeconds: 3, background: {color: '#172b3d'}, overlays: [{type: 'title', text: slug}]}],
  });
  await writeFile(path.join(projectsDir, slug, 'VIDEO.md'), `# ${slug}\n\n- 状態: 構成中\n- 語り手: 未設定\n- 目標尺: 未設定\n\n## 企画\n\nこの動画で伝えることを記入します。\n\n## 素材\n\n採用した素材は \`assets/\`、出典は \`assets/SOURCES.md\` に置きます。共通素材はリポジトリ直下の \`assets/\`、キャラクター設定は \`pelsona/\` を参照します。\n`);
  await writeFile(path.join(projectsDir, slug, 'SCRIPT.md'), `# ${slug} 台本\n\n## opening\n\n- ナレーション: （ここに記入）\n- 映像・画面文字: （ここに記入）\n\n場面 ID は \`project.json\` と揃えます。\n`);
  console.log(`Created ${filename}`);
}

async function add(slug, input, options) {
  if (!input) fail('Pass a local media file to add');
  const project = await load(slug);
  const source = path.resolve(input);
  const sourceInfo = await stat(source);
  if (!sourceInfo.isFile()) fail('Input must be a file');
  const extension = path.extname(source).toLowerCase();
  const kind = supported[extension];
  if (!kind) fail(`Unsupported file type: ${extension}`);
  const idPosition = options.indexOf('--id');
  const originPosition = options.indexOf('--origin');
  const categoryPosition = options.indexOf('--category');
  const id = idPosition >= 0 ? options[idPosition + 1] : `asset-${String(Object.keys(project.assets).length + 1).padStart(3, '0')}`;
  const origin = originPosition >= 0 ? options[originPosition + 1] : 'provided';
  const requestedCategory = categoryPosition >= 0 ? options[categoryPosition + 1] : null;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id ?? '')) fail('Asset ID must use lowercase letters, numbers, and hyphens');
  if (project.assets[id]) fail(`Asset ID already exists: ${id}`);
  if (!['provided', 'generated', 'aivis'].includes(origin)) fail('origin must be provided, generated, or aivis');
  if (requestedCategory && (kind !== 'audio' || !['narration', 'music', 'sfx'].includes(requestedCategory))) {
    fail('--category is only for audio: narration, music, or sfx');
  }
  const audioCategory = requestedCategory ?? (origin === 'aivis' ? 'narration' : ['.mp3', '.m4a'].includes(extension) ? 'music' : 'sfx');
  const category = kind === 'video' ? 'footage' : kind === 'audio' ? `audio/${audioCategory}` : origin === 'generated' ? 'images/generated' : 'images';
  const relative = `projects/${slug}/assets/${category}/${id}${extension}`;
  const destination = path.join(projectAssetsDir(slug), category, `${id}${extension}`);
  await mkdir(path.dirname(destination), {recursive: true});
  if (source !== destination) await copyFile(source, destination, constants.COPYFILE_EXCL);
  const sourceNote = `${source}.source.txt`;
  const note = (await stat(sourceNote).catch(() => null))?.isFile() ? await readFile(sourceNote, 'utf8') : '出典: 未記入';
  const asset = {kind, src: relative, origin, originalName: path.basename(source)};
  if (extension === '.wav') {
    const duration = await wavSeconds(destination);
    if (duration) asset.durationSeconds = duration;
  }
  project.assets[id] = asset;
  await save(manifestPath(slug), project);
  const sourcesPath = path.join(projectAssetsDir(slug), 'SOURCES.md');
  const previous = await readFile(sourcesPath, 'utf8').catch(() => '# 素材出典\n');
  await writeFile(sourcesPath, `${previous.trimEnd()}\n\n## ${id}\n\n- 保存先: ${category}/${id}${extension}\n- 元ファイル: ${path.basename(source)}\n\n${note.trim()}\n`, 'utf8');
  console.log(`Added ${id} (${kind}) to ${slug}`);
}

async function remotion(args) {
  const binary = path.join(root, 'node_modules', '.bin', 'remotion');
  const child = spawn(binary, args, {cwd: root, stdio: 'inherit'});
  const status = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', resolve);
  });
  if (status !== 0) process.exitCode = status || 1;
}

async function exportSubtitles(slug, output) {
  const child = spawn(process.execPath, [path.join(root, 'scripts', 'export-subtitles.mjs'), slug, output], {cwd: root, stdio: 'inherit'});
  const status = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', resolve);
  });
  if (status !== 0) process.exitCode = status || 1;
}

async function main() {
  const [command, slug, ...rest] = process.argv.slice(2);
  if (command === 'init') return init(slug);
  if (command === 'add') return add(slug, rest[0], rest.slice(1));
  if (command === 'check') return check(slug);
  if (command === 'studio') {
    await check(slug);
    return remotion(['studio', 'src/index.jsx', `--props=${manifestPath(slug)}`, ...rest]);
  }
  if (command === 'render' || command === 'still') {
    await check(slug);
    const stamp = new Date().toISOString().replace(/[-:.]/g, '').replace('T', '-').replace('Z', '');
    const extension = command === 'still' ? 'png' : 'mp4';
    let defaultOutput = path.join(root, 'out', slug, `draft-${stamp}.${extension}`);
    for (let suffix = 2; await stat(defaultOutput).catch(() => null); suffix++) {
      defaultOutput = path.join(root, 'out', slug, `draft-${stamp}-${suffix}.${extension}`);
    }
    const output = rest[0] && !rest[0].startsWith('--') ? path.resolve(rest[0]) : defaultOutput;
    const extra = rest[0] && !rest[0].startsWith('--') ? rest.slice(1) : rest;
    await mkdir(path.dirname(output), {recursive: true});
    await remotion([command, 'src/index.jsx', 'IndieVideo', output, `--props=${manifestPath(slug)}`, ...extra]);
    if (!process.exitCode) console.log(`Saved ${output}`);
    return;
  }
  if (command === 'final') {
    if (rest.some((option) => option !== '--replace')) fail('Usage: npm run final -- PROJECT [--replace]');
    await check(slug);
    const publishDir = path.join(projectsDir, slug, 'publish');
    await mkdir(publishDir, {recursive: true});
    const output = path.join(publishDir, 'final.mp4');
    if (await stat(output).catch(() => null) && !rest.includes('--replace')) {
      fail(`Final video already exists: ${output}. Pass --replace to replace it.`);
    }
    const temporary = path.join(publishDir, 'final.rendering.mp4');
    if (await stat(temporary).catch(() => null)) fail(`Temporary render already exists: ${temporary}`);
    await remotion(['render', 'src/index.jsx', 'IndieVideo', temporary, `--props=${manifestPath(slug)}`]);
    if (process.exitCode) {
      await unlink(temporary).catch(() => {});
      return;
    }
    await rename(temporary, output);
    await exportSubtitles(slug, path.join(publishDir, 'subtitles.srt'));
    if (!process.exitCode) console.log(`Published ${output}`);
    return;
  }
  console.log('Usage: npm run project -- <init|add|check|studio|render|still|final> PROJECT [file|output]');
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exitCode = 1;
});
