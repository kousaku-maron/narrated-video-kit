import io
import json
import tempfile
import threading
import unittest
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from indie_narration.client import EngineError, SpeechClient


def sample_wav() -> bytes:
    stream = io.BytesIO()
    with wave.open(stream, "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(24000)
        audio.writeframes(b"\x00\x00" * 2400)
    return stream.getvalue()


class FakeEngine(BaseHTTPRequestHandler):
    requests = []
    wav = sample_wav()

    def log_message(self, *args):
        pass

    def do_GET(self):
        self.requests.append(("GET", self.path, None))
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'[{"name":"Sample","styles":[{"id":42,"name":"Normal"}]}]')

    def do_POST(self):
        parsed = urlsplit(self.path)
        body = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        self.requests.append(("POST", self.path, body))
        if parsed.path == "/audio_query":
            params = parse_qs(parsed.query)
            assert params["speaker"] == ["42"]
            assert params["text"] == ["日本語のテスト。"]
            payload = b'{"speedScale":1.0}'
        elif parsed.path == "/synthesis":
            payload = self.wav
        else:
            self.send_error(404)
            return
        self.send_response(200)
        self.end_headers()
        self.wfile.write(payload)


class SpeechClientTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), FakeEngine)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.client = SpeechClient(f"http://127.0.0.1:{cls.server.server_port}")

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def setUp(self):
        FakeEngine.requests = []

    def test_speakers(self):
        self.assertEqual(self.client.speakers()[0]["styles"][0]["id"], 42)

    def test_synthesize_reports_duration_and_sends_query_unchanged(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "audio.wav"
            duration = self.client.synthesize("日本語のテスト。", 42, output)
            self.assertAlmostEqual(duration, 0.1)
            self.assertTrue(output.is_file())
        self.assertEqual([urlsplit(item[1]).path for item in FakeEngine.requests], ["/audio_query", "/synthesis"])
        self.assertEqual(json.loads(FakeEngine.requests[-1][2]), {"speedScale": 1.0})

    def test_speed_scale_is_sent_to_engine(self):
        with tempfile.TemporaryDirectory() as directory:
            self.client.synthesize("日本語のテスト。", 42, Path(directory) / "audio.wav", speed_scale=1.15)
        self.assertEqual(json.loads(FakeEngine.requests[-1][2]), {"speedScale": 1.15})

    def test_invalid_speed_does_not_call_engine(self):
        with self.assertRaises(ValueError):
            self.client.synthesize("日本語のテスト。", 42, Path("unused.wav"), speed_scale=0)
        self.assertEqual(FakeEngine.requests, [])

    def test_empty_text_does_not_call_engine(self):
        with self.assertRaises(ValueError):
            self.client.synthesize("  ", 42, Path("unused.wav"))
        self.assertEqual(FakeEngine.requests, [])

    def test_invalid_wav_is_removed(self):
        old_wav = FakeEngine.wav
        FakeEngine.wav = b"not a wav"
        try:
            with tempfile.TemporaryDirectory() as directory:
                output = Path(directory) / "audio.wav"
                with self.assertRaises(EngineError):
                    self.client.synthesize("日本語のテスト。", 42, output)
                self.assertFalse(output.exists())
        finally:
            FakeEngine.wav = old_wav


if __name__ == "__main__":
    unittest.main()
