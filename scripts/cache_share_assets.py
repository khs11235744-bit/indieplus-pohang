import json
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
MOVIES=json.loads((ROOT/"data"/"movies.json").read_text(encoding="utf-8")).get("movies",{})
OUT=ROOT/"assets"/"share"
OUT.mkdir(parents=True,exist_ok=True)
UA={"User-Agent":"Mozilla/5.0 INDIE+POHANG/0.5"}

def fetch(url,path):
    if not url:return False
    with urlopen(Request(url,headers=UA),timeout=30) as r:
        path.write_bytes(r.read())
    return True

def save_asset(code,label,url):
    if not url:return None
    ext=".png" if ".png" in url.lower() else ".jpg"
    path=OUT/f"{code}-{label}{ext}"
    try:
        fetch(url,path)
        return f"./assets/share/{path.name}"
    except Exception as exc:
        print(f"{code} {label} skipped: {exc}")
        return None

manifest={}
for code,m in MOVIES.items():
    entry={}
    poster=save_asset(code,"poster",m.get("poster") or "")
    if poster:entry["poster"]=poster
    stills=[]
    sources=m.get("stills") or ([m.get("still")] if m.get("still") else [])
    for i,url in enumerate(sources[:4],1):
        local=save_asset(code,f"still{i}",url)
        if local:stills.append(local)
    if stills:
        entry["stills"]=stills
        entry["still"]=stills[0]
    manifest[code]=entry

(ROOT/"data"/"share-assets.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"cached share assets for {len(manifest)} movies / {sum(len(v.get('stills',[])) for v in manifest.values())} stills")
