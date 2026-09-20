import json, re
from pathlib import Path
from datetime import datetime, timezone

ROOT=Path(__file__).resolve().parents[1]
RAW=ROOT/"data"/"news-raw.json"
OUT=ROOT/"data"/"news-weekly.json"

raw=json.loads(RAW.read_text(encoding="utf-8"))
previous={}
if OUT.exists():
    try:
        old=json.loads(OUT.read_text(encoding="utf-8"))
        previous={x["id"]:x for x in old.get("items",[]) if x.get("id")}
    except Exception:
        pass

def good(x):
    t=(x.get("titleOriginal") or "").strip()
    if not t or "undefined" in t.lower(): return False
    if re.match(r"^\d{1,2}-\d{1,2}\s+[A-Za-z]+,?\s+\d{4}",t): return False
    if "Films + Events" in t: return False
    if re.fullmatch(r"[\d\s,./-]+(?:-[^-]+)?",t): return False
    core=re.sub(r"\s+-\s+[^-]+$","",t).strip()
    if len(core)<18: return False
    return True

items=[x for x in raw.get("items",[]) if good(x)]
items.sort(key=lambda x:(x.get("official",False),x.get("score",0),x.get("publishedAt","")),reverse=True)

limits={"영화제":6,"해외 독립·예술":5,"아시아":3,"국내 영화":6,"한국 독립·예술":5,"예술영화관":5,"지역 예술":6}
counts={}
selected=[]
for x in items:
    c=x.get("category","기타")
    if counts.get(c,0)>=limits.get(c,3): continue
    counts[c]=counts.get(c,0)+1
    prev=previous.get(x["id"],{})
    core=re.sub(r"\s+-\s+[^-]+$","",x.get("titleOriginal","")).strip()
    selected.append({
        "id":x["id"],
        "category":c,
        "source":x.get("source",""),
        "official":bool(x.get("official")),
        "publishedAt":x.get("publishedAt",""),
        "url":x.get("url",""),
        "sourceUrl":x.get("sourceUrl",""),
        "titleOriginal":core,
        "titleKo":prev.get("titleKo",""),
        "summaryKo":prev.get("summaryKo",""),
        "whyItMatters":prev.get("whyItMatters",""),
        "keyPoints":prev.get("keyPoints",[]),
        "tags":prev.get("tags",[]),
        "translationStatus":prev.get("translationStatus","pending")
    })
    if len(selected)>=32: break

now=datetime.now(timezone.utc).isoformat()
out={
    "generatedAt":now,
    "periodLabel":"최근 2주 / 주간 편집본",
    "translationPolicy":"원문 전문을 복제하지 않고 제목·핵심 내용만 한국어로 번역·요약",
    "digestTitle":"이번 주 세계 독립·예술영화 뉴스",
    "digestSummary":"",
    "items":selected
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"weekly news prepared: {len(selected)} items / translated cache {sum(1 for x in selected if x['titleKo'])}")
