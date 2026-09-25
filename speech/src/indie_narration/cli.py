"""Command line entry point."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .client import DEFAULT_URLS, EngineError, SpeechClient


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate narration with a local speech engine")
    parser.add_argument("--engine", choices=DEFAULT_URLS, default="aivis")
    parser.add_argument("--url", help="Override the local engine URL")
    subcommands = parser.add_subparsers(dest="command", required=True)
    subcommands.add_parser("voices", help="List available speakers and style IDs")
    synth = subcommands.add_parser("synthesize", help="Generate one WAV file")
    source = synth.add_mutually_exclusive_group(required=True)
    source.add_argument("--text", help="Text to read aloud")
    source.add_argument("--text-file", type=Path, help="UTF-8 file containing text to read aloud")
    synth.add_argument("--speaker-id", type=int, required=True)
    synth.add_argument("--speed-scale", type=float, help="Speech speed (0.5–2.0); omit to use the engine default")
    synth.add_argument("--output", type=Path, required=True)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    client = SpeechClient(args.url or DEFAULT_URLS[args.engine])
    try:
        if args.command == "voices":
            for speaker in client.speakers():
                name = speaker.get("name", "Unknown")
                for style in speaker.get("styles", []):
                    print(f"{style.get('id')}\t{name} / {style.get('name', 'Default')}")
            return 0
        content = args.text if args.text is not None else args.text_file.read_text(encoding="utf-8")
        duration = client.synthesize(content, args.speaker_id, args.output, speed_scale=args.speed_scale)
        print(json.dumps({"output": str(args.output.resolve()), "duration_seconds": round(duration, 3)}, ensure_ascii=False))
        return 0
    except (EngineError, ValueError, OSError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
