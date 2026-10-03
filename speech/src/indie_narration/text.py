"""Display text and TTS readings, independent of engines and characters."""

from __future__ import annotations

import json
import re
from pathlib import Path

NUMERALS = "零〇一二三四五六七八九十百千万億"
DIGITS = dict(zip("零〇一二三四五六七八九", (0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9)))
UNITS = {"十": 10, "百": 100, "千": 1000, "万": 10000, "億": 100000000}
COUNTERS = "年|ヶ月|か月|月|日|時間|時|分|秒|人|名|個|本|枚|匹|台|回|件|円|割|％|%|パーセント|選|作品|週間|週|倍|体|歳"
NUMBER = re.compile(f"([{NUMERALS}]+)({COUNTERS})")


def kanji_number(value: str) -> int:
    if not any(char in UNITS for char in value):
        return int("".join(str(DIGITS[char]) for char in value))
    total = section = digit = 0
    for char in value:
        if char in DIGITS:
            digit = DIGITS[char]
        elif UNITS[char] < 10000:
            section += (digit or 1) * UNITS[char]
            digit = 0
        else:
            total += (section + digit or 1) * UNITS[char]
            section = digit = 0
    return total + section + digit


def display_text(text: str) -> str:
    """Convert counted numbers only; retain idioms and ambiguous 十分."""
    text = text.translate(str.maketrans("０１２３４５６７８９％", "0123456789%"))

    def replace(match: re.Match) -> str:
        word = match.group()
        tail = text[match.end():]
        if word == "十分" and not re.match(r"(間|後|前|ほど|程度|以内|以上|以下|くらい)", tail):
            return word
        if word == "一人" and tail.startswith(("前", "称")):
            return word
        if word == "一時" and tail.startswith(("的", "停止", "保存", "間的")):
            return word
        if (word == "一日" and tail.startswith("千秋")) or (word == "二人" and tail.startswith("三脚")):
            return word
        return str(kanji_number(match[1])) + match[2]

    return NUMBER.sub(replace, text)


def load_readings(paths: list[Path]) -> dict[str, str]:
    """Merge dictionaries in order: shared, persona, then project overrides."""
    readings = {}
    for path in paths:
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict) or any(
            not isinstance(key, str) or not key.strip() or
            not isinstance(value, str) or not value.strip()
            for key, value in data.items()
        ):
            raise ValueError(f"Reading dictionary must map nonempty text to readings: {path}")
        readings.update(data)
    return readings


def spoken_text(text: str, readings: dict[str, str] | None = None) -> str:
    """Longest exact match wins; replacements are never replaced again."""
    readings = readings or {}
    if not readings:
        return text
    pattern = re.compile("|".join(re.escape(key) for key in sorted(readings, key=len, reverse=True)))
    return pattern.sub(lambda match: readings[match.group()], text)


def prepare_text(text: str, readings: dict[str, str] | None = None,
                 speech_text: str | None = None) -> dict[str, str]:
    display = display_text(text)
    speech = speech_text if speech_text is not None else spoken_text(display, readings)
    if not display.strip() or not speech.strip():
        raise ValueError("Display and speech text must not be empty")
    return {"text": display, "speechText": speech}
