"""Deletion behavior tests using temporary fake projects; no real media is touched."""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('cleanup_videos.py')
SLUG = '20261002-example'
URL = 'https://www.youtube.com/watch?v=abcdefghijk'


class CleanupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.root = self.base / 'repo'
        self.project = self.root / 'projects' / SLUG
        self.plan = self.base / 'plan.json'
        self.verification = self.project / 'notes/published-video-verification.json'
        self.put('AGENTS.md', 'Fixture repository')
        self.put(f'projects/{SLUG}/VIDEO.md', f'公開済み\n{URL}\n')
        self.put(f'projects/{SLUG}/SCRIPT.md', '台本')
        self.put(f'projects/{SLUG}/assets/SOURCES.md', '素材出典')
        self.put(f'projects/{SLUG}/project.json', json.dumps({'assets': {
            'clip': {'kind': 'video', 'src': f'projects/{SLUG}/assets/footage/clip'}
        }}))
        self.videos = [f'projects/{SLUG}/assets/footage/clip',
                       f'projects/{SLUG}/assets/originals/local.MOV',
                       f'projects/{SLUG}/publish/final.mp4',
                       f'projects/{SLUG}/work/old.webm',
                       f'remotion/out/{SLUG}/draft.mp4',
                       f'remotion/public/projects/{SLUG}/assets/footage/clip']
        self.preserved = [f'projects/{SLUG}/assets/originals/image.png',
                          f'projects/{SLUG}/assets/audio/narration/voice.wav',
                          f'projects/{SLUG}/publish/subtitles.srt',
                          f'projects/{SLUG}/publish/thumbnail.html',
                          f'projects/{SLUG}/assets/footage/clip.source.txt',
                          'projects/20261001-other/assets/footage/keep.mp4',
                          'projects/00000000-demo/publish/final.mp4',
                          'assets/footage/shared.mp4']
        for relative in self.videos + self.preserved:
            self.put(relative, 'fixture content')

    def put(self, relative, content):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding='utf-8')

    def run_script(self, *args, success=True, slug=SLUG):
        result = subprocess.run([sys.executable, str(SCRIPT), '--repo-root', str(self.root),
                                 '--project', slug, *args], capture_output=True, text=True)
        if success:
            self.assertEqual(result.returncode, 0, result.stderr)
        else:
            self.assertNotEqual(result.returncode, 0, result.stdout)
        return result

    def make_plan(self):
        result = self.run_script('--youtube-url', URL, '--plan-out', str(self.plan))
        self.verification.parent.mkdir(parents=True, exist_ok=True)
        self.verification.write_text(json.dumps({
            'project': SLUG, 'youtube_url': URL,
            'checked_at': datetime.now(timezone.utc).isoformat(),
            'title': 'Fixture video', 'channel': 'Fixture channel',
            'method': 'fixture-browser', 'exists': True, 'matches_project': True,
            'evidence': 'Simulated observation for isolated deletion tests only.'
        }))
        return result

    def apply_plan(self, success=True):
        return self.run_script('--apply', str(self.plan), '--verification',
                               str(self.verification), success=success)

    def assert_videos_present(self):
        for relative in self.videos:
            self.assertTrue((self.root / relative).exists(), relative)

    def test_preview_and_apply_preserve_non_videos_and_other_projects(self):
        plan = json.loads(self.make_plan().stdout)
        self.assertEqual({f['path'] for f in plan['files']}, set(self.videos))
        self.assert_videos_present()
        self.assertFalse((self.project / 'notes/video-cleanup-history.json').exists())
        self.apply_plan()
        for relative in self.videos:
            self.assertFalse((self.root / relative).exists(), relative)
        for relative in self.preserved:
            self.assertTrue((self.root / relative).exists(), relative)
        history = json.loads((self.project / 'notes/video-cleanup-history.json').read_text())
        self.assertEqual(history[0]['status'], 'completed')
        self.assertEqual(set(history[0]['deleted_files']), set(self.videos))
        self.assertEqual(history[0]['deleted_bytes'], plan['total_bytes'])
        self.assertTrue(history[0]['started_at'].endswith('+09:00'))
        self.assertEqual(history[0]['verification']['title'], 'Fixture video')

    def test_repeat_after_fresh_plan_is_noop(self):
        self.make_plan()
        self.apply_plan()
        self.plan.unlink()
        self.make_plan()
        result = json.loads(self.apply_plan().stdout)
        self.assertEqual(result['status'], 'already-clean')
        history = json.loads((self.project / 'notes/video-cleanup-history.json').read_text())
        self.assertEqual(len(history), 1)

    def test_added_or_changed_video_invalidates_plan(self):
        self.make_plan()
        self.put(f'projects/{SLUG}/work/new.mp4', 'new video')
        self.apply_plan(success=False)
        self.assert_videos_present()
        (self.project / 'work/new.mp4').unlink()
        self.put(self.videos[0], 'changed content')
        self.apply_plan(success=False)
        self.assert_videos_present()

    def test_published_url_must_be_recorded(self):
        self.make_plan()
        self.put(f'projects/{SLUG}/VIDEO.md', '書き出し済み')
        self.apply_plan(success=False)
        self.assert_videos_present()

    def test_symlink_never_follows_external_video(self):
        outside = self.base / 'external.mp4'
        outside.write_text('keep external')
        (self.project / 'assets/footage/link.mp4').symlink_to(outside)
        self.run_script(success=False)
        self.assertTrue(outside.exists())
        self.assert_videos_present()

    def test_demo_and_traversal_rejected(self):
        for slug in ['00000000-demo', '../20261002-example', '20260230-invalid']:
            self.run_script(slug=slug, success=False)
        self.assert_videos_present()

    def test_plan_cannot_overwrite_project_record(self):
        self.run_script('--plan-out', str(self.project / 'VIDEO.md'), success=False)
        self.assertIn(URL, (self.project / 'VIDEO.md').read_text())

    def test_misclassified_audio_is_preserved(self):
        self.put(f'projects/{SLUG}/project.json', json.dumps({'assets': {
            'wrong': {'kind': 'video', 'src': f'projects/{SLUG}/assets/audio/narration/voice.wav'}
        }}))
        self.run_script(success=False)
        self.assertTrue((self.project / 'assets/audio/narration/voice.wav').exists())
        self.assert_videos_present()

    def test_url_alone_cannot_authorize_deletion_without_verification(self):
        self.make_plan()
        self.run_script('--apply', str(self.plan), success=False)
        self.assert_videos_present()
        self.assertFalse((self.project / 'notes/video-cleanup-history.json').exists())

    def test_verification_must_confirm_the_same_video_and_project(self):
        self.make_plan()
        original = json.loads(self.verification.read_text())
        for field, value in [('exists', False), ('matches_project', False),
                             ('youtube_url', 'https://youtu.be/12345678901'),
                             ('project', '20261001-other'), ('evidence', '')]:
            verification = {**original, field: value}
            self.verification.write_text(json.dumps(verification))
            self.apply_plan(success=False)
            self.assert_videos_present()

    def test_verification_before_plan_or_in_future_is_rejected(self):
        self.make_plan()
        original = json.loads(self.verification.read_text())
        plan_time = datetime.fromisoformat(json.loads(self.plan.read_text())['created_at'])
        for checked_at in [plan_time - timedelta(days=1), plan_time + timedelta(days=1)]:
            self.verification.write_text(json.dumps({**original, 'checked_at': checked_at.isoformat()}))
            self.apply_plan(success=False)
            self.assert_videos_present()


if __name__ == '__main__':
    unittest.main()
