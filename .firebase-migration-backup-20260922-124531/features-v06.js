let NEWS_WEEKLY=null,NEWS_SOURCES=null,BRAND_CONFIG=null,newsFilter="all";
const newsSaved=()=>JSON.parse(localStorage.getItem("indiePohangNewsSaved")||"[]");
const saveNewsSaved=a=>localStorage.setItem("indiePohangNewsSaved",JSON.stringify(a));

function newsDate(iso){
  if(!iso)return "";
  try{return new Intl.DateTimeFormat("ko-KR",{month:"short",day:"numeric"}).format(new Date(iso))}catch(e){return ""}
}
function toggleNewsSave(id){
  const a=newsSaved(),i=a.indexOf(id);i>=0?a.splice(i,1):a.push(id);saveNewsSaved(a);renderNewsCards();
}
function newsItems(){
  const all=(NEWS_WEEKLY?.items||[]).filter(x=>x.translationStatus==="translated-reviewed"&&x.titleKo&&x.summaryKo);
  if(newsFilter==="all")return all;
  if(newsFilter==="saved")return all.filter(x=>newsSaved().includes(x.id));
  return all.filter(x=>x.category===newsFilter);
}
function renderNewsCards(){
  const root=document.getElementById("newsGrid");if(!root)return;
  const saved=newsSaved(),items=newsItems();
  root.innerHTML=items.length?items.map(x=>{
    const title=x.titleKo||x.titleOriginal,summary=x.summaryKo||"한국어 요약을 준비 중입니다.";
    const tags=(x.tags||[]).map(t=>'<span>#'+esc(t)+'</span>').join("");
    return '<article class="news-card">'+
      '<div class="news-card-top"><span class="news-cat">'+esc(x.category)+'</span>'+(x.official?'<span class="news-official">OFFICIAL</span>':'')+'<button onclick="toggleNewsSave(\''+x.id+'\')">'+(saved.includes(x.id)?"★":"☆")+'</button></div>'+
      '<small>'+esc(x.source)+' · '+esc(newsDate(x.publishedAt))+'</small>'+
      '<div class="news-korean-label">한글 요약기사</div><h3>'+esc(title)+'</h3><p class="news-summary-ko">'+esc(summary)+'</p>'+
      (x.whyItMatters?'<div class="news-why"><b>왜 주목할까</b><p>'+esc(x.whyItMatters)+'</p></div>':'')+
      ((x.keyPoints||[]).length?'<div class="news-keypoints">'+x.keyPoints.slice(0,3).map(v=>'<span>'+esc(v)+'</span>').join('')+'</div>':'')+
      '<div class="news-tags">'+tags+'</div>'+
      '<details class="news-source-details"><summary>출처·원문 확인</summary><div class="news-original"><b>원문 제목</b><span>'+esc(x.titleOriginal)+'</span></div><a href="'+x.url+'" target="_blank" rel="noopener">원문 사이트에서 보기 ↗</a></details>'+
      '<div class="news-actions"><span>'+(x.translationStatus==="translated-reviewed"?"한국어 편집완료":"번역 대기")+'</span></div>'+
      '</article>';
  }).join(""):'<div class="empty">이 필터에 해당하는 소식이 없습니다.</div>';
}
function renderFestivalTracker(){
  const root=document.getElementById("festivalTracker");if(!root)return;
  root.innerHTML=(NEWS_SOURCES?.officialFestivals||[]).map(f=>'<a href="'+f.url+'" target="_blank" rel="noopener"><b>'+esc(f.name)+'</b><small>'+esc(f.country)+'</small></a>').join("");
}
function renderCinemaTracker(){
  const root=document.getElementById("cinemaTracker");if(!root)return;
  root.innerHTML=(NEWS_SOURCES?.artCinemas||[]).map(f=>'<a href="'+f.url+'" target="_blank" rel="noopener"><b>'+esc(f.name)+'</b><small>'+esc(f.region||"")+'</small></a>').join("");
}
function renderLocalArtsTracker(){
  const root=document.getElementById("localArtsTracker");if(!root)return;
  root.innerHTML=(NEWS_SOURCES?.localArts||[]).map(f=>'<a href="'+f.url+'" target="_blank" rel="noopener"><b>'+esc(f.name)+'</b><small>'+esc(f.region||"")+'</small></a>').join("");
}
function injectNewsroom(){
  if(document.getElementById("newsroom"))return;
  const discover=document.getElementById("discover");if(!discover)return;
  const sec=document.createElement("section");sec.id="newsroom";sec.className="wrap section newsroom";
  sec.innerHTML='<div class="section-head"><div><div class="kicker">CINEMA / ARTS / LOCAL CULTURE</div><h2>영화·예술 뉴스룸</h2><p>세계 영화제부터 국내 영화산업, 독립·예술영화관, 포항 지역 문화예술까지 한국어 편집 기사로 묶습니다.</p></div><button class="ghostbtn" id="newsSavedBtn">저장한 기사</button></div>'+
    '<article class="news-digest"><div><div class="kicker">WEEKLY DIGEST</div><h3 id="newsDigestTitle"></h3><p id="newsDigestSummary"></p></div><div class="news-digest-meta"><b id="newsCount"></b><span id="newsGenerated"></span></div></article>'+
    '<div class="source-tracker-block"><div><span>세계 영화제</span><div class="festival-tracker" id="festivalTracker"></div></div><div><span>예술영화관 네트워크</span><div class="festival-tracker cinema-tracker" id="cinemaTracker"></div></div><div><span>지역 예술 소스</span><div class="festival-tracker local-arts-tracker" id="localArtsTracker"></div></div></div>'+
    '<div class="news-filter" id="newsFilter"><button data-news="all" class="on">전체</button><button data-news="국내 영화">국내 영화</button><button data-news="한국 독립·예술">한국 독립·예술</button><button data-news="예술영화관">예술영화관</button><button data-news="지역 예술">지역 예술</button><button data-news="영화제">영화제</button><button data-news="해외 독립·예술">해외</button><button data-news="아시아">아시아</button></div>'+
    '<div class="news-grid" id="newsGrid"></div>';
  discover.insertAdjacentElement("afterend",sec);
  document.getElementById("newsSavedBtn").onclick=()=>{newsFilter="saved";sec.querySelectorAll("[data-news]").forEach(x=>x.classList.remove("on"));renderNewsCards()};
  sec.querySelectorAll("[data-news]").forEach(b=>b.onclick=()=>{newsFilter=b.dataset.news;sec.querySelectorAll("[data-news]").forEach(x=>x.classList.toggle("on",x===b));renderNewsCards()});
}
function applyBrandConfig(){
  if(!BRAND_CONFIG)return;
  const name=BRAND_CONFIG.name||"INDIE PORT",origin=BRAND_CONFIG.origin?.label||"INDIE+ POHANG";
  const mark=document.getElementById("brandMark"),brand=document.getElementById("brandName"),sub=document.getElementById("brandOrigin"),footer=document.getElementById("brandFooter");
  if(mark)mark.textContent=name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();
  if(brand){const small=brand.querySelector("small");brand.childNodes[0].nodeValue=name;if(small)small.textContent=(BRAND_CONFIG.status==="working-title"?"WORKING TITLE · ":"")+origin;}
  if(sub)sub.textContent=(BRAND_CONFIG.status==="working-title"?"WORKING TITLE · ":"")+origin;
  if(footer)footer.textContent=name+(BRAND_CONFIG.status==="working-title"?" · WORKING TITLE":"");
  document.title=name+" — independent cinema, arts & local culture";
}
async function initV06(){
  try{
    [NEWS_WEEKLY,NEWS_SOURCES,BRAND_CONFIG]=await Promise.all([
      (window.fetchIndiePublicData?window.fetchIndiePublicData("newsWeekly","./data/news-weekly.json",false):fetch("./data/news-weekly.json?v="+Date.now()).then(r=>r.ok?r.json():null)),
      fetch("./data/news-sources.json?v="+Date.now()).then(r=>r.ok?r.json():null),
      fetch("./data/brand.json?v="+Date.now()).then(r=>r.ok?r.json():null)
    ]);
  }catch(e){console.warn("newsroom data",e)}
  applyBrandConfig();
  injectNewsroom();
  if(!NEWS_WEEKLY)return;
  const t=document.getElementById("newsDigestTitle"),s=document.getElementById("newsDigestSummary"),c=document.getElementById("newsCount"),g=document.getElementById("newsGenerated");
  if(t)t.textContent=NEWS_WEEKLY.digestTitle||"이번 주 영화뉴스";
  if(s)s.textContent=NEWS_WEEKLY.digestSummary||"주간 요약을 준비 중입니다.";
  if(c)c.textContent=(NEWS_WEEKLY.items||[]).filter(x=>x.translationStatus==="translated-reviewed"&&x.titleKo&&x.summaryKo).length+"개 한글 기사";
  if(g)g.textContent=NEWS_WEEKLY.generatedAt?new Intl.DateTimeFormat("ko-KR",{dateStyle:"medium"}).format(new Date(NEWS_WEEKLY.generatedAt)):"";
  renderFestivalTracker();renderCinemaTracker();renderLocalArtsTracker();renderNewsCards();
}
initV06();
