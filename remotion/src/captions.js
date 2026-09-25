import {framesFor} from './project.js';

const MAX_CHARS = 26;

const splitLongClause = (clause) => {
  const chunks = [];
  let chars = [...clause];
  while (chars.length > MAX_CHARS) {
    let cut = MAX_CHARS;
    for (let index = MAX_CHARS - 1; index >= 16; index--) {
      if (/[、，・ はがをにでともへの]/u.test(chars[index])) {
        cut = index + 1;
        break;
      }
    }
    chunks.push(chars.slice(0, cut).join(''));
    chars = chars.slice(cut);
  }
  if (chars.length) chunks.push(chars.join(''));
  return chunks;
};

// Preserve every character from the narration script while making each cue
// short enough to read over moving footage.
export function captionPhrases(value) {
  const text = value?.trim() ?? '';
  if (!text) return [];
  const clauses = (text.match(/[^、。！？!?]+[、。！？!?]?/gu) ?? [text]).flatMap(splitLongClause);
  const phrases = [];
  let current = '';
  for (const clause of clauses) {
    if (current && [...current, ...clause].length > MAX_CHARS) {
      phrases.push(current);
      current = '';
    }
    current += clause;
  }
  if (current) phrases.push(current);
  return phrases;
}

export function narrationCaptionCues(text, durationSeconds, fps, sceneFrames) {
  const phrases = captionPhrases(text);
  if (!phrases.length) return [];
  const speechFrames = Math.min(sceneFrames, framesFor(durationSeconds, fps));
  const weights = phrases.map((phrase) => [...phrase].filter((char) => !/[、。！？!?]/u.test(char)).length);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let consumed = 0;
  return phrases.map((phrase, index) => {
    const from = Math.round(speechFrames * consumed / total);
    consumed += weights[index];
    const to = index === phrases.length - 1 ? speechFrames : Math.round(speechFrames * consumed / total);
    return {from, to, text: phrase};
  });
}
