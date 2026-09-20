import json, hashlib
from pathlib import Path
from datetime import datetime, timezone

ROOT=Path(__file__).resolve().parents[1]
P=ROOT/"data"/"news-weekly.json"
data=json.loads(P.read_text(encoding="utf-8"))
items=data.get("items",[])

def make_id(key): return "seed-"+hashlib.sha1(key.encode("utf-8")).hexdigest()[:10]
def upsert(x):
    global items
    items=[v for v in items if v.get("id")!=x["id"]]
    items.append(x)

seed=[
{
"id":make_id("kofic-governance-20260918"),"category":"국내 영화","source":"영화진흥위원회","official":True,"publishedAt":"2026-09-18T00:00:00+09:00",
"url":"https://m.kofic.or.kr/kofic/business/noti/findNewsList.do","sourceUrl":"https://www.kofic.or.kr/","titleOriginal":"한국영화 지속발전 특별위원회 「영상 콘텐츠 거버넌스 공청회」 개최",
"titleKo":"플랫폼 시대의 영화정책, ‘영상 콘텐츠 거버넌스’ 공청회 열린다",
"summaryKo":"영화진흥위원회 한국영화 지속발전 특별위원회가 플랫폼 시대의 영상 콘텐츠 정책과 거버넌스를 논의하는 공청회를 연다. 공청회는 영화·방송·플랫폼 산업의 경계가 빠르게 흐려지는 상황에서 기존 영화정책 체계가 어떤 방향으로 바뀌어야 하는지 논의하는 자리다. 미디어 연구자들의 발제에 이어 영화·방송·플랫폼 현장 전문가들이 종합토론에 참여하고 방청객 질의응답도 진행한다. 최근 한국영화 산업 위기 논의가 제작지원뿐 아니라 플랫폼 유통과 정책 거버넌스 문제로 확장되고 있다는 점에서 의미가 있다.",
"whyItMatters":"영화 제작과 극장 정책만이 아니라 스트리밍·방송까지 포함한 ‘한국영화 생태계’를 어떤 제도로 묶을지 논의하는 흐름이다.",
"keyPoints":["한국영화 지속발전 특별위원회 공청회","영화·방송·플랫폼 전문가 종합토론","플랫폼 시대 정책·거버넌스 논의"],"tags":["KOFIC","한국영화","영화정책","플랫폼"],"translationStatus":"translated-reviewed"
},
{
"id":make_id("kofic-midbudget-20260911"),"category":"국내 영화","source":"영화진흥위원회","official":True,"publishedAt":"2026-09-11T00:00:00+09:00",
"url":"https://www.kofic.or.kr/kofic/business/board/selectBoardDetail.do?boardNumber=181&boardSeqNumber=75403","sourceUrl":"https://www.kofic.or.kr/","titleOriginal":"역대 최대 257억 7천만 원 지원, 2026년 추경 중예산 한국영화 제작지원작 16편 선정",
"titleKo":"중예산 한국영화 16편에 257억7천만 원 추가 지원",
"summaryKo":"영화진흥위원회가 2026년 추가경정예산을 통해 중예산 한국영화 제작지원작 16편을 선정하고 총 257억7천만 원을 지원한다. 본예산 198억 원에 이어 추가 지원이 이뤄지면서 중예산 영화 제작지원 규모가 크게 확대됐다. 선정작 가운데 신인감독 작품은 8편으로 전체의 절반을 차지한다. 사업은 대규모 상업영화와 저예산 독립영화 사이에서 축소돼온 중간 규모 제작을 활성화하고 민간 투자를 끌어내는 것을 목표로 한다. 어떤 작품들이 실제 제작과 개봉까지 이어지는지가 향후 한국영화 라인업 다양성을 가늠할 지표가 될 전망이다.",
"whyItMatters":"한국영화의 ‘허리’에 해당하는 중예산 작품이 다시 늘어날 수 있을지 가늠하는 직접적인 제작지원 정책이다.",
"keyPoints":["추경 지원 257억7천만 원","선정작 16편","신인감독 작품 8편"],"tags":["KOFIC","중예산영화","제작지원","한국영화"],"translationStatus":"translated-reviewed"
},
{
"id":make_id("kofic-smallcinema-20260915"),"category":"국내 영화","source":"영화진흥위원회","official":True,"publishedAt":"2026-09-15T00:00:00+09:00",
"url":"https://m.kofic.or.kr/kofic/business/noti/findNewsList.do","sourceUrl":"https://www.kofic.or.kr/","titleOriginal":"지역에서도 다양한 영화를 만날 수 있도록! 2026 작은영화관 기획전 개막",
"titleKo":"전국 25개 작은영화관에서 11월까지 기획전 이어진다",
"summaryKo":"영화진흥위원회가 주관하는 2026 작은영화관 기획전이 제주 한림작은영화관을 시작으로 전국 25개 작은영화관에서 순차적으로 열린다. 프로그램은 11월까지 이어지며 지역 관객이 상업 멀티플렉스 중심 편성에서 만나기 어려운 작품을 접할 수 있도록 기획됐다. 첫 행사에서는 정지영 감독의 〈부러진 화살〉 상영과 함께 배우 안성기의 필모그래피를 돌아보는 시네토크가 진행됐다. 작은영화관이 단순 상영시설을 넘어 지역 영화문화의 프로그램 거점으로 기능하는 사례라는 점에서 주목할 만하다.",
"whyItMatters":"포항을 넘어 다른 지역의 작은 영화관·예술영화관 네트워크를 앱에 연결해야 하는 이유를 보여주는 정책 사례다.",
"keyPoints":["전국 25개 작은영화관","11월까지 순차 개최","상영+시네토크 프로그램"],"tags":["작은영화관","지역영화문화","기획전","KOFIC"],"translationStatus":"translated-reviewed"
},
{
"id":make_id("indieground-firstlink-20260903"),"category":"한국 독립·예술","source":"인디그라운드","official":True,"publishedAt":"2026-09-03T00:00:00+09:00",
"url":"https://www.indieground.kr/indie/newsrelease.do","sourceUrl":"https://www.indieground.kr/","titleOriginal":"'2026 독립영화 매칭 워크숍 퍼스트링크' 성황리 마무리",
"titleKo":"독립영화 창작과 배급을 잇는 ‘퍼스트링크’ 2026 마무리",
"summaryKo":"인디그라운드가 독립영화 창작자와 유통·배급 관계자를 연결하는 2026 독립영화 매칭 워크숍 ‘퍼스트링크’를 마무리했다. 이 프로그램은 아직 배급사가 정해지지 않은 독립영화가 실제 배급 관계자와 만날 수 있도록 비즈니스 미팅과 워크숍을 제공한다. 독립영화가 영화제 상영 이후 관객에게 도달하기까지 가장 큰 병목 가운데 하나인 유통·배급 단계에 직접 개입하는 사업이다. 완성작의 발견뿐 아니라 제작 이후의 경로를 함께 보여준다는 점에서 국내 독립영화 생태계를 이해하는 데 중요한 소식이다.",
"whyItMatters":"좋은 독립영화가 만들어지는 것과 실제 관객에게 도달하는 것은 별개의 문제이며, 퍼스트링크는 그 사이를 연결하는 프로그램이다.",
"keyPoints":["독립영화-배급 관계자 매칭","배급사 미정 작품 대상","유통·배급 단계 지원"],"tags":["인디그라운드","독립영화","배급","퍼스트링크"],"translationStatus":"translated-reviewed"
},
{
"id":make_id("kofa-newyork-20260929"),"category":"예술영화관","source":"시네마테크KOFA","official":True,"publishedAt":"2026-09-20T00:00:00+09:00",
"url":"https://www.koreafilm.or.kr/cinematheque/programs/PI_01655","sourceUrl":"https://www.koreafilm.or.kr/","titleOriginal":"영화와 공간: 뉴욕 Part 1",
"titleKo":"시네마테크KOFA, 뉴욕의 공간을 영화로 읽는 13편 기획전",
"summaryKo":"시네마테크KOFA가 9월29일부터 10월14일까지 ‘영화와 공간: 뉴욕 Part 1’을 연다. 기획전은 고전 경찰 수사극과 범죄영화, 컬트, 로맨틱 코미디, 초자연적 모험극, 콘서트 영화 등 서로 다른 장르가 뉴욕이라는 도시를 어떻게 바라보는지 묶어 보여준다. 〈네이키드 시티〉, 〈뜨거운 오후〉, 〈25시〉, 〈다이 하드 3〉, 〈고스트버스터즈〉 등 13편이 포함됐다. 한 감독이나 장르가 아니라 ‘공간’을 큐레이션의 축으로 삼아 도시의 다층적 초상을 만드는 프로그램이다. 다른 예술영화관의 기획전을 함께 모아보는 네트워크형 뉴스탭과 잘 맞는 사례다.",
"whyItMatters":"예술영화관의 가치는 개별 상영작뿐 아니라 작품을 서로 연결하는 큐레이션에 있다는 점을 잘 보여준다.",
"keyPoints":["9월29일~10월14일","뉴욕을 다룬 13편","공간 중심 큐레이션"],"tags":["KOFA","시네마테크","기획전","뉴욕"],"translationStatus":"translated-reviewed"
},
{
"id":make_id("phcf-musicfestival-20261105"),"category":"지역 예술","source":"포항문화재단","official":True,"publishedAt":"2026-09-20T00:00:00+09:00",
"url":"https://ilwol.phcf.or.kr/","sourceUrl":"https://ilwol.phcf.or.kr/","titleOriginal":"2026 포항국제음악제",
"titleKo":"11월 포항국제음악제, 일주일간 도시 곳곳에서 열린다",
"summaryKo":"2026 포항국제음악제가 11월5일부터 11일까지 포항문화예술회관과 포항 시내 여러 공간에서 열린다. 개막공연 ‘흐름’을 시작으로 오로라, 키아로스쿠로 콰르텟, ‘과거에서 현재로’, 포항시립교향악단 협연, 선우예권 공연과 폐막공연 ‘경계 너머’까지 연속 프로그램이 예정돼 있다. 하나의 공연만 소개하기보다 일주일 동안 도시 전체에서 이어지는 음악축제라는 점이 특징이다. 영화 뉴스룸 옆에 지역 공연·전시·축제 소식을 함께 배치하면 앱이 향후 지역 문화예술 매거진으로 확장될 수 있는 대표 사례다.",
"whyItMatters":"영화관 정보에 머물지 않고 지역의 음악·공연까지 연결하는 ‘지역 문화생활 플랫폼’ 확장에 가장 적합한 행사다.",
"keyPoints":["11월5일~11일","포항문화예술회관·포항 시내","공연 연속 편성"],"tags":["포항","음악제","공연","지역예술"],"translationStatus":"translated-reviewed"
},
{
"id":make_id("phcf-achimnol-20260929"),"category":"지역 예술","source":"포항문화재단","official":True,"publishedAt":"2026-09-20T00:00:00+09:00",
"url":"https://festival.phcf.or.kr/","sourceUrl":"https://festival.phcf.or.kr/","titleOriginal":"2026 지역전시 활성화사업 <아침놀>",
"titleKo":"동빈문화창고1969에서 지역전시 활성화사업 〈아침놀〉 진행",
"summaryKo":"포항문화재단의 2026 지역전시 활성화사업 〈아침놀〉이 9월29일까지 동빈문화창고1969에서 열린다. 지역의 전시 공간과 예술 활동을 연결해 시민이 일상 가까이에서 시각예술을 만날 수 있도록 하는 프로그램이다. 포항의 문화예술 소식을 영화 상영정보와 같은 앱 안에서 함께 보여줄 경우 ‘오늘 볼 영화’와 ‘오늘 갈 전시’를 같은 문화생활 흐름으로 묶을 수 있다. 향후 지역예술 탭에서 전시·공연·축제·문학을 유형별로 분리하는 구조의 첫 사례로 활용할 수 있다.",
"whyItMatters":"지역 영화관 사용자에게 같은 도시의 전시 정보를 자연스럽게 연결할 수 있는 실제 콘텐츠다.",
"keyPoints":["9월29일까지","동빈문화창고1969","지역전시 활성화사업"],"tags":["포항","전시","동빈문화창고1969","지역예술"],"translationStatus":"translated-reviewed"
},
{
"id":make_id("phcf-suyo-movie-20261230"),"category":"지역 예술","source":"포항문화재단","official":True,"publishedAt":"2026-09-20T00:00:00+09:00",
"url":"https://ilwol.phcf.or.kr/","sourceUrl":"https://ilwol.phcf.or.kr/","titleOriginal":"문화가 있는 날 <수요 있는 영화 생활>",
"titleKo":"포항 ‘수요 있는 영화 생활’, 연말까지 이어지는 생활권 영화 프로그램",
"summaryKo":"포항문화재단의 문화가 있는 날 프로그램 〈수요 있는 영화 생활〉이 12월30일까지 인디플러스 포항과 중앙아트홀에서 이어진다. 일회성 행사보다 정기적으로 영화를 만나는 생활문화 프로그램에 가깝다는 점이 특징이다. 지역예술 탭에서는 이처럼 영화와 지역문화 정책이 겹치는 프로그램을 ‘영화’와 ‘지역예술’ 양쪽에서 발견할 수 있게 연결할 필요가 있다. 장기적으로는 상영 일정, 프로그램 기사, 관람 기록을 하나의 사용자 경험으로 엮는 핵심 콘텐츠가 될 수 있다.",
"whyItMatters":"인디플러스 포항을 앱의 출발점으로 유지하면서도 지역 문화예술 전체로 넓히는 연결고리가 되는 프로그램이다.",
"keyPoints":["12월30일까지","인디플러스 포항·중앙아트홀","문화가 있는 날 정기 프로그램"],"tags":["포항","인디플러스","문화가있는날","지역영화"],"translationStatus":"translated-reviewed"
},
{
"id":make_id("sangsang-cinema-20260921"),"category":"예술영화관","source":"KT&G 상상마당 시네마","official":True,"publishedAt":"2026-09-21T00:00:00+09:00",
"url":"https://sangsangmadang.com/movie/list","sourceUrl":"https://sangsangmadang.com/","titleOriginal":"KT&G 상상마당 시네마 현재 상영작",
"titleKo":"상상마당 시네마, 9월 말 독립·예술영화 15편 편성",
"summaryKo":"KT&G 상상마당 시네마가 9월 말 독립·예술영화 중심의 현재 상영작 15편을 공개했다. 편성에는 〈어떻게 해야 했을까?〉, 〈철들 무렵〉, 〈아가미〉, 〈환희의 얼굴〉, 〈해피엔드〉와 함께 〈최악의 하루〉 기획전 등 국내외 작품이 섞여 있다. 일반 상영과 기획전이 한 화면에 함께 배치돼 있어 한 예술영화관의 큐레이션 흐름을 살펴보기 좋다. INDIE+ POHANG 편성과 나란히 보면 같은 시기에 지역과 서울의 독립·예술영화관이 어떤 작품을 선택하는지 비교할 수 있다. 앞으로 예술영화관 탭에서는 이런 편성 차이를 극장별로 묶어 보여주는 기능으로 확장할 수 있다.",
"whyItMatters":"한 극장의 현재 편성을 기사처럼 요약하면 ‘어디서 무엇을 상영하나’를 넘어 예술영화관별 큐레이션 성격을 비교할 수 있다.",
"keyPoints":["현재 상영작 15편","〈어떻게 해야 했을까?〉·〈해피엔드〉 등","독립·예술영화+기획전 편성"],"tags":["상상마당","예술영화관","독립영화","상영정보"],"translationStatus":"translated-reviewed"
}
]

for x in seed: upsert(x)
priority={"국내 영화":0,"한국 독립·예술":1,"예술영화관":2,"지역 예술":3,"영화제":4,"해외 독립·예술":5,"아시아":6}
items.sort(key=lambda x:(priority.get(x.get("category"),9),x.get("publishedAt","")),reverse=False)
data["items"]=items
data["digestTitle"]="이번 주 영화·예술 뉴스"
data["digestSummary"]="이번 주 뉴스룸은 해외 영화제뿐 아니라 국내 영화정책과 독립영화 유통, 예술영화관의 큐레이션, 포항의 공연·전시까지 범위를 넓혔다. 영화진흥위원회는 플랫폼 시대 거버넌스와 중예산 제작지원 등 산업 구조를 다루고 있고, 시네마테크KOFA는 공간을 축으로 한 기획전을 준비한다. 포항에서는 국제음악제와 전시, 생활권 영화 프로그램이 이어지며 영화와 지역예술을 하나의 문화생활 흐름으로 묶을 수 있는 기반이 보인다."
data["generatedAt"]=datetime.now(timezone.utc).isoformat()
P.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("seeded",len(seed),"items / total",len(items))
