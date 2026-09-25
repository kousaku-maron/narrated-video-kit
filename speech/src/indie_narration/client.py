"""Small client for the shared VOICEVOX / AivisSpeech synthesis API."""

from __future__ import annotations

import json
import math
import wave
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


DEFAULT_URLS = {
    "voicevox": "http://127.0.0.1:50021",
    "aivis": "http://127.0.0.1:10101",
}


class EngineError(Exception):
    """The local speech engine could not complete a request."""


class SpeechClient:
    def __init__(self, base_url: str, timeout: float = 30.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _request(self, path: str, *, method: str = "GET", body: bytes | None = None) -> bytes:
        request = Request(self.base_url + path, data=body, method=method)
        if body is not None:
            request.add_header("Content-Type", "application/json; charset=utf-8")
        try:
            with urlopen(request, timeout=self.timeout) as response:
                return response.read()
        except HTTPError as exc:
            detail = exc.read(500).decode("utf-8", errors="replace")
            raise EngineError(f"Engine returned HTTP {exc.code}: {detail}") from exc
        except URLError as exc:
            raise EngineError(f"Cannot connect to {self.base_url}: {exc.reason}") from exc

    def speakers(self) -> list[dict]:
        try:
            result = json.loads(self._request("/speakers"))
        except (ValueError, UnicodeDecodeError) as exc:
            raise EngineError("Engine returned an invalid speaker list") from exc
        if not isinstance(result, list):
            raise EngineError("Engine returned an invalid speaker list")
        return result

    def synthesize(self, text: str, speaker_id: int, output: Path, *, speed_scale: float | None = None) -> float:
        if not text.strip():
            raise ValueError("Text must not be empty")
        if speaker_id < 0:
            raise ValueError("Speaker ID must be nonnegative")
        if speed_scale is not None and (not math.isfinite(speed_scale) or not 0.5 <= speed_scale <= 2.0):
            raise ValueError("speed_scale must be between 0.5 and 2.0")
        params = urlencode({"text": text, "speaker": speaker_id})
        query_bytes = self._request(f"/audio_query?{params}", method="POST")
        try:
            query = json.loads(query_bytes)
        except (ValueError, UnicodeDecodeError) as exc:
            raise EngineError("Engine returned an invalid audio query") from exc
        if not isinstance(query, dict):
            raise EngineError("Engine returned an invalid audio query")
        if speed_scale is not None:
            query["speedScale"] = speed_scale
        wav_bytes = self._request(
            f"/synthesis?speaker={speaker_id}",
            method="POST",
            body=json.dumps(query, ensure_ascii=False).encode("utf-8"),
        )
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(wav_bytes)
        try:
            with wave.open(str(output), "rb") as audio:
                duration = audio.getnframes() / audio.getframerate()
        except (wave.Error, EOFError, ZeroDivisionError) as exc:
            output.unlink(missing_ok=True)
            raise EngineError("Engine returned an invalid WAV file") from exc
        return duration
