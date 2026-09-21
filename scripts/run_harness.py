"""Run independent, bounded stages with durable last-good recovery."""
import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
import uuid
from pathlib import Path
from harness_common import ROOT, atomic_bytes, health, now, read_json, safe_error, write_json

LOCK = ROOT / '.harness.lock'
STATE = ROOT / '.harness-state.json'
REPORT = ROOT / 'reports/harness-latest.json'
JS = ['app.js', *[f'features-v{x}.js' for x in ('04', '05', '06', '07', '08', '17')], 'sw.js']


def alive(pid):
    if not isinstance(pid, int) or pid <= 0:
        return False
    if os.name == 'nt':
        import ctypes
        from ctypes import wintypes
        kernel = ctypes.WinDLL('kernel32', use_last_error=True)
        kernel.OpenProcess.restype = wintypes.HANDLE
        kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
        kernel.GetExitCodeProcess.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.DWORD)]
        kernel.CloseHandle.argtypes = [wintypes.HANDLE]
        handle = kernel.OpenProcess(0x1000, False, pid)
        if not handle:
            return ctypes.get_last_error() != 87  # unknown/access denied: fail closed
        code = wintypes.DWORD()
        try:
            return not kernel.GetExitCodeProcess(handle, ctypes.byref(code)) or code.value == 259
        finally:
            kernel.CloseHandle(handle)
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True


def acquire():
    token = uuid.uuid4().hex
    for _ in range(2):
        try:
            with LOCK.open('x', encoding='utf-8') as stream:
                json.dump(dict(pid=os.getpid(), token=token, startedAt=now()), stream)
            return token
        except FileExistsError:
            lock = read_json(LOCK)
            if not isinstance(lock, dict) or not lock.get('pid'):
                raise RuntimeError('unrecognized lock; inspect manually')
            if alive(lock['pid']) or alive(lock.get('childPid')):
                raise RuntimeError('harness already running')
            LOCK.unlink()  # only a confirmed dead owner AND child may be recovered
    raise RuntimeError('lock contention')


def snapshot():
    return {str(p.relative_to(ROOT)): p.read_text(encoding='utf-8')
            for p in (ROOT / 'data').glob('*.json') if p.name != 'api-status.json'}


def restore(files):
    for name, content in files.items():
        path = (ROOT / name).resolve()
        if path.parent != ROOT / 'data' or path.suffix != '.json':
            raise ValueError('invalid recovery path')
        atomic_bytes(path, content.encode('utf-8'))
    for path in (ROOT / 'data').glob('*.json'):
        if path.name != 'api-status.json' and str(path.relative_to(ROOT)) not in files:
            path.unlink()


def fingerprints():
    paths = list((ROOT / 'data').glob('*.json')) + list((ROOT / 'assets/share').glob('*'))
    return {str(p.relative_to(ROOT)).replace('\\', '/'): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in paths if p.is_file()}


def integrity():
    for path in (ROOT / 'data').glob('*.json'):
        read_json(path)
    live = read_json(ROOT / 'data/live.json')
    movies = read_json(ROOT / 'data/movies.json')
    weekly = read_json(ROOT / 'data/news-weekly.json')
    if live['cinema']['code'] != '000057' or not isinstance(live['days'], list):
        raise ValueError('invalid cinema schedule')
    if not isinstance(movies['movies'], dict) or not movies['movies']:
        raise ValueError('invalid movie library')
    if not isinstance(weekly['items'], list):
        raise ValueError('invalid weekly news')
    for day in live['days']:
        from datetime import date
        date.fromisoformat(day['date'])
        for session in day['sessions']:
            if not session.get('code') or not session.get('start'):
                raise ValueError('invalid session')


def validate():
    integrity()
    for args in [['node', '--check', name] for name in JS] + [['git', 'diff', '--check']]:
        subprocess.run(args, cwd=ROOT, capture_output=True, timeout=30, check=True)


def run_stage(name, timeout, token):
    before = fingerprints()
    backup = snapshot()
    write_json(STATE, dict(stage=name, files=backup))
    started = now()
    clock = time.monotonic()
    status, error, counts = 'SUCCESS', None, {}
    process = None
    try:
        if name == 'validation':
            validate()
        else:
            process = subprocess.Popen([sys.executable, str(ROOT / 'scripts' / (name + '.py'))],
                                       cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                       env={**os.environ, 'PYTHONIOENCODING': 'utf-8'})
            write_json(LOCK, dict(pid=os.getpid(), childPid=process.pid, token=token, startedAt=started))
            stdout, _ = process.communicate(timeout=timeout)
            if process.returncode:
                raise RuntimeError('stage failed')
            for line in stdout.decode('utf-8', 'replace').splitlines():
                try:
                    entry = json.loads(line)
                    if isinstance(entry, dict):
                        counts.update(entry)
                except ValueError:
                    pass
            integrity()
            if counts.get('partialFailures'):
                status = 'PARTIAL'
    except BaseException as exc:
        if process and process.poll() is None:
            process.kill()
            process.communicate()
        restore(backup)
        status = 'TIMEOUT' if isinstance(exc, subprocess.TimeoutExpired) else 'FAILED'
        error = safe_error(exc)
        providers = {'sync_dtryx': ['dtryx'], 'enrich_public_apis': ['wikimedia', 'kobis', 'kmdb', 'tmdb'],
                     'sync_news': ['googleNewsRss', 'officialSources']}.get(name, [])
        current = read_json(ROOT / 'data/api-status.json', {})
        for provider in providers:
            configured = current.get(provider, {}).get('configured', provider not in ('kobis', 'kmdb', 'tmdb'))
            health(provider, configured, False, error if configured else 'CONFIG_REQUIRED')
        if isinstance(exc, (KeyboardInterrupt, SystemExit)):
            raise
    finally:
        STATE.unlink(missing_ok=True)
        write_json(LOCK, dict(pid=os.getpid(), token=token, startedAt=started))
    after = fingerprints()
    return dict(stage=name, startedAt=started, finishedAt=now(), duration=round(time.monotonic()-clock, 3),
                status=status, changedFiles=sorted(k for k in before.keys() | after.keys() if before.get(k) != after.get(k)),
                errorSummary=error, counts=counts)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    for flag in ('data-only', 'news-only', 'validate-only'):
        group.add_argument('--' + flag, action='store_true')
    parser.add_argument('--skip-images', action='store_true')
    args = parser.parse_args()
    token = acquire()
    report = dict(startedAt=now(), stages=[])
    try:
        if STATE.exists():
            restore(read_json(STATE)['files'])
            STATE.unlink()
            report['recoveredInterruptedStage'] = True
        integrity()
        stages = []
        if not args.validate_only:
            if not args.news_only:
                stages += [('sync_dtryx', 300), ('enrich_public_apis', 360)]
                if not args.skip_images:
                    stages += [('cache_share_assets', 240)]
            if not args.data_only:
                stages += [('sync_news', 300), ('build_news_weekly', 30)]
        stages += [('validation', 120)]
        for name, timeout in stages:
            if name == 'build_news_weekly' and report['stages'][-1]['status'] in ('FAILED', 'TIMEOUT'):
                stamp = now()
                entry = dict(stage=name, startedAt=stamp, finishedAt=stamp, duration=0, status='SKIPPED',
                             changedFiles=[], errorSummary='fresh news unavailable', counts={})
            else:
                entry = run_stage(name, timeout, token)
            report['stages'].append(entry)
            write_json(REPORT, report)
            print(json.dumps(entry, ensure_ascii=True), flush=True)
        failed = report['stages'][-1]['status'] != 'SUCCESS'
        report['status'] = 'FAILED' if failed else ('DEGRADED' if any(x['status'] != 'SUCCESS' for x in report['stages']) else 'SUCCESS')
        report['finishedAt'] = now()
        write_json(REPORT, report)
        return int(failed)
    except Exception as exc:
        report.update(status='FAILED', finishedAt=now(), errorSummary=safe_error(exc))
        write_json(REPORT, report)
        return 1
    finally:
        if read_json(LOCK, {}).get('token') == token:
            LOCK.unlink()


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as exc:
        print('Harness stopped: ' + safe_error(exc), file=sys.stderr)
        sys.exit(1)
