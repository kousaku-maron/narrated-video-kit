"""Generate the original, seamless ambient WAV used by the demo."""

from __future__ import annotations

import math
import struct
import wave
from pathlib import Path


OUTPUT = Path(__file__).resolve().parents[1] / "assets/audio/music/sample-ambient.wav"
SAMPLE_RATE = 24_000
DURATION_SECONDS = 12


def main() -> None:
    frames = bytearray(SAMPLE_RATE * DURATION_SECONDS * 4)
    for index in range(SAMPLE_RATE * DURATION_SECONDS):
        time = index / SAMPLE_RATE
        pulse = 0.72 + 0.12 * math.cos(2 * math.pi * time / 6)
        left = pulse * sum(
            volume * math.sin(2 * math.pi * frequency * time)
            for frequency, volume in ((110, 0.15), (165, 0.09), (220, 0.07))
        )
        right = pulse * sum(
            volume * math.sin(2 * math.pi * frequency * time + phase)
            for frequency, volume, phase in ((110, 0.15, 0.1), (165, 0.09, 0.25), (220, 0.07, 0.4))
        )
        struct.pack_into("<hh", frames, index * 4, round(left * 32767), round(right * 32767))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUTPUT), "wb") as audio:
        audio.setnchannels(2)
        audio.setsampwidth(2)
        audio.setframerate(SAMPLE_RATE)
        audio.writeframes(frames)
    print(OUTPUT)


if __name__ == "__main__":
    main()
