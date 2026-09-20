import hashlib, json, re, shutil, subprocess, sys
from pathlib import Path
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "criticism-library.json"
ASSETS = ROOT / "assets" / "share"
HEADERS = {"User-Agent": "Mozilla/5.0 (INDIE PORT criticism sync)"}
DRY = "--dry-run" in sys.argv

def unique(seq):
    out = []
    for x in seq:
        if x and x not in out:
            out.append(x)
    return out

def tmdb_images(tmdb_id):
    base = f"https://www.themoviedb.org/movie/{tmdb_id}/images/"
    found = {"posters": [], "backdrops": []}
    for kind in ("posters", "backdrops"):
        html = requests.get(base + kind, headers=HEADERS, timeout=25).text
        soup = BeautifulSoup(html, "html.parser")
        urls = []
        for img in soup.find_all("img"):
            for attr in ("src", "srcset"):
                raw = img.get(attr, "")
                urls += re.findall(r'https://media\.themoviedb\.org/t/p/[^\s,"]+', raw)
        found[kind] = unique(urls)
    posters = [u for u in found["posters"] if "w440_and_h660" in u]
    backs = [u for u in found["backdrops"] if "w1000_and_h563" in u]
    return unique(posters), unique(backs)

def download(url, dest, force=False):
    if not force and dest.exists() and dest.stat().st_size > 12000:
        return
    if DRY:
        return
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    dest.write_bytes(r.content)

def photo_hashes(paths):
    if not paths:
        return {}
    ps = ROOT / "scripts" / "photo_hash.ps1"
    try:
        cmd = ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(ps), *map(str, paths)]
        raw = subprocess.check_output(cmd, text=True, encoding="utf-8", errors="ignore").strip()
        data = json.loads(raw) if raw else []
        if isinstance(data, dict):
            data = [data]
        return {Path(x["path"]).name: x["hash"] for x in data}
    except Exception as e:
        print("photo hash fallback:", e)
        return {Path(p).name: hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in paths if Path(p).exists()}

def near_duplicate(a, b, threshold=24):
    if not a or not b:
        return False
    if len(a) == 256 and len(b) == 256:
        return sum(x != y for x, y in zip(a, b)) <= threshold
    return a == b

def sync_unique_photos(posters, backs, slug, target, threshold=24):
    if DRY:
        return []
    candidates = unique(posters[:1] + backs[:max(target * 4, 16)])
    temp = []
    for i, url in enumerate(candidates):
        p = ASSETS / f".crit-{slug}-candidate-{i:02d}.jpg"
        try:
            download(url, p, force=True)
            if p.exists() and p.stat().st_size > 12000:
                temp.append((url, p, bool(posters) and i == 0))
        except Exception as e:
            print("candidate download failed", url, e)
    hashes = photo_hashes([p for _, p, _ in temp])
    chosen = []
    chosen_hashes = []
    for url, p, is_poster in temp:
        h = hashes.get(p.name)
        if any(near_duplicate(h, old, threshold) for old in chosen_hashes):
            continue
        chosen.append((url, p, is_poster))
        chosen_hashes.append(h)
        if len(chosen) >= target:
            break
    finals = []
    for old in ASSETS.glob(f"crit-{slug}-still*.jpg"):
        old.unlink(missing_ok=True)
    poster_written = False
    still_no = 1
    for _, src, is_poster in chosen:
        if is_poster and not poster_written:
            dest = ASSETS / f"crit-{slug}-poster.jpg"
            poster_written = True
        else:
            dest = ASSETS / f"crit-{slug}-still{still_no}.jpg"
            still_no += 1
        shutil.copyfile(src, dest)
        finals.append("./assets/share/" + dest.name)
    for _, p, _ in temp:
        p.unlink(missing_ok=True)
    return finals

def sync_item(item, rules):
    body_len = len((item.get("body") or "").strip())
    min_chars = int(rules.get("minChars", 800))
    min_photos = int(rules.get("minPhotos", 3))
    target = max(min_photos, min(int(rules.get("targetPhotos", 5)), int(rules.get("maxPhotos", 10))))
    if body_len < min_chars or item.get("excerptOnly"):
        item["magazineEligible"] = False
        return False
    tmdb_id = item.get("tmdbId")
    if tmdb_id:
        posters, backs = tmdb_images(tmdb_id)
        slug = item.get("assetSlug") or re.sub(r"[^a-z0-9-]+", "-", item["id"].lower())
        local = sync_unique_photos(posters, backs, slug, target, int(rules.get("duplicateHashThreshold", 24)))
        if local:
            item["photos"] = local
    photos = [p for p in item.get("photos", []) if p]
    eligible = body_len >= min_chars and len(photos) >= min_photos
    item["magazineEligible"] = eligible
    print(f"{item['id']}: chars={body_len}, photos={len(photos)}, eligible={eligible}")
    return True

def main():
    lib = json.loads(DATA.read_text(encoding="utf-8"))
    rules = lib.setdefault("rules", {"minChars": 800, "minPhotos": 3, "targetPhotos": 5, "maxPhotos": 10})
    before = json.dumps(lib, ensure_ascii=False, sort_keys=True)
    for item in lib.get("items", []):
        sync_item(item, rules)
    after = json.dumps(lib, ensure_ascii=False, sort_keys=True)
    if before != after and not DRY:
        lib["version"] = int(lib.get("version", 0)) + 1
        DATA.write_text(json.dumps(lib, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("updated", DATA, "version", lib["version"])
    elif DRY:
        print("dry-run only")
    else:
        print("no data changes")

if __name__ == "__main__":
    main()
