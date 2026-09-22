from __future__ import annotations
import json
import pathlib
import urllib.request
import urllib.error

PROJECT = "indieplus-pohang-khs"
ROOT = pathlib.Path(__file__).resolve().parents[1]
CONFIG = pathlib.Path.home() / ".config" / "configstore" / "firebase-tools.json"

DOCS = {
    "live": ROOT / "data" / "live.json",
    "movies": ROOT / "data" / "movies.json",
    "programs": ROOT / "data" / "programs.json",
    "newsWeekly": ROOT / "data" / "news-weekly.json",
    "editorial": ROOT / "data" / "editorial.json",
    "apiStatus": ROOT / "data" / "api-status.json",
}

def fv(v):
    if v is None:
        return {"nullValue": None}
    if isinstance(v, bool):
        return {"booleanValue": v}
    if isinstance(v, int):
        return {"integerValue": str(v)}
    if isinstance(v, float):
        return {"doubleValue": v}
    if isinstance(v, str):
        return {"stringValue": v}
    if isinstance(v, list):
        return {"arrayValue": {"values": [fv(x) for x in v]}}
    if isinstance(v, dict):
        return {"mapValue": {"fields": {str(k): fv(val) for k, val in v.items()}}}
    return {"stringValue": str(v)}

def fields(obj):
    return {str(k): fv(v) for k, v in obj.items()}

def main():
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    token = ((cfg.get("tokens") or {}).get("access_token") or "").strip()
    if not token:
        raise SystemExit("firebase-tools access token missing; run firebase login first")

    for doc_id, path in DOCS.items():
        if not path.exists():
            print(f"SKIP {doc_id}: {path.name} missing")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        body = json.dumps({"fields": fields(data)}, ensure_ascii=False).encode("utf-8")
        url = (
            f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/(default)"
            f"/documents/public/{doc_id}"
        )
        req = urllib.request.Request(
            url,
            data=body,
            method="PATCH",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json; charset=utf-8",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                payload = json.loads(res.read().decode("utf-8"))
                print(f"OK {doc_id}: {payload.get('name','')}")
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", errors="replace")
            print(f"ERROR {doc_id}: HTTP {e.code} {detail[:1000]}")
            raise

if __name__ == "__main__":
    main()
