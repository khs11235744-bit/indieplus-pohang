const CINEMA="000057";
const DTRYX="https://www.dtryx.com";
let MOVIES={};
let live=null;
let programs=null;
let selectedDate="";
let activeMovieCode="";
let deferredInstall=null;

const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const fmtDate=d=>new Intl.DateTimeFormat("ko-KR",{month:"long",day:"numeric",weekday:"short"}).format(new Date(`${d}T12:00:00+09:00`));
const watch=()=>JSON.parse(localStorage.getItem("indiePohangWatch")||"[]");
const saveWatch=a=>localStorage.setItem("indiePohangWatch",JSON.stringify(a));
const reviews=()=>JSON.parse(localStorage.getItem("indiePohangReviews")||"[]");
const saveReviews=a=>localStorage.setItem("indiePohangReviews",JSON.stringify(a));
const esc=s=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const movieFor=(code,title="")=>MOVIES[code]||{code,title:title||"상영작",short:"Dtryx 공개 영화정보를 불러오지 못했습니다.",synopsis:"",poster:"",director:"",actors:"",trailer:""};

function toast(msg){
  const el=$("#toast");
  el.textContent=msg;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer=setTimeout(()=>el.classList.remove("show"),2200);
}
function toggleWatch(code,e){
  e?.stopPropagation();
  const saved=watch();
  const idx=saved.indexOf(code);
  idx>=0?saved.splice(idx,1):saved.push(code);
  saveWatch(saved);
  renderDiscover();
  renderMy();
  updateDetailWatch(code);
  toast(idx>=0?"보고 싶어요에서 뺐습니다.":"보고 싶어요에 저장했습니다.");
}

function allSessions(){
  return (live?.days||[]).flatMap(d=>d.sessions.map(s=>({...s,date:d.date})))
    .sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
}
function isUpcoming(s){return new Date(`${s.date}T${s.start}:00+09:00`).getTime()>=Date.now();}
function movieSessions(code){return allSessions().filter(s=>s.code===code);}
function nextSession(code){return movieSessions(code).find(isUpcoming)||null;}
function nextGlobalSession(){return allSessions().find(isUpcoming)||null;}

function sessionBook(s){
  const q=new URLSearchParams({CinemaCd:CINEMA,MovieCd:s.code,PlaySDT:s.date,ScreenCd:s.screenCode||"01",ShowSeq:String(s.showSeq||1)});
  return `${DTRYX}/reserve/movie.do?${q}`;
}
function bookMovie(code){return `${DTRYX}/reserve/movie.do?CinemaCd=${CINEMA}&MovieCd=${code}`;}
function updateDetailWatch(code){
  const btn=$("#detailWatch");
  if(!btn)return;
  const on=watch().includes(code);
  btn.textContent=on?"♥ 보고 싶어요 저장됨":"♡ 보고 싶어요";
  btn.classList.toggle("on",on);
}

function openMovie(code,title=""){
  const m=movieFor(code,title);
  const s=nextSession(code);
  activeMovieCode=code;
  $("#detailPoster").src=m.poster||"";
  $("#detailPoster").alt=m.poster?`${m.title} 포스터`:"포스터 없음";
  $("#detailPoster").classList.toggle("missing",!m.poster);
  $("#detailTitle").textContent=m.title;
  $("#detailEng").textContent=m.eng||"";
  $("#detailShort").textContent=m.short||"";
  $("#detailSynopsis").textContent=m.synopsis||"상세 줄거리 정보가 없습니다.";
  $("#detailPeople").textContent=[m.director&&`감독 ${m.director}`,m.actors&&`출연 ${m.actors}`].filter(Boolean).join(" · ");
  $("#detailNext").textContent=s?`${fmtDate(s.date)} ${s.start} · ${s.minutes}분 · ${s.age}`:"현재 공개된 다음 상영 회차 없음";
  $("#detailBook").href=s?sessionBook(s):bookMovie(code);
  $("#detailTrailer").hidden=!m.trailer;
  $("#detailTrailer").onclick=()=>m.trailer&&window.open(m.trailer,"_blank","noopener");
  $("#reviewInput").value="";
  updateDetailWatch(code);
  $("#searchPanel")?.classList.remove("open");
  $("#movieOverlay").classList.add("open");
}
function closeMovie(){$("#movieOverlay").classList.remove("open");}
function renderHero(){
  const first=nextGlobalSession();
  if(!first)return;
  const m=movieFor(first.code,first.title);
  $("#heroBackdrop").style.backgroundImage=m.poster||m.still?`url("${m.poster||m.still}")`:"none";
  $("#heroTitle").textContent=m.title;
  $("#heroDesc").textContent=m.short||"Dtryx 공개 상영작";
  $("#heroMeta").textContent=`다음 상영 · ${fmtDate(first.date)} ${first.start} · ${first.minutes}분`;
  $("#heroInfo").onclick=()=>openMovie(first.code,first.title);
  $("#heroBook").href=sessionBook(first);
}

function renderDates(){
  const root=$("#dateTabs");
  root.innerHTML="";
  (live?.days||[]).forEach(d=>{
    const btn=document.createElement("button");
    btn.className="day "+((selectedDate||live.days[0]?.date)===d.date?"active":"");
    const dt=new Date(`${d.date}T12:00:00+09:00`);
    const weekday=new Intl.DateTimeFormat("ko-KR",{weekday:"short"}).format(dt);
    btn.innerHTML=`<small>${weekday}</small><strong>${dt.getMonth()+1}/${dt.getDate()}</strong><small>${d.sessions.length}편</small>`;
    btn.onclick=()=>{selectedDate=d.date;renderDates();renderSessions();};
    root.appendChild(btn);
  });
}

function renderSessions(){
  const day=(live?.days||[]).find(d=>d.date===(selectedDate||live.days[0]?.date));
  const root=$("#sessions");
  if(!day){root.innerHTML='<div class="empty">확인된 상영 일정이 없습니다.</div>';return;}
  root.innerHTML=day.sessions.map(s=>{
    const m=movieFor(s.code,s.title);
    const seat=s.availableSeats!=null?` · 잔여 ${s.availableSeats}석`:"";
    const poster=m.poster?`<img class="thumb" loading="lazy" src="${m.poster}" alt="${esc(m.title)} 포스터">`:'<div class="thumb poster-empty">NO POSTER</div>';
    return `<article class="session" onclick="openMovie('${s.code}','${esc(s.title)}')">${poster}<div><div class="micro">${esc(s.age||"")} · ${s.minutes||""}분${seat}</div><h3>${esc(s.title)}</h3><p>${esc(m.short||"Dtryx 공개 상영작")}</p><div class="session-bottom"><strong>${esc(s.start)}</strong><span>→ ${esc(s.end||"")}</span><a class="mini book" href="${sessionBook({...s,date:day.date})}" target="_blank" rel="noopener" onclick="event.stopPropagation()">예매</a></div></div></article>`;
  }).join("");
}

function renderDiscover(){
  const root=$("#posterGrid"), saved=watch();
  const entries=Object.entries(MOVIES).sort(([a],[b])=>{
    const sa=nextSession(a), sb=nextSession(b);
    if(sa&&sb)return (sa.date+sa.start).localeCompare(sb.date+sb.start);
    if(sa)return -1;if(sb)return 1;return MOVIES[a].title.localeCompare(MOVIES[b].title,"ko");
  });
  root.innerHTML=entries.map(([code,m])=>{
    const s=nextSession(code);
    const when=s?`${fmtDate(s.date)} ${s.start}`:"현재 공개 회차 없음";
    const poster=m.poster?`<img loading="lazy" src="${m.poster}" alt="${esc(m.title)} 포스터">`:'<div class="poster-empty large">NO POSTER</div>';
    return `<article class="poster-card" onclick="openMovie('${code}')"><div class="poster-wrap">${poster}<button class="heart ${saved.includes(code)?"on":""}" aria-label="보고 싶어요" onclick="toggleWatch('${code}',event)">♥</button></div><div class="poster-copy"><small>${esc(m.director?"감독 "+m.director:"Dtryx 공개 영화정보")}</small><h3>${esc(m.title)}</h3><p>${esc(m.short||"")}</p><div class="poster-next"><span>${esc(when)}</span><span>영화정보 →</span></div></div></article>`;
  }).join("");
}
fetch("./data/movies.json?v="+Date.now()).then(r=>r.ok?r.json():null).then(pack=>{if(!pack?.movies)return;for(const [code,m] of Object.entries(pack.movies)){const keepShort=MOVIES[code]?.short||m.short;MOVIES[code]={...(MOVIES[code]||{}),...m,short:keepShort}}if(live){renderHero();renderDiscover();renderMy()}}).catch(()=>{});
function renderMy(){
  const ids=watch(), root=$("#myList");
  root.innerHTML=ids.length?ids.map(code=>{
    const m=movieFor(code);
    return `<button onclick="openMovie('${code}')">${m.poster?`<img src="${m.poster}" alt="">`:""}<span>${esc(m.title)}</span></button>`;
  }).join(""):'<p class="muted">아직 저장한 영화가 없습니다. 포스터의 ♥를 눌러보세요.</p>';
}

function renderCommunity(){
  const root=$("#communityFeed");
  if(!root)return;
  const items=reviews().slice().reverse().slice(0,6);
  root.innerHTML=items.length?items.map(r=>{
    const m=movieFor(r.code);
    return `<article class="review-line"><small>${esc(m.title)} · ${esc(r.at)}</small><p>${esc(r.text)}</p></article>`;
  }).join(""):'<div class="empty compact-empty">아직 이 기기에 저장된 관객 문장이 없습니다.</div>';
}

function saveCurrentReview(){
  const text=$("#reviewInput").value.trim();
  if(!activeMovieCode||!text)return toast("한 줄 감상을 입력해주세요.");
  const list=reviews();
  list.push({code:activeMovieCode,text:text.slice(0,240),at:new Intl.DateTimeFormat("ko-KR",{month:"numeric",day:"numeric"}).format(new Date())});
  saveReviews(list.slice(-50));
  $("#reviewInput").value="";
  renderCommunity();
  toast("이 기기에 관객 문장을 저장했습니다.");
}

function runSearch(){
  const q=$("#searchInput").value.trim().toLowerCase();
  const results=Object.entries(MOVIES).filter(([,m])=>[m.title,m.eng,m.director,m.actors,m.short].join(" ").toLowerCase().includes(q));
  $("#searchResults").innerHTML=q?results.map(([code,m])=>`<button onclick="openMovie('${code}')">${m.poster?`<img src="${m.poster}" alt="">`:""}<span><b>${esc(m.title)}</b><small>${esc(m.director||m.eng||"")}</small></span></button>`).join(""):"";
}
function renderPrograms(){
  const status=$("#programStatus"), updated=$("#programUpdated");
  if(status)status.textContent=programs?.note||"Dtryx 공개 극장 메인 페이지의 프로그램 정보를 확인 중입니다.";
  if(updated)updated.textContent=programs?.updated?`확인 ${programs.updated}`:"";
}

async function fetchJson(url,required=true){
  const res=await fetch(`${url}?v=${Date.now()}`);
  if(!res.ok){if(required)throw new Error(`${url} ${res.status}`);return null;}
  return res.json();
}

async function boot(){
  try{
    const [scheduleData,movieData,programData]=await Promise.all([
      fetchJson("./data/live.json"),fetchJson("./data/movies.json"),fetchJson("./data/programs.json",false)
    ]);
    live=scheduleData;
    MOVIES=movieData?.movies||{};
    programs=programData;
    selectedDate=live.days?.[0]?.date||"";
    $("#updatedAt").textContent=live.updated||"공개 예매정보 기준";
    renderHero();renderDates();renderSessions();renderDiscover();renderMy();renderCommunity();renderPrograms();
  }catch(e){
    console.error(e);
    $("#sessions").innerHTML='<div class="empty">실제 상영정보를 불러오지 못했습니다. 공식 예매 페이지에서 최신 일정을 확인해주세요.</div>';
    $("#posterGrid").innerHTML='<div class="empty">영화정보 동기화에 실패했습니다.</div>';
  }
}
$("#searchInput")?.addEventListener("input",runSearch);
$("#searchBtn")?.addEventListener("click",()=>{
  $("#searchPanel").classList.toggle("open");
  if($("#searchPanel").classList.contains("open"))$("#searchInput").focus();
});
$("#closeSearch")?.addEventListener("click",()=>$("#searchPanel").classList.remove("open"));
$("#movieOverlay")?.addEventListener("click",e=>{if(e.target.id==="movieOverlay")closeMovie();});
$("#closeMovie")?.addEventListener("click",closeMovie);
$("#detailWatch")?.addEventListener("click",()=>activeMovieCode&&toggleWatch(activeMovieCode));
$("#saveReview")?.addEventListener("click",saveCurrentReview);
$$('[data-scroll]').forEach(b=>b.addEventListener("click",()=>document.getElementById(b.dataset.scroll)?.scrollIntoView({behavior:"smooth"})));
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){closeMovie();$("#searchPanel")?.classList.remove("open");}
});
window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();deferredInstall=e;$("#installBtn").hidden=false;
});
$("#installBtn")?.addEventListener("click",async()=>{
  if(!deferredInstall)return toast("브라우저 메뉴에서 홈 화면에 추가할 수 있습니다.");
  deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("#installBtn").hidden=true;
});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(console.error));
boot();
