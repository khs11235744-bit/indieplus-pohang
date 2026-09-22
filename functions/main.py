import hashlib
import html as html_lib
import json
import re
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

from firebase_admin import firestore, initialize_app
from firebase_functions import logger, scheduler_fn

initialize_app()
DB = firestore.client()
KST = timezone(timedelta(hours=9))

CINEMA = "000057"
BRAND = "indieart"
CGID = "FE8EF4D2-F22D-4802-A39A-D58F23A29C1E"
DTRYX = "https://www.dtryx.com"
DTRYX_MAIN = f"{DTRYX}/cinema/main.do?cgid={CGID}&BrandCd={BRAND}&CinemaCd={CINEMA}"
UA = {"User-Agent": "Mozilla/5.0 INDI-P-FirebaseSync/2.0"}
NEWS_SEED_URL = "https://raw.githubusercontent.com/khs11235744-bit/indieplus-pohang/main/data/news-weekly.json"

NEWS_QUERIES = [
    ("festival_official", "영화제", "(site:festival-cannes.com OR site:berlinale.de OR site:labiennale.org OR site:sundance.org OR site:locarnofestival.ch OR site:iffr.com OR site:tiff.net OR site:biff.kr) film festival"),
    ("world_indie", "해외 독립·예술", "independent film OR arthouse cinema OR art house film festival"),
    ("art_press", "해외 독립·예술", "(site:indiewire.com OR site:screendaily.com OR site:bfi.org.uk OR site:mubi.com OR site:filmcomment.com) independent film OR arthouse OR film festival"),
    ("asia_indie", "아시아", "Asian cinema independent film festival OR auteur film Asia"),
    ("korea_official", "국내 영화", "(site:kofic.or.kr OR site:magazine.kofic.or.kr OR site:indieground.kr OR site:koreafilm.or.kr) 한국영화 독립영화 예술영화"),
    ("korea_indie", "한국 독립·예술", "(site:indieground.kr OR site:koreafilm.or.kr OR site:biff.kr OR site:jeonjufest.kr) 독립영화 예술영화 GV 기획전"),
    ("art_cinema", "예술영화관", "(site:koreafilm.or.kr OR site:cinematheque.seoul.kr OR site:indiespace.kr OR site:artnine.co.kr OR site:sangsangmadang.com OR site:emuartspace.com) 영화 기획전 GV 상영"),
    ("pohang_art", "지역 예술", "(site:phcf.or.kr OR site:ilwol.phcf.or.kr OR site:poma.pohang.go.kr) 포항 전시 공연 문화 예술 영화 축제"),
]
OFFICIAL_DOMAINS = {
    "festival-cannes.com", "berlinale.de", "labiennale.org", "sundance.org",
    "locarnofestival.ch", "iffr.com", "tiff.net", "biff.kr", "kofic.or.kr",
    "magazine.kofic.or.kr", "indieground.kr", "koreafilm.or.kr", "dtryx.com",
    "phcf.or.kr", "ilwol.phcf.or.kr", "poma.pohang.go.kr",
}


def get_text(url: str) -> str:
    with urlopen(Request(url, headers=UA), timeout=25) as response:
        return response.read().decode("utf-8", "replace")


def clean(raw: str = "") -> str:
    raw = re.sub(r"<br\s*/?>", " ", raw or "", flags=re.I)
    raw = re.sub(r"<[^>]+>", " ", raw)
    return re.sub(r"\s+", " ", html_lib.unescape(raw)).strip()


def pick(pattern: str, text: str) -> str:
    match = re.search(pattern, text, re.S | re.I)
    return clean(match.group(1)) if match else ""


def unique(values):
    return list(dict.fromkeys(value for value in values if value))


def shorten(text: str, limit: int = 120) -> str:
    if len(text) <= limit:
        return text
    return text[:limit].rstrip() + "…"


def movie_detail(code: str):
    page = get_text(f"{DTRYX}/movie/view.do?MovieCd={code}")
    info = re.search(r'<h4 class="h4">.*?</h4>\s*<div class="etc">(.*?)</div>', page, re.S | re.I)
    meta = [clean(x) for x in re.findall(r"<span>(.*?)</span>", info.group(1), re.S | re.I)] if info else []
    poster_match = re.search(r'<div class="poster">.*?<img src="([^"]+)"', page, re.S | re.I)
    trailer_match = re.search(r'data-source="([^"]+\.mp4)"', page, re.I)
    stills = unique(re.findall(r'https://img\.dtryx\.com/poster/[^"\']+\.Large\.(?:jpg|png|jpeg)', page, re.I))
    synopsis = pick(r'<div class="tit">줄거리</div>\s*<div class="txt">(.*?)</div>', page)
    return {
        "code": code,
        "title": pick(r'<h3 class="h3">(.*?)</h3>', page),
        "eng": pick(r'<h4 class="h4">(.*?)</h4>', page),
        "director": pick(r'<dt>감독</dt>\s*<dd>(.*?)</dd>', page),
        "actors": pick(r'<dt>배우</dt>\s*<dd>(.*?)</dd>', page),
        "short": shorten(synopsis, 92),
        "synopsis": synopsis,
        "poster": poster_match.group(1) if poster_match else "",
        "still": stills[0] if stills else "",
        "stills": stills[:8],
        "trailer": trailer_match.group(1) if trailer_match else "",
        "meta": meta,
        "sourceUrl": f"{DTRYX}/movie/view.do?MovieCd={code}",
    }


def build_cinema_payload():
    page = get_text(DTRYX_MAIN)
    playing = page.split("<!-- // 현재상영작 top 10 -->", 1)[0]
    movie_codes = unique(re.findall(r"MovieCd=(\d{6})", playing))
    movies = {}
    for code in movie_codes:
        try:
            movies[code] = movie_detail(code)
        except Exception as exc:
            logger.warn(f"movie detail skipped {code}: {exc}")

    enabled = []
    for cls, date in re.findall(r'<a href="#" class="btnDay([^"]*)" data-dt="(\d{4}-\d{2}-\d{2})">', page):
        if "disabled" not in cls:
            enabled.append(date)

    days = []
    for date in sorted(dict.fromkeys(enabled)):
        query = urlencode({"BrandCd": BRAND, "CinemaCd": CINEMA, "PlaySDT": date, "cgid": CGID})
        body = json.loads(get_text(f"{DTRYX}/cinema/showseq_list.do?{query}"))
        sessions = []
        for item in body.get("Showseqlist", []):
            sessions.append({
                "code": item.get("MovieCd", ""),
                "title": item.get("MovieNmNat") or item.get("MovieNm", ""),
                "start": item.get("StartTime", ""),
                "end": item.get("EndTime", ""),
                "minutes": int(item.get("RunningTime") or 0),
                "age": (item.get("RatingNm") or "").replace("이상관람가", "").replace("전체관람가", "전체"),
                "availableSeats": int(item.get("RemainSeatCnt") or 0),
                "showSeq": int(item.get("ShowSeq") or 1),
                "screenCode": item.get("ScreenCd") or "01",
                "screenName": item.get("ScreenNm") or "",
                "bookable": str(item.get("NextSkipYn") or "").upper() == "Y",
            })
        sessions.sort(key=lambda x: x["start"])
        days.append({"date": date, "sessions": sessions})

    now = datetime.now(KST).strftime("%Y-%m-%d %H:%M KST")
    hits = [key for key in ("GV", "기획전") if key in page]
    note = ("공개 극장 메인 페이지에 " + ", ".join(hits) + " 표기가 있습니다. 공식 극장 소식에서 상세를 확인하세요.") if hits else "공개 극장 메인 페이지 기준 별도 GV/기획전 표기를 확인하지 못했습니다."
    return (
        {"updated": now, "source": "Dtryx 인디플러스 포항 공개 편성", "cinema": {"name": "인디플러스 포항", "code": CINEMA}, "days": days},
        {"updated": now, "source": "Dtryx 공개 영화 상세 페이지", "movies": movies},
        {"updated": now, "source": "Dtryx 인디플러스 포항 극장 메인 페이지", "items": [], "note": note},
    )


def source_domain(url: str = "") -> str:
    match = re.match(r"https?://([^/]+)", url or "")
    return match.group(1).lower().removeprefix("www.") if match else ""


def norm_title(title: str) -> str:
    return re.sub(r"[^0-9a-zA-Z가-힣]+", "", (title or "").lower())


def parse_feed(query: str):
    params = {"q": query, "hl": "en-US", "gl": "US", "ceid": "US:en"}
    raw = get_text("https://news.google.com/rss/search?" + urlencode(params))
    root = ET.fromstring(raw)
    rows = []
    for item in root.findall(".//item"):
        title = clean(item.findtext("title") or "")
        link = clean(item.findtext("link") or "")
        description = shorten(clean(item.findtext("description") or ""), 700)
        source_node = item.find("source")
        source = clean(source_node.text if source_node is not None else "")
        source_url = source_node.attrib.get("url", "") if source_node is not None else ""
        published = item.findtext("pubDate") or ""
        try:
            published_at = parsedate_to_datetime(published).astimezone(timezone.utc).isoformat()
        except Exception:
            published_at = ""
        if title and link:
            rows.append({
                "titleOriginal": title,
                "descriptionOriginal": description,
                "url": link,
                "source": source,
                "sourceUrl": source_url,
                "publishedAt": published_at,
            })
    return rows


def build_news_payload():
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=14)
    items = []
    for query_id, category, query in NEWS_QUERIES:
        try:
            rows = parse_feed(query)
        except Exception as exc:
            logger.warn(f"news query failed {query_id}: {exc}")
            continue
        for row in rows:
            if row["publishedAt"]:
                try:
                    if datetime.fromisoformat(row["publishedAt"]) < cutoff:
                        continue
                except Exception:
                    pass
            row["category"] = category
            row["queryId"] = query_id
            row["id"] = hashlib.sha1((row["titleOriginal"] + row["url"]).encode("utf-8")).hexdigest()[:14]
            items.append(row)

    dedup = {}
    for item in items:
        key = norm_title(item["titleOriginal"])
        if key and key not in dedup:
            dedup[key] = item
    items = list(dedup.values())

    for item in items:
        domain = source_domain(item.get("sourceUrl"))
        item["official"] = any(domain == d or domain.endswith("." + d) for d in OFFICIAL_DOMAINS)
        category = item["category"]
        score = 20 if item["official"] else 0
        score += 8 if category in ("국내 영화", "지역 예술", "예술영화관") else 0
        score += 6 if category == "영화제" else 0
        score += 4 if category in ("해외 독립·예술", "한국 독립·예술") else 0
        if item["publishedAt"]:
            try:
                age = max(0, (now - datetime.fromisoformat(item["publishedAt"])).total_seconds() / 86400)
                score += max(0, 12 - age)
            except Exception:
                pass
        item["score"] = round(score, 2)

    items.sort(key=lambda x: (x.get("score", 0), x.get("publishedAt", "")), reverse=True)
    old_doc = DB.collection("public").document("newsWeekly").get()
    previous = {}
    if old_doc.exists:
        previous = {x.get("id"): x for x in (old_doc.to_dict() or {}).get("items", []) if x.get("id")}
    else:
        try:
            seed = json.loads(get_text(NEWS_SEED_URL))
            previous = {x.get("id"): x for x in seed.get("items", []) if x.get("id")}
            logger.info(f"news seed loaded from GitHub: {len(previous)} cached edits")
        except Exception as exc:
            logger.warn(f"news seed unavailable: {exc}")

    limits = {"영화제": 6, "해외 독립·예술": 5, "아시아": 3, "국내 영화": 6, "한국 독립·예술": 5, "예술영화관": 5, "지역 예술": 6}
    counts, selected = {}, []
    for item in items:
        category = item.get("category", "기타")
        if counts.get(category, 0) >= limits.get(category, 3):
            continue
        counts[category] = counts.get(category, 0) + 1
        prev = previous.get(item["id"], {})
        core_title = re.sub(r"\s+-\s+[^-]+$", "", item.get("titleOriginal", "")).strip()
        selected.append({
            "id": item["id"], "category": category, "source": item.get("source", ""),
            "official": bool(item.get("official")), "publishedAt": item.get("publishedAt", ""),
            "url": item.get("url", ""), "sourceUrl": item.get("sourceUrl", ""),
            "titleOriginal": core_title, "descriptionOriginal": item.get("descriptionOriginal", ""),
            "titleKo": prev.get("titleKo", ""), "summaryKo": prev.get("summaryKo", ""),
            "whyItMatters": prev.get("whyItMatters", ""), "keyPoints": prev.get("keyPoints", []),
            "tags": prev.get("tags", []), "translationStatus": prev.get("translationStatus", "pending"),
        })
        if len(selected) >= 32:
            break

    category_summary = " · ".join(f"{key} {value}" for key, value in counts.items() if value)
    return {
        "generatedAt": now.isoformat(),
        "periodLabel": "최근 2주 / Firebase 자동 편집본",
        "translationPolicy": "제목·RSS 설명·원문 링크만 자동 수집하며 기존 한국어 편집본은 유지",
        "digestTitle": "이번 주 세계 독립·예술영화 뉴스",
        "digestSummary": f"최근 2주 주요 소식을 자동 선별했습니다. {category_summary}",
        "items": selected,
    }


def set_status(kind: str, ok: bool, detail: str):
    DB.collection("public").document("sync-status").set({
        kind: {"ok": ok, "detail": detail, "at": datetime.now(timezone.utc).isoformat()}
    }, merge=True)


@scheduler_fn.on_schedule(schedule="every 30 minutes")
def sync_cinema(event: scheduler_fn.ScheduledEvent) -> None:
    try:
        live, movies, programs = build_cinema_payload()
        batch = DB.batch()
        batch.set(DB.collection("public").document("live"), live)
        batch.set(DB.collection("public").document("movies"), movies)
        batch.set(DB.collection("public").document("programs"), programs)
        batch.commit()
        detail = f"{len(live['days'])} days / {sum(len(d['sessions']) for d in live['days'])} sessions / {len(movies['movies'])} movies"
        set_status("cinema", True, detail)
        logger.info(f"cinema sync complete: {detail}")
    except Exception as exc:
        set_status("cinema", False, str(exc)[:500])
        logger.error(f"cinema sync failed: {exc}")
        raise


@scheduler_fn.on_schedule(schedule="every 3 hours")
def sync_news(event: scheduler_fn.ScheduledEvent) -> None:
    try:
        payload = build_news_payload()
        DB.collection("public").document("newsWeekly").set(payload)
        detail = f"{len(payload['items'])} selected articles"
        set_status("news", True, detail)
        logger.info(f"news sync complete: {detail}")
    except Exception as exc:
        set_status("news", False, str(exc)[:500])
        logger.error(f"news sync failed: {exc}")
        raise