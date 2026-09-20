import json, re
import html as html_lib
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode

CINEMA="000057"
BRAND="indieart"
CGID="FE8EF4D2-F22D-4802-A39A-D58F23A29C1E"
BASE="https://www.dtryx.com"
MAIN=f"{BASE}/cinema/main.do?cgid={CGID}&BrandCd={BRAND}&CinemaCd={CINEMA}"
HEADERS={"User-Agent":"Mozilla/5.0 IndiePohangScheduleSync/0.3"}
ROOT=Path(__file__).resolve().parents[1]
KST=timezone(timedelta(hours=9))

def get(url):
    with urlopen(Request(url,headers=HEADERS),timeout=20) as r:
        return r.read().decode("utf-8","replace")

def clean(raw=""):
    raw=re.sub(r"<br\s*/?>"," ",raw,flags=re.I)
    raw=re.sub(r"<[^>]+>"," ",raw)
    return re.sub(r"\s+"," ",html_lib.unescape(raw)).strip()

def pick(pattern,text):
    m=re.search(pattern,text,re.S|re.I)
    return clean(m.group(1)) if m else ""
def shorten(text,limit=92):
    if len(text)<=limit:
        return text
    for mark in (". ","? ","! ","… "):
        pos=text.find(mark,42,limit+25)
        if pos!=-1:
            return text[:pos+1].strip()
    return text[:limit].rstrip()+"…"

def unique(seq):
    return list(dict.fromkeys(x for x in seq if x))

def movie_detail(code):
    page=get(f"{BASE}/movie/view.do?MovieCd={code}")
    title=pick(r'<h3 class="h3">(.*?)</h3>',page)
    eng=pick(r'<h4 class="h4">(.*?)</h4>',page)
    poster=(re.search(r'<div class="poster">.*?<img src="([^"]+)"',page,re.S|re.I) or [None,""])[1]
    synopsis=pick(r'<div class="tit">줄거리</div>\s*<div class="txt">(.*?)</div>',page)
    director=pick(r'<dt>감독</dt>\s*<dd>(.*?)</dd>',page)
    actors=pick(r'<dt>배우</dt>\s*<dd>(.*?)</dd>',page)
    info=re.search(r'<h4 class="h4">.*?</h4>\s*<div class="etc">(.*?)</div>',page,re.S|re.I)
    meta=[clean(x) for x in re.findall(r'<span>(.*?)</span>',info.group(1),re.S|re.I)] if info else []
    trailer=(re.search(r'data-source="([^"]+\.mp4)"',page,re.I) or [None,""])[1]
    stills=unique(re.findall(r'https://img\.dtryx\.com/poster/[^"\']+\.Large\.(?:jpg|png|jpeg)',page,re.I))
    return {"code":code,"title":title,"eng":eng,"director":director,"actors":actors,
            "short":shorten(synopsis),"synopsis":synopsis,"poster":poster,"still":stills[0] if stills else "",
            "trailer":trailer,"meta":meta,"sourceUrl":f"{BASE}/movie/view.do?MovieCd={code}"}
html=get(MAIN)
playing=html.split('<!-- // 현재상영작 top 10 -->',1)[0]
movie_codes=unique(re.findall(r'MovieCd=(\d{6})',playing))
movies={}
for code in movie_codes:
    try:
        movies[code]=movie_detail(code)
    except Exception as exc:
        print(f"movie detail skipped {code}: {exc}")

enabled=[]
for cls,date in re.findall(r'<a href="#" class="btnDay([^"]*)" data-dt="(\d{4}-\d{2}-\d{2})">',html):
    if "disabled" not in cls:
        enabled.append(date)
dates=sorted(dict.fromkeys(enabled))
days=[]
for date in dates:
    q=urlencode({"BrandCd":BRAND,"CinemaCd":CINEMA,"PlaySDT":date,"cgid":CGID})
    body=json.loads(get(f"{BASE}/cinema/showseq_list.do?{q}"))
    sessions=[]
    for s in body.get("Showseqlist",[]):
        sessions.append({
            "code":s.get("MovieCd",""),"title":s.get("MovieNmNat") or s.get("MovieNm",""),
            "start":s.get("StartTime",""),"end":s.get("EndTime",""),
            "minutes":int(s.get("RunningTime") or 0),
            "age":(s.get("RatingNm") or "").replace("이상관람가","").replace("전체관람가","전체"),
            "availableSeats":int(s.get("RemainSeatCnt") or 0),"showSeq":int(s.get("ShowSeq") or 1),
            "screenCode":s.get("ScreenCd") or "01","screenName":s.get("ScreenNm") or "",
            "bookable":str(s.get("NextSkipYn") or "").upper()=="Y"
        })
    sessions.sort(key=lambda x:x["start"])
    days.append({"date":date,"sessions":sessions})

now=datetime.now(KST).strftime("%Y-%m-%d %H:%M KST")
live={"updated":now,"source":"Dtryx 인디플러스 포항 공개 편성",
      "cinema":{"name":"인디플러스 포항","code":CINEMA},"days":days}
movie_out={"updated":now,"source":"Dtryx 공개 영화 상세 페이지","movies":movies}
program_hits=[k for k in ("GV","기획전") if k in html]
program_note=("공개 극장 메인 페이지에 "+", ".join(program_hits)+" 표기가 있습니다. 공식 극장 소식에서 상세를 확인하세요.") if program_hits else "공개 극장 메인 페이지 기준 별도 GV/기획전 표기를 확인하지 못했습니다."
program_out={"updated":now,"source":"Dtryx 인디플러스 포항 극장 메인 페이지",
             "items":[],"note":program_note}

(ROOT/"data").mkdir(parents=True,exist_ok=True)
(ROOT/"data"/"live.json").write_text(json.dumps(live,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(ROOT/"data"/"movies.json").write_text(json.dumps(movie_out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(ROOT/"data"/"programs.json").write_text(json.dumps(program_out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"synced {len(days)} days / {sum(len(d['sessions']) for d in days)} sessions / {len(movies)} movies")
