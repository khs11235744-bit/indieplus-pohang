import json, re
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode

CINEMA="000057"
BRAND="indieart"
CGID="FE8EF4D2-F22D-4802-A39A-D58F23A29C1E"
BASE="https://www.dtryx.com"
MAIN=f"{BASE}/cinema/main.do?cgid={CGID}&BrandCd={BRAND}&CinemaCd={CINEMA}"
HEADERS={"User-Agent":"Mozilla/5.0 IndiePohangScheduleSync/0.2"}

def get(url):
    with urlopen(Request(url,headers=HEADERS),timeout=20) as r:
        return r.read().decode("utf-8","replace")

html=get(MAIN)
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
            "code":s.get("MovieCd",""),
            "title":s.get("MovieNmNat") or s.get("MovieNm",""),
            "start":s.get("StartTime",""),
            "end":s.get("EndTime",""),
            "minutes":int(s.get("RunningTime") or 0),
            "age":(s.get("RatingNm") or "").replace("이상관람가","").replace("전체관람가","전체"),
            "availableSeats":int(s.get("RemainSeatCnt") or 0),
            "showSeq":int(s.get("ShowSeq") or 1),
            "bookable":str(s.get("NextSkipYn") or "").upper()=="Y"
        })
    sessions.sort(key=lambda x:x["start"])
    days.append({"date":date,"sessions":sessions})

kst=timezone(timedelta(hours=9))
out={"updated":datetime.now(kst).strftime("%Y-%m-%d %H:%M KST"),"source":"Dtryx 인디플러스 포항 공개 편성","cinema":{"name":"인디플러스 포항","code":CINEMA},"days":days}
target=Path(__file__).resolve().parents[1]/"data"/"live.json"
target.parent.mkdir(parents=True,exist_ok=True)
target.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"synced {len(days)} days / {sum(len(d['sessions']) for d in days)} sessions")
