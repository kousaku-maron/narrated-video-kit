"""Isolated private-sync checks. Never upload files or modify real repositories."""

import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('sync_private', Path(__file__).with_name('sync-private.py'))
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class PrivateSyncTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.source = Path(self.temp.name) / 'source'
        self.dest = Path(self.temp.name) / 'private'
        self.repo = 'example/private-production'
        for root in (self.source, self.dest):
            root.mkdir()
            sync.git(root, 'init', '-q', '--initial-branch=main')
            sync.git(root, 'config', 'user.name', 'Test')
            sync.git(root, 'config', 'user.email', 'test@example.invalid')
            sync.git(root, 'config', 'commit.gpgsign', 'false')
        for name in sync.DATA_ROOTS:
            (self.source / name).mkdir()
        (self.source / 'README.md').write_text('Framework\n')
        (self.source / '.gitignore').write_text('projects/*\nassets/*\n*.wav\n')
        (self.source / 'scripts').mkdir()
        (self.source / 'scripts/tool.sh').write_text('#!/bin/sh\ntrue\n')
        (self.source / 'scripts/tool.sh').chmod(0o755)
        sync.git(self.source, 'add', '.')
        sync.git(self.source, 'commit', '-qm', 'Framework only')
        sync.git(self.dest, 'config', 'privateSync.role', 'mirror')
        sync.git(self.dest, 'config', 'privateSync.repository', self.repo)
        sync.git(self.dest, 'remote', 'add', 'private', sync.expected_url(self.repo))
        self.project = self.source / 'projects/20261002-example'
        self.project.mkdir()
        (self.project / 'VIDEO.md').write_text('Private project\n')
        (self.project / 'voice.wav').write_bytes(b'RIFF audio')
        (self.project / 'image.png').write_bytes(b'image')
        (self.project / 'project.json').write_text(json.dumps({'assets': {
            'video': {'kind': 'video', 'src': 'projects/20261002-example/disguised.txt'}}}))

    def apply(self):
        previous = sync.validate_destination(self.source, self.dest, self.repo)
        files, skipped = sync.collect(self.source)
        sync.apply_snapshot(self.source, self.dest, self.repo, files, previous, 'Snapshot')
        return files, skipped

    def test_selection_and_independent_history(self):
        for name in ['final.mp4', 'trailer.webm', 'disguised.txt', '.env', '.env.production', 'secret.pem', 'debug.log']:
            (self.project / name).write_text('excluded')
        (self.project / 'node_modules').mkdir()
        (self.project / 'node_modules/package.json').write_text('{}')
        source_head = sync.git(self.source, 'rev-parse', 'HEAD')
        source_index = sync.git(self.source, 'ls-files', '-s')
        source_ignore = (self.source / '.gitignore').read_bytes()
        files, skipped = self.apply()
        self.assertIn('projects/20261002-example/voice.wav', files)
        self.assertTrue((self.dest / 'projects/20261002-example/image.png').exists())
        for name in ['final.mp4', 'trailer.webm', 'disguised.txt', '.env', 'secret.pem', 'debug.log']:
            self.assertFalse((self.dest / 'projects/20261002-example' / name).exists())
        self.assertGreater(skipped['video'], 0)
        self.assertTrue((self.dest / 'scripts/tool.sh').stat().st_mode & 0o111)
        self.assertEqual(source_head, sync.git(self.source, 'rev-parse', 'HEAD'))
        self.assertEqual(source_index, sync.git(self.source, 'ls-files', '-s'))
        self.assertEqual(source_ignore, (self.source / '.gitignore').read_bytes())
        private_root = sync.git(self.dest, 'rev-list', '--max-parents=0', 'HEAD')
        self.assertNotEqual(source_head, private_root)

    def test_repeat_updates_and_deletions(self):
        self.apply()
        first = sync.git(self.dest, 'rev-parse', 'HEAD')
        self.apply()
        self.assertEqual(first, sync.git(self.dest, 'rev-parse', 'HEAD'))
        (self.project / 'image.png').unlink()
        (self.project / 'VIDEO.md').write_text('Updated project\n')
        self.apply()
        self.assertFalse((self.dest / 'projects/20261002-example/image.png').exists())
        self.assertEqual('Updated project\n', (self.dest / 'projects/20261002-example/VIDEO.md').read_text())
        self.assertEqual('', sync.git(self.dest, 'status', '--porcelain'))

    def test_dirty_or_unmanaged_destination_is_rejected(self):
        self.apply()
        (self.dest / 'README.md').write_text('Local edit')
        with self.assertRaisesRegex(ValueError, 'local changes'):
            sync.validate_destination(self.source, self.dest, self.repo)

    def test_symlinks_and_path_traversal_rejected(self):
        (self.project / 'escape.png').symlink_to(self.source / 'README.md')
        with self.assertRaisesRegex(ValueError, 'Symlink'):
            sync.collect(self.source)
        with self.assertRaisesRegex(ValueError, 'Unsafe'):
            sync.safe_path(self.dest, '../outside')
        (self.project / 'escape.png').unlink()
        (self.dest / 'projects').symlink_to(self.source / 'projects')
        files, _ = sync.collect(self.source)
        with self.assertRaisesRegex(ValueError, 'Symlink'):
            sync.apply_snapshot(self.source, self.dest, self.repo, files, {}, 'Snapshot')
        self.assertEqual('Private project\n', (self.project / 'VIDEO.md').read_text())

    def test_oversized_file_fails_before_copying(self):
        with patch.object(sync, 'LIMIT', 5):
            with self.assertRaisesRegex(ValueError, '100 MiB'):
                sync.collect(self.source)
        self.assertFalse((self.dest / 'README.md').exists())

    def test_public_or_wrong_repository_rejected(self):
        for result in [{'nameWithOwner': self.repo, 'isPrivate': False},
                       {'nameWithOwner': 'example/other', 'isPrivate': True}]:
            with patch.object(sync, 'run', return_value=json.dumps(result)):
                with self.assertRaisesRegex(ValueError, 'PRIVATE'):
                    sync.verify_private(self.repo)
        with patch.object(sync, 'verify_private') as check:
            with self.assertRaisesRegex(ValueError, 'only be pushed'):
                sync.push_guard(self.dest, 'origin', sync.expected_url(self.repo))
            check.assert_not_called()
            sync.push_guard(self.dest, 'private', sync.expected_url(self.repo))
            check.assert_called_once_with(self.repo)

    def test_wrong_remote_or_nested_checkout_rejected(self):
        sync.git(self.dest, 'remote', 'set-url', 'private', 'https://github.com/example/public.git')
        with self.assertRaisesRegex(ValueError, 'URL'):
            sync.validate_destination(self.source, self.dest, self.repo)
        with self.assertRaisesRegex(ValueError, 'separate'):
            sync.validate_destination(self.source, self.source, self.repo)


if __name__ == '__main__':
    unittest.main()
