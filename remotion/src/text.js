// Keep the counted-number policy in sync with indie_narration.text.
// Both implementations run the shared number-cases.json regression fixture.
const digits = Object.fromEntries([...'零〇一二三四五六七八九'].map((char, index) => [char, Math.max(0, index - 1)]));
const units = {十: 10, 百: 100, 千: 1000, 万: 10000, 億: 100000000};
const numberPattern = /([零〇一二三四五六七八九十百千万億]+)(年|ヶ月|か月|月|日|時間|時|分|秒|人|名|個|本|枚|匹|台|回|件|円|割|％|%|パーセント|選|作品|週間|週|倍|体|歳)/gu;

const kanjiNumber = (value) => {
  if (![...value].some((char) => units[char])) return Number([...value].map((char) => digits[char]).join(''));
  let total = 0, section = 0, digit = 0;
  for (const char of value) {
    if (char in digits) digit = digits[char];
    else if (units[char] < 10000) { section += (digit || 1) * units[char]; digit = 0; }
    else { total += (section + digit || 1) * units[char]; section = 0; digit = 0; }
  }
  return total + section + digit;
};

export function displayText(value) {
  const text = value.replace(/[０-９％]/gu, (char) => char === '％' ? '%' : String(char.charCodeAt(0) - 0xff10));
  return text.replace(numberPattern, (word, number, counter, offset) => {
    const tail = text.slice(offset + word.length);
    if (word === '十分' && !/^(間|後|前|ほど|程度|以内|以上|以下|くらい)/u.test(tail)) return word;
    if (word === '一人' && /^(前|称)/u.test(tail)) return word;
    if (word === '一時' && /^(的|停止|保存|間的)/u.test(tail)) return word;
    if ((word === '一日' && tail.startsWith('千秋')) || (word === '二人' && tail.startsWith('三脚'))) return word;
    return `${kanjiNumber(number)}${counter}`;
  });
}
