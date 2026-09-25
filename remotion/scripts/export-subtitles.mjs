import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {framesFor, sceneSeconds, validateProject} from '../src/project.js';
import {narrationCaptionCues} from '../src/captions.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [slug, output] = process.argv.slice(2);
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug ?? '') || !output) {
  throw new Error('Usage: node scripts/export-subtitles.mjs PROJECT output.srt');
}
const project = validateProject(JSON.parse(await readFile(path.join(root, '..', 'projects', slug, 'project.json'), 'utf8')));
const clock = (frame) => {
  const milliseconds = Math.round(frame * 1000 / project.fps);
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor(milliseconds / 60000) % 60;
  const seconds = Math.floor(milliseconds / 1000) % 60;
  const ms = milliseconds % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};
let frame = 0;
const cues = [];
for (const scene of project.scenes) {
  const sceneFrames = framesFor(sceneSeconds(scene, project), project.fps);
  const narration = scene.narration?.asset && project.assets[scene.narration.asset];
  if (narration && scene.narration.text) {
    for (const cue of narrationCaptionCues(scene.narration.text, narration.durationSeconds, project.fps, sceneFrames)) {
      cues.push(`${cues.length + 1}\n${clock(frame + cue.from)} --> ${clock(frame + cue.to)}\n${cue.text}\n`);
    }
  }
  frame += sceneFrames;
}
await writeFile(path.resolve(output), `${cues.join('\n')}\n`, 'utf8');
console.log(`Saved ${cues.length} subtitle cues to ${path.resolve(output)}`);
