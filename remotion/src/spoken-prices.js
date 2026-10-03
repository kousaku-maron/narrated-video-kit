import {displayText} from './text.js';

const digits = {ぜろ: 0, れい: 0, いち: 1, に: 2, さん: 3, よん: 4, し: 4,
  ご: 5, ろく: 6, なな: 7, しち: 7, はち: 8, きゅう: 9, く: 9};
const units = {じゅう: 10, ひゃく: 100, せん: 1000, まん: 10000, おく: 100000000};
const tokens = [...Object.keys(digits), ...Object.keys(units)].sort((a, b) => b.length - a.length);
const kana = (text) => text.replace(/[ァ-ヶ]/gu, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));

// Decode conventional Japanese counted-number readings, independent of a
// project's dictionary. Never accept a dictionary mapping as evidence that a
// different spoken amount is equal to the displayed amount.
export function spokenNumber(value) {
  if (!value) return null;
  const numeric = displayText(`${value}円`).slice(0, -1);
  if (/^\d+$/u.test(numeric)) return Number.isSafeInteger(Number(numeric)) ? Number(numeric) : null;
  let remaining = kana(value).replace(/さんびゃく/gu, 'さんひゃく').replace(/ろっぴゃく/gu, 'ろくひゃく')
    .replace(/はっぴゃく/gu, 'はちひゃく').replace(/さんぜん/gu, 'さんせん').replace(/はっせん/gu, 'はちせん');
  let total = 0, section = 0, digit = null, previousSmall = Infinity, previousLarge = Infinity;
  while (remaining) {
    const token = tokens.find((candidate) => remaining.startsWith(candidate));
    if (!token) return null;
    remaining = remaining.slice(token.length);
    if (token in digits) {
      if (digit !== null) return null;
      digit = digits[token];
    } else if (units[token] < 10000) {
      const unit = units[token];
      if (unit >= previousSmall || digit === 0) return null;
      section += (digit ?? 1) * unit;
      digit = null;
      previousSmall = unit;
    } else {
      const unit = units[token];
      if (unit >= previousLarge) return null;
      total += (section + (digit ?? 0) || 1) * unit;
      section = 0; digit = null; previousSmall = Infinity; previousLarge = unit;
    }
  }
  const result = total + section + (digit ?? 0);
  return Number.isSafeInteger(result) ? result : null;
}

export function spokenSaleValues(text) {
  const normalized = kana(displayText(text)).toLowerCase().replace(/[\s,，]/gu, '');
  const match = /(?:今は|いまは)([^、。！？]+?)(?:%|ぱーせんと)(?:off|おふ)、?([^、。！？]+?)(?:円|えん)/u.exec(normalized);
  if (!match) return null;
  const discountPercent = spokenNumber(match[1]);
  const currentYen = spokenNumber(match[2]);
  return discountPercent === null || currentYen === null ? null : {discountPercent, currentYen};
}
