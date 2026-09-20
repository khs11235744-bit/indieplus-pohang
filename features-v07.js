let CINE_TIPS=null,cineTipCursor=0;
const cineSaved=()=>JSON.parse(localStorage.getItem("indiePortCineTipsSaved")||"[]");
const saveCineSaved=a=>localStorage.setItem("indiePortCineTipsSaved",JSON.stringify(a));

function cineDayIndex(){
  const key=Number(new Date().toISOString().slice(0,10).replaceAll("-",""));
  return CINE_TIPS?.tips?.length?key%CINE_TIPS.tips.length:0;
}
function currentCineTip(){
  const arr=CINE_TIPS?.tips||[];if(!arr.length)return null;
  return arr[(cineDayIndex()+cineTipCursor+arr.length)%arr.length];
}
function toggleCineTipSave(id){
  const a=cineSaved(),i=a.indexOf(id);i>=0?a.splice(i,1):a.push(id);saveCineSaved(a);renderCineTip();
}
function cineTipMovie(){
  const code=typeof dailyPickCode==="function"?dailyPickCode():Object.keys(MOVIES||{})[0];
  return code&&MOVIES?.[code]?{code,movie:MOVIES[code]}:null;
}
function renderCineTip(){
  const t=currentCineTip();if(!t)return;
  const saved=cineSaved().includes(t.id),movie=cineTipMovie();
  const cat=document.getElementById("cineTipCategory"),text=document.getElementById("cineTipText"),mission=document.getElementById("cineTipMission"),src=document.getElementById("cineTipSource"),save=document.getElementById("cineTipSave"),apply=document.getElementById("cineTipApply");
  if(cat)cat.textContent=t.category;if(text)text.textContent=t.tip;if(mission)mission.textContent=t.mission;if(src)src.textContent="교재 기반 · "+t.source;if(save)save.textContent=saved?"★ 저장됨":"☆ 저장";
  if(apply){
    apply.textContent=movie?movie.movie.title+"에서 찾아보기 →":"현재 상영작에 적용 →";
    apply.onclick=()=>movie&&openMovie(movie.code);
  }
}
function shareCineTip(){
  const t=currentCineTip();if(!t)return;
  const text="오늘의 시네필 렌즈\n"+t.tip+"\n미션: "+t.mission+"\n— INDIE PORT";
  if(navigator.share){navigator.share({title:"오늘의 시네필 렌즈",text}).catch(()=>{})}
  else navigator.clipboard?.writeText(text).then(()=>toast("시네필 팁을 복사했습니다."));
}
function injectCinephileLens(){
  if(document.getElementById("cinephileLens"))return;
  const daily=document.getElementById("daily"),anchor=daily||document.getElementById("schedule");if(!anchor)return;
  const sec=document.createElement("section");sec.id="cinephileLens";sec.className="wrap section cine-lens";
  sec.innerHTML='<article class="cine-tip-card"><div class="cine-tip-head"><div><div class="kicker">DAILY CINEPHILE LENS</div><span id="cineTipCategory" class="cine-tip-cat"></span></div><div class="cine-tip-count">100개의 보는 법</div></div>'+
    '<blockquote id="cineTipText">오늘의 시네필 팁을 고르는 중입니다.</blockquote>'+
    '<div class="cine-tip-mission"><b>30초 관찰 미션</b><span id="cineTipMission"></span></div>'+
    '<div class="cine-tip-footer"><small id="cineTipSource"></small><div><button class="text-button" id="cineTipPrev">이전</button><button class="text-button" id="cineTipNext">다른 팁</button><button class="text-button" id="cineTipSave">☆ 저장</button><button class="text-button" id="cineTipShare">공유</button></div></div>'+
    '<button class="cine-apply" id="cineTipApply">현재 상영작에 적용 →</button></article>'+
    '<article class="cine-lab-card"><div class="kicker">CINEPHILE LAB</div><h3>영화를 더 잘 보는 법은<br>개념보다 질문에서 시작합니다.</h3><p>구도·렌즈·편집·사운드·장르·서사·영화사·비평을 매일 하나씩. 팁을 외우지 말고 오늘 보는 영화에서 직접 찾아보세요.</p><button class="ghostbtn" id="cineTipLibrary">100개 팁 둘러보기</button></article>';
  anchor.insertAdjacentElement("afterend",sec);
  document.getElementById("cineTipPrev").onclick=()=>{cineTipCursor--;renderCineTip()};
  document.getElementById("cineTipNext").onclick=()=>{cineTipCursor++;renderCineTip()};
  document.getElementById("cineTipSave").onclick=()=>{const t=currentCineTip();t&&toggleCineTipSave(t.id)};
  document.getElementById("cineTipShare").onclick=shareCineTip;
  document.getElementById("cineTipLibrary").onclick=openCineTipLibrary;
}
function openCineTipLibrary(){
  let panel=document.getElementById("cineTipLibraryPanel");
  if(!panel){
    panel=document.createElement("div");panel.id="cineTipLibraryPanel";panel.className="share-panel";
    panel.innerHTML='<div class="share-sheet cine-library-sheet"><button class="close" id="closeCineLibrary">×</button><div class="kicker">CINEPHILE LENS 100</div><h2>100개의 영화 보는 법</h2><p>교재의 개념을 짧은 관찰 질문으로 바꾼 라이브러리입니다.</p><div class="cine-library-filter" id="cineLibraryFilter"></div><div class="cine-library-list" id="cineLibraryList"></div></div>';
    document.body.appendChild(panel);document.getElementById("closeCineLibrary").onclick=()=>panel.classList.remove("open");panel.addEventListener("click",e=>{if(e.target===panel)panel.classList.remove("open")});
  }
  const cats=["전체",...new Set((CINE_TIPS?.tips||[]).map(x=>x.category))];
  document.getElementById("cineLibraryFilter").innerHTML=cats.map((c,i)=>'<button data-cinecat="'+esc(c)+'" class="'+(i?"":"on")+'">'+esc(c)+'</button>').join("");
  panel.querySelectorAll("[data-cinecat]").forEach(b=>b.onclick=()=>{panel.querySelectorAll("[data-cinecat]").forEach(x=>x.classList.toggle("on",x===b));renderCineLibrary(b.dataset.cinecat)});
  renderCineLibrary("전체");panel.classList.add("open");
}
function renderCineLibrary(cat){
  const root=document.getElementById("cineLibraryList");if(!root)return;const saved=cineSaved();
  const arr=(CINE_TIPS?.tips||[]).filter(x=>cat==="전체"||x.category===cat);
  root.innerHTML=arr.map(t=>'<article><div><span>'+esc(t.category)+'</span><small>#'+t.id+' · '+esc(t.source)+'</small></div><b>'+esc(t.tip)+'</b><p>미션 · '+esc(t.mission)+'</p><button onclick="toggleCineTipSave('+t.id+');renderCineLibrary(\''+esc(cat)+'\')">'+(saved.includes(t.id)?"★":"☆")+'</button></article>').join("");
}
async function initV07(){
  try{CINE_TIPS=await fetch("./data/cinephile-tips.json?v="+Date.now()).then(r=>r.ok?r.json():null)}catch(e){console.warn("cinephile tips",e)}
  if(!CINE_TIPS)return;injectCinephileLens();renderCineTip();
}
initV07();
