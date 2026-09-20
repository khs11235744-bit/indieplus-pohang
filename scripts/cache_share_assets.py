import json
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
MOVIES=json.loads((ROOT/"data"/"movies.json").read_text(encoding="utf-8")).get("movies",{})
OUT=ROOT/"assets"/"share"
OUT.mkdir(parents=True,exist_ok=True)
UA={"User-Agent":"Mozilla/5.0 INDIE+POHANG/0.3"}

def fetch(url,path):
    if not url:return False
    with urlopen(Request(url,headers=UA),timeout=30) as r:
        path.write_bytes(r.read())
    return True

manifest={}
for code,m in MOVIES.items():
    entry={}
    for kind,key in (("still","still"),("poster","poster")):
        url=m.get(key) or ""
        if not url:continue
        ext=".png" if ".png" in url.lower() else ".jpg"
        path=OUT/f"{code}-{kind}{ext}"
        try:
            fetch(url,path)
            entry[kind]=f"./assets/share/{path.name}"
        except Exception as exc:
            print(f"{code} {kind} skipped: {exc}")
    manifest[code]=entry

(ROOT/"data"/"share-assets.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"cached share assets for {len(manifest)} movies")
