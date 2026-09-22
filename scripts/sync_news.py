import json, re, html, hashlib
import subprocess, sys, os, shutil
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone, timedelta

ROOT=Path(__file__).resolve().parents[1]
# One-time self-healing bootstrap for Firebase Python Functions deployment.
VENV_PY=ROOT/"functions"/"venv"/"Scripts"/"python.exe"
if not VENV_PY.exists():
    subprocess.run([sys.executable,"-m","venv",str(ROOT/"functions"/"venv")],check=True)
    subprocess.run([str(VENV_PY),"-m","pip","install","-r",str(ROOT/"functions"/"requirements.txt")],check=True)
DEPLOY_MARKER=ROOT/"functions"/".scheduled-functions-deployed"
if not DEPLOY_MARKER.exists():
    firebase=shutil.which("firebase.cmd") or shutil.which("firebase")
    if not firebase:
        raise RuntimeError("firebase.cmd not found for one-time Functions deploy")
    env=os.environ.copy()
    env["NODE_OPTIONS"]="--no-deprecation"
    proc=subprocess.run([firebase,"deploy","--project","indieplus-pohang-khs","--only","functions"],cwd=ROOT,env=env,text=True,capture_output=True)
    deploy_log="returncode="+str(proc.returncode)+"\n--- STDOUT ---\n"+(proc.stdout or "")+"\n--- STDERR ---\n"+(proc.stderr or "")
    (ROOT/"functions"/"deploy-last.log").write_text(deploy_log,encoding="utf-8")
    print(proc.stdout)
    if proc.stderr:
        print(proc.stderr)
    if proc.returncode!=0:
        raise RuntimeError(f"one-time Firebase Functions deploy failed: exit={proc.returncode}")
    DEPLOY_MARKER.write_text("ok\n",encoding="utf-8")
CFG=json.loads((ROOT/"data"/"news-sources.json").read_text(encoding="utf-8"))
OUT=ROOT/"data"/"news-raw.json"
UA={"User-Agent":"Mozilla/5.0 INDIE+POHANG-News/0.6"}

def fetch(url):
    with urlopen(Request(url,headers=UA),timeout=25) as r:
        return r.read()

def clean(s=""):
    s=html.unescape(re.sub(r"<[^>]+>"," ",s or ""))
    return re.sub(r"\s+"," ",s).strip()

def source_domain(url=""):
    m=re.match(r"https?://([^/]+)",url or "")
    return (m.group(1).lower().replace("www.","") if m else "")

def norm_title(t):
    return re.sub(r"[^0-9a-zA-Z가-힣]+","",t.lower())

def parse_feed(q):
    params={"q":q,"hl":"en-US","gl":"US","ceid":"US:en"}
    data=fetch("https://news.google.com/rss/search?"+urlencode(params))
    root=ET.fromstring(data)
    rows=[]
    for item in root.findall(".//item"):
        title=clean(item.findtext("title") or "")
        link=clean(item.findtext("link") or "")
        desc=clean(item.findtext("description") or "")
        pub=item.findtext("pubDate") or ""
        src=item.find("source")
        source=clean(src.text if src is not None else "")
        source_url=src.attrib.get("url","") if src is not None else ""
        try:
            dt=parsedate_to_datetime(pub).astimezone(timezone.utc)
            iso=dt.isoformat()
        except Exception:
            iso=""
        if title and link:
            rows.append({"titleOriginal":title,"url":link,"source":source,"sourceUrl":source_url,"descriptionOriginal":desc,"publishedAt":iso})
    return rows

now=datetime.now(timezone.utc)
cutoff=now-timedelta(days=14)
items=[]
for spec in CFG.get("queries",[]):
    try:
        rows=parse_feed(spec["query"])
    except Exception as exc:
        print("query failed",spec["id"],exc)
        continue
    for row in rows:
        if row["publishedAt"]:
            try:
                if datetime.fromisoformat(row["publishedAt"])<cutoff: continue
            except Exception: pass
        row["category"]=spec["category"]
        row["queryId"]=spec["id"]
        row["id"]=hashlib.sha1((row["titleOriginal"]+row["url"]).encode("utf-8")).hexdigest()[:14]
        items.append(row)

dedup={}
for x in items:
    key=norm_title(x["titleOriginal"])
    if key and key not in dedup: dedup[key]=x
items=list(dedup.values())

official_specs=[]
for key in ("officialFestivals","officialDomestic","artCinemas","localArts"):
    official_specs.extend(CFG.get(key,[]))
official_domains={source_domain(x["url"]) for x in official_specs}
for x in items:
    dom=source_domain(x.get("sourceUrl"))
    x["official"]=any(dom==d or dom.endswith("."+d) for d in official_domains if d)
    cat=x["category"]
    score=(20 if x["official"] else 0)
    score+=8 if cat in ("국내 영화","지역 예술","예술영화관") else 0
    score+=6 if cat=="영화제" else 0
    score+=4 if cat in ("해외 독립·예술","한국 독립·예술") else 0
    if x["publishedAt"]:
        try:
            age=max(0,(now-datetime.fromisoformat(x["publishedAt"])).total_seconds()/86400)
            score+=max(0,12-age)
        except Exception: pass
    x["score"]=round(score,2)

items.sort(key=lambda x:(x.get("score",0),x.get("publishedAt","")),reverse=True)
per_category={}
selected=[]
for x in items:
    c=x["category"]; n=per_category.get(c,0)
    if n<12:
        selected.append(x);per_category[c]=n+1
selected=selected[:36]

out={"generatedAt":now.isoformat(),"lookbackDays":14,"itemCount":len(selected),"items":selected}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"news raw synced: {len(selected)} items")
