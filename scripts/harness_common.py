"""Small shared I/O primitives; credentials never enter diagnostics."""
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
UA = 'IndiePohangHarness/1.0 (non-commercial cinema discovery; public metadata)'


def now():
    return datetime.now(timezone.utc).isoformat()


def read_json(path, default=None):
    return json.loads(path.read_text(encoding='utf-8')) if path.exists() else default


def atomic_bytes(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + '.tmp')
    try:
        temp.write_bytes(content)
        os.replace(temp, path)
    finally:
        temp.unlink(missing_ok=True)


def write_json(path, data):
    atomic_bytes(path, (json.dumps(data, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))


def safe_error(exc):
    # Exception messages can contain credential-bearing request URLs or payloads.
    return f'HTTP {exc.code}' if isinstance(exc, HTTPError) else type(exc).__name__


def fetch(url, headers=None, timeout=12, retries=1, limit=8_000_000):
    for attempt in range(retries + 1):
        try:
            with urlopen(Request(url, headers={'User-Agent': UA, **(headers or {})}), timeout=timeout) as response:
                data = response.read(limit + 1)
                if len(data) > limit:
                    raise ValueError('response too large')
                return data
        except Exception as exc:
            if attempt == retries or (isinstance(exc, HTTPError) and exc.code not in (429, 500, 502, 503, 504)):
                raise
            time.sleep(0.5 * (attempt + 1))


def get_json(url, headers=None):
    return json.loads(fetch(url, headers).decode('utf-8'))


def health(provider, configured, healthy, error=None, **counts):
    path = ROOT / 'data/api-status.json'
    status = read_json(path, {})
    status[provider] = dict(configured=bool(configured), healthy=bool(healthy),
                            lastCheck=now(), lastError=error, **counts)
    write_json(path, status)


def result(**counts):
    print(json.dumps(counts, ensure_ascii=True))
