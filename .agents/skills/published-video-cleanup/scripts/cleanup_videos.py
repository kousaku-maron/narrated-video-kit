#!/usr/bin/env python3
"""Plan and delete one published project's videos, preserving all other files."""

import argparse
from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import parse_qs, urlparse

VIDEO_EXTENSIONS = {'.mp4', '.webm', '.mov', '.mkv', '.avi', '.m4v', '.mpg',
                    '.mpeg', '.wmv', '.flv', '.ogv', '.mts', '.m2ts', '.3gp'}
JST = timezone(timedelta(hours=9))
PRESERVED_EXTENSIONS = {'.md', '.json', '.txt', '.html', '.htm', '.py', '.js',
                        '.jsx', '.ts', '.tsx', '.sh', '.svg', '.png', '.jpg',
                        '.jpeg', '.webp', '.gif', '.bmp', '.wav', '.aiff',
                        '.mp3', '.m4a', '.aac', '.ogg', '.flac', '.srt', '.vtt'}


def save_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.tmp')
    if temporary.is_symlink():
        raise ValueError(f'Symlink is not supported: {temporary}')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n',
                         encoding='utf-8')
    temporary.replace(path)


def checked_path(root, relative):
    path = root / relative
    if path.is_absolute() and not path.is_relative_to(root):
        raise ValueError(f'Path outside repository: {relative}')
    if '..' in path.parts:
        raise ValueError(f'Parent traversal is not supported: {relative}')
    for part in [path, *path.parents]:
        if part == root:
            break
        if part.is_symlink():
            raise ValueError(f'Symlink is not supported: {part}')
    if not path.resolve().is_relative_to(root):
        raise ValueError(f'Path outside repository: {relative}')
    return path


def inventory(root, slug):
    project = checked_path(root, f'projects/{slug}')
    manifest = json.loads(checked_path(root, f'projects/{slug}/project.json')
                          .read_text(encoding='utf-8'))
    declared = set()
    prefix = f'projects/{slug}/assets/'
    for asset in manifest.get('assets', {}).values():
        if asset.get('kind') == 'video':
            src = asset.get('src', '')
            if not src.startswith(prefix):
                raise ValueError(f'Video asset outside project assets: {src}')
            if Path(src).suffix.lower() in PRESERVED_EXTENSIONS:
                raise ValueError(f'Video asset has a preserved non-video extension: {src}')
            declared.add(checked_path(root, src))
            declared.add(checked_path(root, 'remotion/public/' + src))
    directories = [project, checked_path(root, f'remotion/out/{slug}'),
                   checked_path(root, f'remotion/public/projects/{slug}')]
    result = []
    for directory in directories:
        if not directory.exists():
            continue
        def fail_walk(error):
            raise error

        for current, dirs, files in os.walk(directory, followlinks=False, onerror=fail_walk):
            # Fail instead of silently skipping potential external targets.
            for name in dirs + files:
                checked_path(root, str((Path(current) / name).relative_to(root)))
            for name in files:
                path = Path(current) / name
                if path.suffix.lower() not in VIDEO_EXTENSIONS and path not in declared:
                    continue
                stat = path.stat()
                result.append({'path': str(path.relative_to(root)),
                               'bytes': stat.st_size, 'mtime_ns': stat.st_mtime_ns,
                               'device': stat.st_dev, 'inode': stat.st_ino})
    return sorted(result, key=lambda item: item['path'])


def valid_youtube_url(value):
    parsed = urlparse(value)
    if parsed.scheme != 'https':
        return False
    if parsed.hostname == 'youtu.be':
        video_id = parsed.path.strip('/')
    elif parsed.hostname in {'youtube.com', 'www.youtube.com', 'm.youtube.com'}:
        if parsed.path == '/watch':
            video_id = parse_qs(parsed.query).get('v', [''])[0]
        elif parsed.path.startswith(('/shorts/', '/live/')):
            video_id = parsed.path.rstrip('/').split('/')[-1]
        else:
            return False
    else:
        return False
    return bool(re.fullmatch(r'[A-Za-z0-9_-]{11}', video_id))


def load_verification(path, plan):
    if path is None:
        raise ValueError('Verify the YouTube video and provide --verification before deletion')
    verification = json.loads(path.read_text(encoding='utf-8'))
    if (verification.get('project') != plan['project']
            or verification.get('youtube_url') != plan['youtube_url']
            or verification.get('exists') is not True
            or verification.get('matches_project') is not True):
        raise ValueError('Verification must confirm this project and its published video URL')
    for field in ['title', 'channel', 'method', 'evidence']:
        if not isinstance(verification.get(field), str) or not verification[field].strip():
            raise ValueError(f'Verification needs observed {field}')
    checked_at = datetime.fromisoformat(verification.get('checked_at', ''))
    created_at = datetime.fromisoformat(plan.get('created_at', ''))
    if checked_at.tzinfo is None or created_at.tzinfo is None:
        raise ValueError('Verification and plan timestamps must include timezone offsets')
    if checked_at < created_at or checked_at > datetime.now(JST):
        raise ValueError('Verification must be observed after this plan, not reused or future-dated')
    return verification


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo-root', type=Path, default=Path(__file__).resolve().parents[4])
    parser.add_argument('--project', required=True)
    parser.add_argument('--youtube-url', default='')
    parser.add_argument('--plan-out', type=Path)
    parser.add_argument('--apply', type=Path, help='Apply a previously reviewed plan JSON')
    parser.add_argument('--verification', type=Path, help='Observed YouTube existence and project match record')
    args = parser.parse_args()
    if not re.fullmatch(r'\d{8}-[a-z0-9][a-z0-9-]*', args.project):
        raise ValueError('Project must be YYYYMMDD-name')
    if args.project.startswith('00000000-'):
        raise ValueError('Demo projects cannot be cleaned')
    datetime.strptime(args.project[:8], '%Y%m%d')
    root = args.repo_root.resolve()
    if not (root / 'AGENTS.md').is_file() or not (root / 'remotion').is_dir():
        raise ValueError('Not a narrated-video-kit repository')
    files = inventory(root, args.project)
    if not args.apply:
        if args.verification:
            raise ValueError('--verification is only used with --apply')
        if args.youtube_url and not valid_youtube_url(args.youtube_url):
            raise ValueError('Pass a YouTube video URL (watch, shorts, live or youtu.be)')
        plan = {'version': 2, 'created_at': datetime.now(JST).isoformat(),
                'project': args.project, 'repo_root': str(root),
                'youtube_url': args.youtube_url, 'files': files,
                'total_bytes': sum(item['bytes'] for item in files)}
        if args.plan_out:
            plan_path = args.plan_out.absolute()
            # Plans must not overwrite preserved project files or code.
            if plan_path.resolve().is_relative_to(root):
                raise ValueError('Save the temporary plan outside the repository')
            if plan_path.exists() or plan_path.is_symlink():
                raise ValueError('Plan output already exists; use a fresh filename')
            save_json(plan_path, plan)
        print(json.dumps(plan, ensure_ascii=False, indent=2))
        return
    if args.plan_out or args.youtube_url:
        raise ValueError('--apply cannot be combined with planning options')
    plan = json.loads(args.apply.read_text(encoding='utf-8'))
    if (plan.get('version') != 2 or plan.get('project') != args.project
            or plan.get('repo_root') != str(root) or plan.get('files') != files):
        raise ValueError('Plan does not match current targets; inspect a fresh plan')
    url = plan.get('youtube_url', '')
    if not valid_youtube_url(url):
        raise ValueError('Plan needs the published YouTube video URL')
    project = checked_path(root, f'projects/{args.project}')
    for relative in ['VIDEO.md', 'SCRIPT.md', 'assets/SOURCES.md']:
        checked_path(root, str((project / relative).relative_to(root))).read_text(encoding='utf-8')
    if url not in (project / 'VIDEO.md').read_text(encoding='utf-8'):
        raise ValueError('Record the published URL in VIDEO.md before deletion')
    if not files:
        print(json.dumps({'status': 'already-clean', 'deleted_files': 0, 'deleted_bytes': 0}))
        return
    verification = load_verification(args.verification, plan)
    history_path = checked_path(root, f'projects/{args.project}/notes/video-cleanup-history.json')
    history = json.loads(history_path.read_text(encoding='utf-8')) if history_path.exists() else []
    if not isinstance(history, list):
        raise ValueError('Cleanup history must be a JSON list')
    run = {'started_at': datetime.now(JST).isoformat(), 'youtube_url': url,
           'verification': verification,
           'status': 'in-progress', 'planned_files': files, 'deleted_files': [],
           'deleted_bytes': 0}
    history.append(run)
    save_json(history_path, history)
    try:
        for item in files:
            path = checked_path(root, item['path'])
            stat = path.stat()
            if (stat.st_size, stat.st_mtime_ns, stat.st_dev, stat.st_ino) != (
                    item['bytes'], item['mtime_ns'], item['device'], item['inode']):
                raise ValueError(f'File changed during cleanup: {item["path"]}')
            path.unlink()
            run['deleted_files'].append(item['path'])
            run['deleted_bytes'] += item['bytes']
            save_json(history_path, history)
        run['status'] = 'completed'
    except BaseException as error:
        run['status'] = 'partial'
        run['error'] = str(error) or type(error).__name__
        raise
    finally:
        run['finished_at'] = datetime.now(JST).isoformat()
        save_json(history_path, history)
    print(json.dumps({'status': run['status'], 'deleted_files': len(run['deleted_files']),
                      'deleted_bytes': run['deleted_bytes'], 'history': str(history_path)},
                     ensure_ascii=False, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError, TypeError) as error:
        print(f'Error: {error}', file=sys.stderr)
        sys.exit(1)
