"""Refresh approved soundtrack artwork and rebuild a balanced 365-day programme.
No API keys, no review scraping, no audio downloads. Local project only.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import html
import json
from pathlib import Path
import random
import re
import time
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'data/culture-year.json'
ART = ROOT / 'assets/soundtrack-posters'
MANIFEST = ROOT / 'data/soundtrack-media.json'
# Each page's title is checked before its poster can enter the manifest.
MOVIES = [
('Psycho',539,'사이코'),('Vertigo',426,'현기증'),('The Good, the Bad and the Ugly',429,'석양의 무법자'),
('Once Upon a Time in the West',335,'원스 어폰 어 타임 인 더 웨스트'),('Cinema Paradiso',11216,'시네마 천국'),
('Blade Runner',78,'블레이드 러너'),('Merry Christmas, Mr. Lawrence',11948,'전장의 크리스마스'),
('The Last Emperor',746,'마지막 황제'),('Spirited Away',129,'센과 치히로의 행방불명'),('Princess Mononoke',128,'모노노케 히메'),
('The Social Network',37799,'소셜 네트워크'),('Gone Girl',210577,'나를 찾아줘'),('There Will Be Blood',7345,'데어 윌 비 블러드'),
('Phantom Thread',400617,'팬텀 스레드'),('Under the Skin',97370,'언더 더 스킨'),('The Zone of Interest',467244,'존 오브 인터레스트'),
('Carol',258480,'캐롤'),('Fargo',275,'파고'),('Moonlight',376867,'문라이트'),('If Beale Street Could Talk',465914,'빌 스트리트가 말할 수 있다면'),
('The Assassination of Jesse James by the Coward Robert Ford',4512,'비겁한 로버트 포드의 제시 제임스 암살'),
('The Piano',713,'피아노'),('Koyaanisqatsi',11314,'코야니스카시'),('Mishima: A Life in Four Chapters',27064,'미시마'),
('Jaws',578,'죠스'),('E.T. the Extra-Terrestrial',601,'E.T.'),('Star Wars',11,'스타워즈'),('The Umbrellas of Cherbourg',5967,'쉘부르의 우산'),
('Twin Peaks: Fire Walk with Me',1923,'트윈 픽스: 파이어 워크 위드 미'),('Paris, Texas',655,'파리, 텍사스'),
('Suspiria',11906,'서스페리아'),('Oppenheimer',872585,'오펜하이머'),('Parasite',496243,'기생충'),('Oldboy',670,'올드보이'),
('The Handmaiden',290098,'아가씨'),('Monster',1050035,'괴물'),('Decision to Leave',705996,'헤어질 결심'),
('Drive My Car',758866,'드라이브 마이 카'),('Past Lives',666277,'패스트 라이브즈'),('Aftersun',965150,'애프터썬'),
('The Power of the Dog',600583,'파워 오브 도그'),('Killers of the Flower Moon',466420,'플라워 킬링 문')]


def load(path, default):
    if not path.exists(): return default
    return json.loads(path.read_text(encoding='utf-8-sig'))


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    data = json.dumps(value, ensure_ascii=False, indent=2) + '\n'
    tmp = path.with_name(path.name + '.tmp')
    tmp.write_text(data, encoding='utf-8')
    tmp.replace(path)


def normalized(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())


def poster(row):
    title, movie_id, korean = row
    page_url = f'https://www.themoviedb.org/movie/{movie_id}'
    try:
        req = Request(page_url, headers={'User-Agent':'Mozilla/5.0', 'Accept-Language':'en-US,en;q=0.9'})
        with urlopen(req, timeout=14) as r: text = r.read(2500000).decode('utf-8', 'replace')
        m = re.search(r'<title[^>]*>(.*?)</title>', text, re.I | re.S)
        page_title = html.unescape(re.sub('<[^>]+>', '', m.group(1))) if m else ''
        if normalized(title) not in normalized(page_title):
            raise ValueError('movie-title mismatch: ' + page_title[:120])
        candidates = re.findall(r'https://(?:media\.themoviedb\.org|image\.tmdb\.org)/t/p/w500/([A-Za-z0-9_-]+\.(?:jpg|png))',text)
        if not candidates: raise ValueError('no poster in verified page')
        url = 'https://image.tmdb.org/t/p/w500/' + candidates[0]
        with urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=14) as r: image=r.read(1800000)
        if not image.startswith((b'\xff\xd8', b'\x89PNG')): raise ValueError('not an image')
        ext = '.png' if image.startswith(b'\x89PNG') else '.jpg'
        file = ART / (str(movie_id) + ext)
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(image)
        return title, {'tmdbId':movie_id,'filmTitle':title,'filmTitleKo':korean,'path':'./assets/soundtrack-posters/'+file.name,
            'kind':'film-poster','source':page_url,'sourceImage':url,'verifiedPageTitle':page_title,
            'rights':'영화 포스터. 저작권은 각 권리자에게 있으며 오픈 라이선스 이미지로 분류하지 않습니다.',
            'sha256':hashlib.sha256(image).hexdigest(),'bytes':len(image),'checkedAt':datetime.now(timezone.utc).isoformat()}
    except Exception as exc: return title, {'error':str(exc),'source':page_url}


def balanced(n, label, size=365):
    rng = random.Random(int(hashlib.sha256(('INDIP-v38-'+label).encode()).hexdigest()[:16],16))
    result=[]
    while len(result)<size:
        deck=list(range(n)); rng.shuffle(deck)
        if result and n>1 and deck[0]==result[-1]: deck[0],deck[1]=deck[1],deck[0]
        result.extend(deck)
    return result[:size]


def enrich():
    data=load(PATH,{})
    manifest=load(MANIFEST,{'items':{}})
    mapped={en:(mid,ko) for en,mid,ko in MOVIES}
    for item in data['soundPools']['ost']:
        title=item['film']; movie_id, korean=mapped[title]
        item['filmTitleKo']=korean; item['tmdbId']=movie_id
        item['sourceUrl']=f'https://www.themoviedb.org/movie/{movie_id}'
        item['sourceLabel']='작품 정보'
        item['editorialBy']='INDI+P'; item['contentKind']='editorial-listening-note'
        query=title+' '+item['composer']+' soundtrack'
        item['listenLinks']=[
            {'label':'YouTube Music에서 찾기','url':'https://music.youtube.com/search?q='+quote(query)},
            {'label':'Spotify에서 찾기','url':'https://open.spotify.com/search/'+quote(query)},
            {'label':'MusicBrainz 앨범 검색','url':'https://musicbrainz.org/search?query='+quote(title+' '+item['composer'])+'&type=release_group&method=indexed'}]
        media=manifest.get('items',{}).get(title,{})
        if media.get('path'):
            item['image']=media['path']; item['imageKind']='film-poster'; item['imageCredit']={'label':'작품 포스터 · 음반 커버 아님','source':media['source'],'rights':media['rights']}
    poster_by_film={item['film']:item for item in data['soundPools']['ost']}
    story_film={
        'HERRMANN × HITCHCOCK':'Psycho','MORRICONE × LEONE':'Once Upon a Time in the West','WILLIAMS × SPIELBERG':'Jaws',
        'HISAISHI × MIYAZAKI':'Spirited Away','SAKAMOTO × OSHIMA':'Merry Christmas, Mr. Lawrence','SAKAMOTO × KORE-EDA':'Monster',
        'GREENWOOD × PTA':'There Will Be Blood','REZNOR/ROSS × FINCHER':'The Social Network','BADALAMENTI × LYNCH':'Twin Peaks: Fire Walk with Me',
        'BURWELL × COENS':'Fargo','GLASS × REGGIO':'Koyaanisqatsi','NYMAN × GREENAWAY':None,'JO YEONG-WOOK × PARK':'Oldboy',
        'JUNG JAE-IL × BONG':'Parasite','MICA LEVI × GLAZER':'Under the Skin','BRITELL × JENKINS':'Moonlight',
        'CAVE/ELLIS × DOMINIK':'The Assassination of Jesse James by the Coward Robert Ford'
    }
    pair_film={
        'Alfred Hitchcock × Bernard Herrmann':'Vertigo','Sergio Leone × Ennio Morricone':'Once Upon a Time in the West',
        'Steven Spielberg × John Williams':'E.T. the Extra-Terrestrial','Hayao Miyazaki × Joe Hisaishi':'Princess Mononoke',
        'Nagisa Oshima × Ryuichi Sakamoto':'Merry Christmas, Mr. Lawrence','Hirokazu Kore-eda × Ryuichi Sakamoto':'Monster',
        'Paul Thomas Anderson × Jonny Greenwood':'Phantom Thread','David Fincher × Reznor/Ross':'Gone Girl',
        'David Lynch × Angelo Badalamenti':'Twin Peaks: Fire Walk with Me','Coen Brothers × Carter Burwell':'Fargo',
        'Godfrey Reggio × Philip Glass':'Koyaanisqatsi','Peter Greenaway × Michael Nyman':None,
        'Park Chan-wook × Jo Yeong-wook':'The Handmaiden','Bong Joon-ho × Jung Jae-il':'Parasite',
        'Jonathan Glazer × Mica Levi':'The Zone of Interest','Barry Jenkins × Nicholas Britell':'If Beale Street Could Talk',
        'Andrew Dominik × Cave/Ellis':'The Assassination of Jesse James by the Coward Robert Ford'
    }
    for group in ('story','album','pair'):
        for item in data['soundPools'][group]:
            item['editorialBy']='INDI+P'
            item['contentKind']='editorial-commentary'
            if group=='album':
                item['note']='INDI+P의 감상·추천문입니다. RYM 이용자 리뷰를 옮긴 글이 아닙니다.'
                related=poster_by_film.get({'The Assassination of Jesse James':'The Assassination of Jesse James by the Coward Robert Ford','Mishima':'Mishima: A Life in Four Chapters'}.get(item.get('film'),item.get('film')))
            elif group=='story':
                related=poster_by_film.get(story_film.get(item.get('title')))
            else:
                related=poster_by_film.get(pair_film.get(item.get('title')))
            if related and related.get('image'):
                item['image']=related['image']; item['imageKind']='related-film-poster'
                item['imageCredit']={'label':'관련 작품 포스터 · 음반 커버 아님','source':related.get('sourceUrl',''),'rights':'영화 포스터. 저작권은 각 권리자에게 있습니다.'}
                item['sourceUrl']=related.get('sourceUrl','')
    # Unverified broad work-principle summaries must not masquerade as direct quotes.
    for item in data['masters']:
        item['contentKind']='editorial-commentary'; item['disclaimer']='INDI+P 편집 해설 · 감독의 직접 인용 아님'
        if '종합' in item.get('source',''): item['source']='작품을 읽는 편집 노트'
    schedules={key:balanced(len(pool),key) for key,pool in data['soundPools'].items()}
    masters=balanced(len(data['masters']),'masters'); terms=balanced(len(data['terms']),'terms')
    data['days']=[{'day':i+1,'sound':{key:schedules[key][i] for key in schedules},'master':masters[i],'term':terms[i]} for i in range(365)]
    data['version']=2
    data['programmeStartsOn']='2026-09-23'
    data['timezone']='Asia/Seoul'
    data['policy']['schedule']='한국시간 기준 365일 편성. 각 자료 묶음은 전 항목을 한 번씩 사용한 뒤 다음 순환을 시작합니다.'
    data['policy']['counts']='365개의 편성 슬롯이며 365개의 서로 다른 OST나 인용문을 뜻하지 않습니다.'
    data['policy']['masterNotes']='직접 인용과 확인되지 않은 명언을 만들지 않습니다. 편집자의 작품 해설로 구분합니다.'
    data['generatedAt']=datetime.now(timezone.utc).isoformat()
    data['counts']={**{key:len(pool) for key,pool in data['soundPools'].items()},'masters':len(data['masters']),'terms':len(data['terms']),'days':365}
    save(PATH,data)
    print(json.dumps({'coverage':{k:len(set(v)) for k,v in schedules.items()},'counts':data['counts']},ensure_ascii=False))


if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--start',type=int,default=0);parser.add_argument('--count',type=int,default=14);parser.add_argument('--data-only',action='store_true');args=parser.parse_args()
    if not args.data_only:
        manifest=load(MANIFEST,{'version':1,'items':{},'errors':{}})
        with ThreadPoolExecutor(max_workers=2) as pool:
            for title,info in pool.map(poster,MOVIES[args.start:args.start+args.count]):
                if 'error' in info: manifest['errors'][title]=info;print('SKIP',title,info['error'])
                else: manifest['items'][title]=info;manifest['errors'].pop(title,None);print('OK',title,info['bytes'])
        save(MANIFEST,manifest)
    enrich()
