let shareAssets={}, editorial={};
const watched=()=>JSON.parse(localStorage.getItem("indiePohangWatched")||"[]");
const saveWatched=a=>localStorage.setItem("indiePohangWatched",JSON.stringify(a));
const profile=()=>JSON.parse(localStorage.getItem("indiePohangProfile")||"{}");
const saveProfile=p=>localStorage.setItem("indiePohangProfile",JSON.stringify(p));

function todayISO(){return new Date().toISOString().slice(0,10)}
function markWatched(code,date=todayISO()){
  const list=watched(), idx=list.findIndex(x=>x.code===code);
  if(idx>=0) list[idx].date=date; else list.push({code,date});
  saveWatched(list); renderCinemaDiary(); updateWatchedButton(code); toast("내 영화수첩에 기록했습니다.");
}
function unmarkWatched(code){
  saveWatched(watched().filter(x=>x.code!==code)); renderCinemaDiary(); updateWatchedButton(code);
}
function updateWatchedButton(code){
  const b=document.getElementById("detailWatched"); if(!b)return;
  const on=watched().some(x=>x.code===code); b.textContent=on?"✓ 봤어요":"＋ 봤어요"; b.classList.toggle("on",on);
}
function dailySeed(){return Number(new Date().toISOString().slice(0,10).replaceAll("-",""))}
function dailyPickCode(){
  const upcoming=allSessions().filter(isUpcoming); if(!upcoming.length)return Object.keys(MOVIES)[0];
  return upcoming[dailySeed()%upcoming.length].code;
}
function similarMovies(code,limit=3){
  const base=MOVIES[code]; if(!base)return [];
  const tokenize=s=>new Set(String(s||"").toLowerCase().replace(/[^0-9a-zA-Z가-힣 ]/g," ").split(/\s+/).filter(x=>x.length>1));
  const baseTokens=tokenize([base.short,base.synopsis,base.director,base.actors,(base.meta||[]).join(" ")].join(" "));
  return Object.entries(MOVIES).filter(([c])=>c!==code).map(([c,m])=>{
    const t=tokenize([m.short,m.synopsis,m.director,m.actors,(m.meta||[]).join(" ")].join(" "));
    let score=0; for(const x of baseTokens)if(t.has(x))score++;
    if(base.director&&m.director===base.director)score+=8;
    if(base.meta&&m.meta) for(const x of base.meta) if(m.meta.includes(x))score+=2;
    return {code:c,score};
  }).sort((a,b)=>b.score-a.score).slice(0,limit);
}
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src})}
function coverDraw(ctx,img,x,y,w,h){
  const r=Math.max(w/img.width,h/img.height),sw=w/r,sh=h/r,sx=(img.width-sw)/2,sy=(img.height-sh)/2;
  ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
}
function wrapLines(ctx,text,maxWidth,maxLines=8){
  const words=String(text||"").split(/\s+/),lines=[];let line="";
  for(const word of words){const test=line?line+" "+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;if(lines.length>=maxLines)break}else line=test}
  if(lines.length<maxLines&&line)lines.push(line);return lines;
}
async function makeShareBlob(code,format="feed",customText=""){
  const m=MOVIES[code],dims=format==="story"?[1080,1920]:format==="square"?[1080,1080]:[1080,1350];
  const [w,h]=dims,canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d");
  ctx.fillStyle="#090a0b";ctx.fillRect(0,0,w,h);
  const asset=shareAssets[code]||{},src=asset.still||asset.poster||m.still||m.poster;
  if(src){try{const img=await loadImage(src);coverDraw(ctx,img,0,0,w,Math.round(h*.63))}catch(e){console.warn(e)}}
  const grad=ctx.createLinearGradient(0,h*.35,0,h);grad.addColorStop(0,"rgba(9,10,11,0)");grad.addColorStop(.35,"rgba(9,10,11,.78)");grad.addColorStop(1,"rgba(9,10,11,1)");ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  const pad=Math.round(w*.075),baseY=Math.round(h*.61);
  ctx.fillStyle="#d8ff43";ctx.font="900 "+Math.round(w*.026)+"px Pretendard, sans-serif";ctx.fillText("INDIE PORT · from INDIEPLUS POHANG",pad,baseY);
  ctx.fillStyle="#f7f7f2";ctx.font="900 "+Math.round(w*.064)+"px Pretendard, sans-serif";const titleLines=wrapLines(ctx,m.title,w-pad*2,2);titleLines.forEach((line,i)=>ctx.fillText(line,pad,baseY+88+i*74));
  const quote=customText||editorial.oneLiners?.[code]||m.short||"";
  ctx.font="700 "+Math.round(w*.035)+"px Pretendard, sans-serif";ctx.fillStyle="#e2e4df";const qLines=wrapLines(ctx,"“"+quote+"”",w-pad*2,format==="story"?8:5);let qy=baseY+88+titleLines.length*74+46;qLines.forEach((line,i)=>ctx.fillText(line,pad,qy+i*50));
  ctx.fillStyle="#8d949e";ctx.font="600 "+Math.round(w*.021)+"px Pretendard, sans-serif";ctx.fillText("포항에서 영화를 발견하고 기록하다",pad,h-pad);
  return await new Promise(resolve=>canvas.toBlob(resolve,"image/png",.95));
}
async function shareMovieCard(code,format="feed",customText=""){
  const blob=await makeShareBlob(code,format,customText),m=MOVIES[code];
  const file=new File([blob],"indie-pohang-"+code+"-"+format+".png",{type:"image/png"});
  const text=m.title+" — INDIE PORT";
  if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({title:m.title,text,files:[file]});return}catch(e){if(e.name==="AbortError")return}}
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast("공유카드를 이미지로 저장했습니다.");
}
function renderCinemaDiary(){
  const section=document.getElementById("my"); if(!section)return;
  let diary=document.getElementById("cinemaDiary");
  if(!diary){
    diary=document.createElement("div");diary.id="cinemaDiary";diary.className="cinema-diary";
    section.appendChild(diary);
  }
  const list=watched().slice().sort((a,b)=>b.date.localeCompare(a.date));
  const year=new Date().getFullYear(), yearly=list.filter(x=>x.date.startsWith(String(year))).length;
  diary.innerHTML='<div class="diary-head"><div><div class="kicker">MY CINEMA DIARY</div><h3>내가 본 영화 수첩</h3><p>'+year+'년 '+yearly+'편 · 전체 '+list.length+'편</p></div></div>'+
    (list.length?'<div class="diary-grid">'+list.map(x=>{const m=MOVIES[x.code]||{};return '<article class="diary-card" onclick="openMovie(\''+x.code+'\')"><img src="'+(m.poster||'')+'" alt=""><div><b>'+esc(m.title||x.code)+'</b><label onclick="event.stopPropagation()">관람일 <input type="date" value="'+x.date+'" onchange="markWatched(\''+x.code+'\',this.value)"></label><button onclick="event.stopPropagation();unmarkWatched(\''+x.code+'\')">기록 삭제</button></div></article>'}).join('')+'</div>':'<div class="empty">아직 본 영화 기록이 없습니다. 영화 상세에서 ‘봤어요’를 눌러보세요.</div>');
}
function renderDaily(){
  const code=dailyPickCode(),m=MOVIES[code];if(!m)return;
  const line=editorial.oneLiners?.[code]||m.short||"";
  const titleEl=document.getElementById("dailyLineMovie"),lineEl=document.getElementById("dailyLineText");
  if(titleEl)titleEl.textContent=m.title;if(lineEl)lineEl.textContent=line;
  const open=document.getElementById("dailyLineOpen");if(open)open.onclick=()=>openMovie(code);
  const p=document.getElementById("dailyPickPoster");if(p){p.src=m.poster||"";p.alt=m.title+" 포스터"}
  const t=document.getElementById("dailyPickTitle");if(t)t.textContent=m.title;
  const reason=document.getElementById("dailyPickReason");if(reason){const s=nextSession(code);reason.textContent=s?"오늘의 추천 · 다음 상영 "+fmtDate(s.date)+" "+s.start+" · "+s.minutes+"분":m.short}
  const info=document.getElementById("dailyPickInfo");if(info)info.onclick=()=>openMovie(code);
  const book=document.getElementById("dailyPickBook"),s=nextSession(code);if(book)book.href=s?sessionBook(s):bookMovie(code);
}
function renderSimilar(code){
  const root=document.getElementById("similarMovies");if(!root)return;
  root.innerHTML=similarMovies(code).map(x=>{const m=MOVIES[x.code];return '<button onclick="openMovie(\''+x.code+'\')"><img src="'+(m.poster||'')+'" alt=""><span><b>'+esc(m.title)+'</b><small>'+esc(m.director||m.eng||'')+'</small></span></button>'}).join('')||'<p class="muted">추천할 비슷한 영화가 아직 없습니다.</p>';
}
function renderDirectorWorks(code){
  const root=document.getElementById("directorWorks");if(!root)return;
  const m=MOVIES[code],d=editorial.directorWorks?.[m?.director];
  if(!d){root.innerHTML='<p class="muted">감독 전작 정보를 준비 중입니다.</p>';return}
  root.innerHTML='<p>'+esc(d.note||"")+'</p>'+(d.works?.length?'<div class="works-row">'+d.works.map(w=>'<span><b>'+esc(w.title)+'</b><small>'+esc(w.year||'')+'</small></span>').join('')+'</div>':'<div class="muted">확인된 대표 전작 데이터를 보강 중입니다.</div>');
}
function enhanceDetailUI(){
  const actions=document.querySelector(".detail-actions");if(!actions)return;
  if(!document.getElementById("detailWatched")){
    actions.insertAdjacentHTML("beforeend",'<button class="ghostbtn" id="detailWatched">＋ 봤어요</button><button class="ghostbtn" id="detailShare">공유카드</button>');
    document.getElementById("detailWatched").onclick=()=>activeMovieCode&&markWatched(activeMovieCode);
    document.getElementById("detailShare").onclick=()=>openSharePanel(activeMovieCode);
  }
  const sheet=document.querySelector(".sheet");
  if(!document.getElementById("similarMovies"))sheet.insertAdjacentHTML("beforeend",'<section class="detail-extra"><div><div class="kicker">SIMILAR MOVIES</div><h3>비슷한 영화</h3><div id="similarMovies" class="similar-row"></div></div><div><div class="kicker">DIRECTOR FILMOGRAPHY</div><h3>감독의 전작</h3><div id="directorWorks" class="director-works"></div></div></section>');
}
function latestReviewText(code){
  const list=reviews().filter(x=>x.code===code);return list.length?list[list.length-1].text:"";
}
let shareFormat="feed",sharePreviewUrl="";
function openSharePanel(code){
  activeMovieCode=code;let panel=document.getElementById("sharePanel");
  if(!panel){
    panel=document.createElement("div");panel.id="sharePanel";panel.className="share-panel";
    panel.innerHTML='<div class="share-sheet"><button class="close" id="closeShare">×</button><div class="kicker">SOCIAL SHARE CARD</div><h2>영화 기록을 멋지게 공유</h2><p>영화 스틸과 내 문장을 자동으로 조합합니다.</p><div class="share-formats"><button data-format="feed" class="on">4:5 피드</button><button data-format="story">9:16 스토리</button><button data-format="square">1:1 정사각</button></div><textarea id="shareText" maxlength="240"></textarea><div class="share-preview"><img id="sharePreview" alt="공유카드 미리보기"></div><div class="share-actions"><button class="primary" id="nativeShare">SNS로 공유</button><button class="ghostbtn" id="saveShareImage">이미지 저장</button></div><small>모바일 공유 시트에서 Instagram·카카오톡·메시지 등 설치된 앱을 선택할 수 있습니다.</small></div>';
    document.body.appendChild(panel);
    document.getElementById("closeShare").onclick=()=>panel.classList.remove("open");
    panel.addEventListener("click",e=>{if(e.target===panel)panel.classList.remove("open")});
    panel.querySelectorAll("[data-format]").forEach(b=>b.onclick=()=>{panel.querySelectorAll("[data-format]").forEach(x=>x.classList.remove("on"));b.classList.add("on");shareFormat=b.dataset.format;refreshSharePreview()});
    document.getElementById("shareText").addEventListener("input",()=>{clearTimeout(window.__shareDebounce);window.__shareDebounce=setTimeout(refreshSharePreview,260)});
    document.getElementById("nativeShare").onclick=()=>shareMovieCard(activeMovieCode,shareFormat,document.getElementById("shareText").value.trim());
    document.getElementById("saveShareImage").onclick=()=>downloadShareCard(activeMovieCode,shareFormat,document.getElementById("shareText").value.trim());
  }
  const m=MOVIES[code];document.getElementById("shareText").value=latestReviewText(code)||editorial.oneLiners?.[code]||m.short||"";
  shareFormat="feed";panel.querySelectorAll("[data-format]").forEach(x=>x.classList.toggle("on",x.dataset.format==="feed"));
  panel.classList.add("open");refreshSharePreview();
}
async function refreshSharePreview(){
  if(!activeMovieCode)return;const blob=await makeShareBlob(activeMovieCode,shareFormat,document.getElementById("shareText")?.value.trim()||"");
  if(sharePreviewUrl)URL.revokeObjectURL(sharePreviewUrl);sharePreviewUrl=URL.createObjectURL(blob);const img=document.getElementById("sharePreview");if(img)img.src=sharePreviewUrl;
}
async function downloadShareCard(code,format,text){
  const blob=await makeShareBlob(code,format,text),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="indie-pohang-"+code+"-"+format+".png";a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast("공유카드를 저장했습니다.");
}
function renderAccountPanel(){
  const my=document.getElementById("my");if(!my||document.getElementById("accountPanel"))return;
  const box=document.createElement("section");box.id="accountPanel";box.className="account-panel";
  box.innerHTML='<div><div class="kicker">ACCOUNT SYNC</div><h3>SNS 계정 연결</h3><p>현재 기록은 이 기기에 저장됩니다. OAuth 키가 연결되면 Google·Kakao·Naver 계정으로 동기화할 수 있게 준비되어 있습니다.</p></div><div class="social-login-row"><button data-social="google">G Google</button><button data-social="kakao">K Kakao</button><button data-social="naver">N Naver</button></div><small id="authState">기기 저장 모드</small>';
  my.appendChild(box);
  box.querySelectorAll("[data-social]").forEach(b=>b.onclick=()=>toast(b.dataset.social.toUpperCase()+" 로그인은 발급 키 연결 후 즉시 활성화됩니다."));
}
async function initV04(){
  try{
    const [e,a]=await Promise.all([
      fetch("./data/editorial.json?v="+Date.now()).then(r=>r.ok?r.json():{}),
      fetch("./data/share-assets.json?v="+Date.now()).then(r=>r.ok?r.json():{})
    ]);
    editorial=e||{};shareAssets=a||{};
  }catch(e){console.warn("v04 data",e)}
  let tries=0;
  const wait=setInterval(()=>{
    tries++;
    if(live&&Object.keys(MOVIES||{}).length){
      clearInterval(wait);
      enhanceDetailUI();renderDaily();renderCinemaDiary();renderAccountPanel();
      const original=openMovie;
      openMovie=function(code,title=""){
        original(code,title);setTimeout(()=>{updateWatchedButton(code);renderSimilar(code);renderDirectorWorks(code)},0);
      };
      const watchedBtn=document.getElementById("detailWatched");
      if(watchedBtn)watchedBtn.onclick=()=>{if(!activeMovieCode)return;watched().some(x=>x.code===activeMovieCode)?unmarkWatched(activeMovieCode):markWatched(activeMovieCode)};
    }
    if(tries>80)clearInterval(wait);
  },100);
}
initV04();
