import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from indie_narration.cli import main
from indie_narration.text import display_text, load_readings, prepare_text, spoken_text


class TextTests(unittest.TestCase):
    def test_shared_number_cases(self):
        cases = json.loads(Path(__file__).with_name("number-cases.json").read_text())
        for original, expected in cases:
            with self.subTest(original=original):
                self.assertEqual(display_text(original), expected)
                self.assertEqual(display_text(expected), expected)

    def test_longest_match_without_cascading(self):
        self.assertEqual(spoken_text("AB A", {"A": "B", "AB": "A", "B": "X"}), "A B")

    def test_project_override_and_display_separation(self):
        with tempfile.TemporaryDirectory() as directory:
            shared, project = [Path(directory) / name for name in ("shared.json", "project.json")]
            shared.write_text(json.dumps({"Example": "共通読み"}))
            project.write_text(json.dumps({"Example": "作品読み", "神獣": "しんじゅう", "挑める": "いどめる", "延長": "えんちょう"}))
            pair = prepare_text("Example、二人で神獣に挑める。延長。", load_readings([shared, project]))
            self.assertEqual(pair["text"], "Example、2人で神獣に挑める。延長。")
            self.assertEqual(pair["speechText"], "作品読み、2人でしんじゅうにいどめる。えんちょう。")

    def test_invalid_dictionary_and_empty_speech(self):
        with tempfile.TemporaryDirectory() as directory:
            dictionary = Path(directory) / "readings.json"
            dictionary.write_text('{"": "bad"}')
            with self.assertRaises(ValueError): load_readings([dictionary])
        with self.assertRaises(ValueError): prepare_text("表示", speech_text=" ")

    def test_price_readings_change_speech_only(self):
        readings = {"434円": "よんひゃくさんじゅうよんえん", "874円": "はっぴゃくななじゅうよんえん"}
        for amount, reading in readings.items():
            with self.subTest(amount=amount):
                original = f"今は30%OFF、{amount}で遊べるぞ。"
                pair = prepare_text(original, readings)
                self.assertEqual(pair["text"], original)
                self.assertEqual(pair["speechText"], original.replace(amount, reading))

    def test_prepare_cli_never_connects_to_engine(self):
        with patch("indie_narration.cli.SpeechClient.synthesize") as synthesize, contextlib.redirect_stdout(io.StringIO()) as output:
            self.assertEqual(main(["prepare", "--text", "二人で一緒に。", "--speech-text", "ふたりでいっしょに。"]), 0)
        synthesize.assert_not_called()
        self.assertEqual(json.loads(output.getvalue()), {"text": "2人で一緒に。", "speechText": "ふたりでいっしょに。"})

    def test_synthesis_passes_reading_and_emits_wav_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            wav = Path(directory) / "voice.wav"
            def generate(text, speaker, output, **kwargs):
                self.assertEqual((text, speaker, kwargs["speed_scale"]), ("ふたりで。", 391794336, 1.15))
                output.write_bytes(b"generated wav fixture")
                return 0.2
            with patch("indie_narration.cli.SpeechClient.synthesize", side_effect=generate), contextlib.redirect_stdout(io.StringIO()) as output:
                code = main(["synthesize", "--text", "二人で。", "--speech-text", "ふたりで。", "--speaker-id", "391794336", "--speed-scale", "1.15", "--output", str(wav)])
            result = json.loads(output.getvalue())
            self.assertEqual(code, 0)
            self.assertEqual(result["text"], "2人で。")
            self.assertEqual(len(result["sha256"]), 64)


if __name__ == "__main__": unittest.main()
