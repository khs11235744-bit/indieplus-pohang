import json, os
from pathlib import Path
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
MOVIES_PATH=ROOT/'data'/'movies.json'
STATUS_PATH=ROOT/'data'/'api-status.json'
UA='INDIE+POHANG/0.3 (non-commercial cinema discovery app)'
def get_json(url, headers=None, timeout=15):
    h={'User-Agent':UA,'Accept':'application/json'}
    if headers:h.update(headers)
    with urlopen(Request(url,headers=h),timeout=timeout) as r:
        return json.loads(r.read().decode('utf-8','replace'))

def set_if_blank(obj,key,value,source):
    if value and not obj.get(key):
        obj[key]=value
        obj.setdefault('enrichedBy',{})[key]=source

pack=json.loads(MOVIES_PATH.read_text(encoding='utf-8'))
movies=pack.get('movies',{})
status={}
kobis=os.getenv('KOBIS_KEY','').strip()
kmdb=os.getenv('KMDB_KEY','').strip()
tmdb=os.getenv('TMDB_TOKEN','').strip() or os.getenv('TMDB_KEY','').strip()
status['kobis']={'configured':bool(kobis)}
status['kmdb']={'configured':bool(kmdb)}
status['tmdb']={'configured':bool(tmdb)}
status['wikimedia']={'configured':True}
def wikimedia_person(name):
    if not name:return None
    try:
        search=get_json("https://ko.wikipedia.org/w/api.php?"+urlencode({
            "action":"query","list":"search","srsearch":name+" 영화 감독","format":"json","utf8":1
        }))
        hits=search.get("query",{}).get("search",[])
        if not hits:return None
        title=hits[0].get("title","")
        summary=get_json("https://ko.wikipedia.org/api/rest_v1/page/summary/"+quote(title))
        return {
            "title":summary.get("title",title),
            "description":summary.get("description",""),
            "extract":summary.get("extract",""),
            "url":summary.get("content_urls",{}).get("desktop",{}).get("page","")
        }
    except Exception as exc:
        return {"error":str(exc)}

def kobis_movie(title):
    if not kobis:return None
    try:
        q=urlencode({"key":kobis,"movieNm":title,"itemPerPage":20})
        data=get_json("https://kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieList.json?"+q)
        rows=data.get("movieListResult",{}).get("movieList",[])
        exact=[x for x in rows if x.get("movieNm")==title]
        row=(exact or rows or [None])[0]
        if not row:return None
        code=row.get("movieCd")
        detail=None
        if code:
            detail=get_json("https://kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?"+urlencode({"key":kobis,"movieCd":code})).get("movieInfoResult",{}).get("movieInfo")
        return {"search":row,"detail":detail}
    except Exception as exc:
        return {"error":str(exc)}

def kmdb_movie(title):
    if not kmdb:return None
    try:
        q=urlencode({"collection":"kmdb_new2","detail":"Y","title":title,"ServiceKey":kmdb})
        return get_json("https://api.koreafilm.or.kr/openapi-data2/wisenut/search_api/search_json2.jsp?"+q)
    except Exception as exc:
        return {"error":str(exc)}

def tmdb_movie(title):
    if not tmdb:return None
    try:
        headers={}
        params={"query":title,"language":"ko-KR","include_adult":"false"}
        if len(tmdb)>60: headers["Authorization"]="Bearer "+tmdb
        else: params["api_key"]=tmdb
        found=get_json("https://api.themoviedb.org/3/search/movie?"+urlencode(params),headers)
        row=(found.get("results") or [None])[0]
        if not row:return None
        mid=row.get("id")
        p={"language":"ko-KR","append_to_response":"credits,recommendations"}
        if len(tmdb)<=60:p["api_key"]=tmdb
        detail=get_json(f"https://api.themoviedb.org/3/movie/{mid}?"+urlencode(p),headers)
        return detail
    except Exception as exc:
        return {"error":str(exc)}
for code,m in movies.items():
    ext=m.setdefault("external",{})
    director=m.get("director","").split("|")[0].strip()
    if director and "wikimedia" not in ext:
        ext["wikimedia"]=wikimedia_person(director)
    if kobis:
        ext["kobis"]=kobis_movie(m.get("title",""))
        d=(ext["kobis"] or {}).get("detail") if isinstance(ext.get("kobis"),dict) else None
        if d:
            set_if_blank(m,"country",", ".join(x.get("nationNm","") for x in d.get("nations",[]) if x.get("nationNm")),"kobis")
            set_if_blank(m,"genre",", ".join(x.get("genreNm","") for x in d.get("genres",[]) if x.get("genreNm")),"kobis")
            m["kobisCode"]=d.get("movieCd") or m.get("kobisCode")
    if kmdb:
        ext["kmdb"]=kmdb_movie(m.get("title",""))
    if tmdb:
        ext["tmdb"]=tmdb_movie(m.get("title",""))
        d=ext["tmdb"] if isinstance(ext.get("tmdb"),dict) else None
        if d and not d.get("error"):
            m["tmdbId"]=d.get("id") or m.get("tmdbId")
            m["tmdbVoteAverage"]=d.get("vote_average")
            set_if_blank(m,"country",", ".join(x.get("name","") for x in d.get("production_countries",[]) if x.get("name")),"tmdb")
            set_if_blank(m,"genre",", ".join(x.get("name","") for x in d.get("genres",[]) if x.get("name")),"tmdb")

pack["movies"]=movies
MOVIES_PATH.write_text(json.dumps(pack,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
STATUS_PATH.write_text(json.dumps(status,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("public API enrichment complete:",json.dumps(status,ensure_ascii=False))
