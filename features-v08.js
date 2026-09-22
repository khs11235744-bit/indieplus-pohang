const magazineV2=()=>JSON.parse(localStorage.getItem("indiePortMagazineV2")||"[]");
const saveMagazineV2=a=>localStorage.setItem("indiePortMagazineV2",JSON.stringify(a));
const magAdminEnabled=()=>localStorage.getItem("indiePortMagazineAdmin")==="1";
const setMagAdminEnabled=v=>localStorage.setItem("indiePortMagazineAdmin",v?"1":"0");
const magAdminOverrides=()=>JSON.parse(localStorage.getItem("indiePortMagazineAdminOverrides")||"{}");
const saveMagAdminOverrides=v=>localStorage.setItem("indiePortMagazineAdminOverrides",JSON.stringify(v));
function adminOverrideFor(id){return magAdminOverrides()[id]||null}
function setAdminOverride(id,item){const all=magAdminOverrides();all[id]=item;saveMagAdminOverrides(all)}
function clearAdminOverride(id){const all=magAdminOverrides();delete all[id];saveMagAdminOverrides(all)}
const magAdminHistory=()=>JSON.parse(localStorage.getItem("indiePortMagazineAdminHistory")||"{}");
const saveMagAdminHistory=v=>localStorage.setItem("indiePortMagazineAdminHistory",JSON.stringify(v));
function pushAdminHistory(id,item){
  if(!id||!item)return;const h=magAdminHistory(),arr=h[id]||[];arr.push({...item,_historyAt:new Date().toISOString()});h[id]=arr.slice(-10);saveMagAdminHistory(h);
}
function restoreAdminHistoryV2(){
  if(!MAG_STUDIO.id)return;const h=magAdminHistory(),arr=h[MAG_STUDIO.id]||[];if(!arr.length)return toast("복원할 이전 버전이 없습니다.");
  const prev=arr.pop();h[MAG_STUDIO.id]=arr;saveMagAdminHistory(h);setAdminOverride(MAG_STUDIO.id,prev);upsertMagazineV2(prev);openMagazineStudioV2(MAG_STUDIO.id);toast("이전 관리자 버전을 복원했습니다.");
}
let MAG_STUDIO={code:null,id:null,preset:"journal",format:"feed",stills:[0],rating:0,tags:[],stamp:"",stampCustom:"",textAlign:"left",fontScale:1,slides:[],cardManual:false,cardEdits:[],cardActiveEdit:1};
let MAGAZINE_COLLECTION_META=null;
let ANNUAL_VIEW={mode:"scroll",page:0,swipeStart:null};
function openPanelV08(panel){
  if(!panel)return;
  panel.dataset.returnY=String(window.scrollY||0);
  panel.classList.add("open");
}
function closePanelV08(panel){
  if(!panel)return;
  const y=Number(panel.dataset.returnY||0);
  panel.classList.remove("open");
  requestAnimationFrame(()=>window.scrollTo(0,y));
}
if(!window.__indiePortEscapeExit){
  window.__indiePortEscapeExit=true;
  window.addEventListener("keydown",e=>{
    if(e.key!=="Escape")return;
    const open=[...document.querySelectorAll(".share-panel.open")].pop();
    if(open){e.preventDefault();closePanelV08(open);}
  });
}

function splitReviewForCards(text,max=5){
  const clean=String(text||"").trim();if(!clean)return [];
  const paras=clean.split(/\n{2,}/).map(x=>x.trim()).filter(Boolean);
  if(paras.length>1){if(paras.length<=max)return paras;return [...paras.slice(0,max-1),paras.slice(max-1).join("\n\n")];}
  const sents=clean.split(/(?<=[.!?。！？]|다\.)\s+/).map(x=>x.trim()).filter(Boolean);
  const out=[];let buf="";
  for(const s of sents){if((buf+" "+s).length>210&&buf){out.push(buf.trim());buf=s}else buf+=(buf?" ":"")+s;if(out.length>=max-1)break}
  if(buf&&out.length<max)out.push(buf.trim());
  return out.length?out:[clean];
}
function magPreset(name){
  const presets={
    journal:{name:"Film Journal",bg:"#f2eee5",text:"#151515",muted:"#68635c",accent:"#a62520",serif:true},
    critic:{name:"Critic's Note",bg:"#0d0e10",text:"#f5f4ef",muted:"#8c939b",accent:"#d8ff43",serif:false},
    festival:{name:"Festival Program",bg:"#f7f3e8",text:"#161616",muted:"#746f65",accent:"#1d4b78",serif:true},
    zine:{name:"Indie Zine",bg:"#f1e35d",text:"#111111",muted:"#4d4a2f",accent:"#d12d24",serif:false},
    newspaper:{name:"Cinema Daily",bg:"#ece9df",text:"#171717",muted:"#605d55",accent:"#171717",serif:true},
    archive:{name:"Archive No.",bg:"#18221e",text:"#edf0e9",muted:"#95a099",accent:"#f0b866",serif:true},
    noir:{name:"Noir File",bg:"#050505",text:"#f0eee7",muted:"#777777",accent:"#e6e6e6",serif:true},
    postcard:{name:"Movie Postcard",bg:"#e8ded0",text:"#1d1a17",muted:"#71685f",accent:"#9c372f",serif:true}
  };return presets[name]||presets.journal;
}
function magIssueNo(){return String(magazineV2().length+1).padStart(3,"0")}
function createMagazineV2(data={}){
  const m=MOVIES[data.code]||{},list=magazineV2(),id="mag-"+Date.now();
  const item={id,issue:magIssueNo(),code:data.code,title:m.title||data.title||"영화",headline:data.headline||m.title||"영화 비평",deck:data.deck||"",text:data.text||"",rating:Number(data.rating||0),tags:data.tags||[],stamp:data.stamp||"",stampCustom:data.stampCustom||"",preset:data.preset||"journal",stillIndices:data.stillIndices||[0],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  item.slides=splitReviewForCards(item.text,5);
  list.push(item);saveMagazineV2(list.slice(-150));renderMagazineShelfV2();return item;
}
function upsertMagazineV2(item){
  const list=magazineV2(),i=list.findIndex(x=>x.id===item.id);item.updatedAt=new Date().toISOString();
  if(i>=0)list[i]=item;else list.push(item);saveMagazineV2(list.slice(-150));renderMagazineShelfV2();
}
function magazineFromPost(post){
  if(!post)return null;
  const existing=magazineV2().find(x=>x.sourcePostId===post.id);
  if(existing)return existing;
  const item=createMagazineV2({code:post.code,headline:post.title||MOVIES[post.code]?.title,text:post.body,rating:post.rating,tags:post.tags,preset:"journal"});
  item.sourcePostId=post.id;upsertMagazineV2(item);return item;
}
async function seedMagazineSamples(){
  try{
    const stamp=Date.now(),[samplePack,criticPack]=await Promise.all([
      fetch("./data/sample-magazines.json?v="+stamp).then(r=>r.ok?r.json():null),
      fetch("./data/criticism-library.json?v="+stamp).then(r=>r.ok?r.json():null)
    ]);
    const items=[...(samplePack?.items||[]),...(criticPack?.items||[])];if(!items.length)return;
    MAGAZINE_COLLECTION_META=criticPack?.collection||samplePack?.collection||null;
    const rules=criticPack?.rules||{minChars:800,minPhotos:3},seedVersion=String(samplePack?.version||0)+"."+String(criticPack?.version||0),current=localStorage.getItem("indiePortMagazineSeedVersion");
    const existing=magazineV2(),hasAll=items.every(s=>existing.some(x=>x.id===s.id));if(current===seedVersion&&hasAll)return;
    const list=existing.filter(x=>!x.sample);
    for(const s of items){
      const photos=(s.photos||[]).filter(Boolean),fullEnough=String(s.body||"").trim().length>=Number(rules.minChars||800),photoEnough=photos.length>=Number(rules.minPhotos||3),eligible=s.magazineEligible===false?false:(fullEnough&&photoEnough&&!s.excerptOnly);
      const base={
        id:s.id,issue:s.issue||magIssueNo(),year:s.year||null,sourceDate:s.sourceDate||"",section:s.section||"CRITICISM",recoveryStatus:s.recoveryStatus||"",magazineEligible:eligible,photos,photoCredits:s.photoCredits||[],
        code:s.code||null,title:s.filmTitle||"영화",filmTitle:s.filmTitle,filmTitleOriginal:s.filmTitleOriginal,tmdbId:s.tmdbId||null,assetSlug:s.assetSlug||"",
        headline:s.headline,deck:s.deck,author:s.author||"",spoiler:!!s.spoiler,lead:s.lead||"",text:s.body||"",continuationNote:s.continuationNote||"",
        editorialPlan:s.editorialPlan||[],rating:s.rating||0,tags:s.tags||[],stamp:"",stampCustom:"",preset:s.preset||"journal",stillIndices:s.stillIndices||[0],coverMode:s.coverMode||"still",
        slides:splitReviewForCards(s.body||"",5),sample:true,example:!!s.example,excerptOnly:!!s.excerptOnly,createdAt:s.createdAt||s.sourceDate||new Date().toISOString(),updatedAt:new Date().toISOString(),adminHidden:false
      };
      const override=adminOverrideFor(s.id);
      const merged=override?{...base,...override,id:s.id,sample:true,_adminEdited:true}:base;
      if(!merged.adminHidden)list.push(merged);
    }
    saveMagazineV2(list.slice(-150));localStorage.setItem("indiePortMagazineSeedVersion",seedVersion);
  }catch(e){console.warn("magazine seed pipeline",e)}
}
function magazineDisplayTitle(x){return x.headline||x.title||x.filmTitle||"영화 비평"}
function magazineVisualsV2(x){
  const own=(x?.photos||[]).filter(Boolean);if(own.length)return own;
  if(x?.code)return cardVisualsV2(x).filter(Boolean);
  return [];
}
function isMagazineLongformV2(x){
  return !!x&&x.sample&&x.magazineEligible!==false&&String(x.text||"").trim().length>=800&&magazineVisualsV2(x).length>0;
}
function isCriticismLongformV2(x){
  return !!x&&x.sample&&!x.excerptOnly&&String(x.text||"").trim().length>=800;
}
function toggleMagazineAdminV2(){
  const on=!magAdminEnabled();setMagAdminEnabled(on);renderMagazineShelfV2();
  toast(on?"관리자 모드 ON · 이 기기에서 수동 편집 가능":"관리자 모드 OFF");
}
function downloadJsonV2(name,data){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function exportMagazineAdminDataV2(){
  downloadJsonV2("indie-port-magazine-admin-overrides.json",{exportedAt:new Date().toISOString(),overrides:magAdminOverrides(),localMagazine:magazineV2().filter(x=>!x.sample)});
  toast("관리자 편집 JSON을 저장했습니다.");
}
function saveAdminMagazineV2(){
  if(!magAdminEnabled())return toast("관리자 모드를 먼저 켜주세요.");
  const item=studioItemFromForm(),before=magazineV2().find(x=>x.id===item.id);if(before)pushAdminHistory(item.id,before);
  item.sample=true;item._adminEdited=true;item.adminHidden=false;
  setAdminOverride(item.id,item);upsertMagazineV2(item);toast("관리자 수정본 저장 · 이전 버전도 보관했습니다.");
}
function resetAdminMagazineV2(){
  if(!MAG_STUDIO.id)return;clearAdminOverride(MAG_STUDIO.id);localStorage.removeItem("indiePortMagazineSeedVersion");
  seedMagazineSamples().then(()=>{renderMagazineShelfV2();closePanelV08(document.getElementById("magStudioV2"));toast("원본 데이터로 복원했습니다.");});
}
function hideAdminMagazineV2(){
  if(!magAdminEnabled()||!MAG_STUDIO.id)return;
  const base=magazineV2().find(x=>x.id===MAG_STUDIO.id)||{};setAdminOverride(MAG_STUDIO.id,{...base,adminHidden:true,_adminEdited:true});
  saveMagazineV2(magazineV2().filter(x=>x.id!==MAG_STUDIO.id));renderMagazineShelfV2();closePanelV08(document.getElementById("magStudioV2"));toast("이 기기의 잡지 서재에서 숨겼습니다.");
}
function renderMagazineShelfV2(){
  const discover=document.getElementById("discover");if(!discover)return;
  let host=document.getElementById("criticism");
  if(!host){host=document.createElement("section");host.id="criticism";host.className="wrap section criticism-stage";discover.insertAdjacentElement("afterend",host)}
  let root=document.getElementById("magazineShelfV2");
  if(!root){root=document.createElement("div");root.id="magazineShelfV2";root.className="magazine-shelf-v2";host.appendChild(root)}
  const all=magazineV2(),samples=typeof sortMagazineAdminOrderV17==="function"?sortMagazineAdminOrderV17(all.filter(isCriticismLongformV2)):all.filter(isCriticismLongformV2).sort((a,b)=>String(a.sourceDate||"").localeCompare(String(b.sourceDate||""))),pending=all.filter(x=>x.sample&&x.excerptOnly).sort((a,b)=>String(b.sourceDate||"").localeCompare(String(a.sourceDate||""))),mine=all.filter(x=>!x.sample).slice().reverse();
  const meta=MAGAZINE_COLLECTION_META||{issue:"VOL. 01",title:"INDIE PORT FILM JOURNAL",subtitle:"2026 FILM CRITICISM",author:""},coverVisual=samples.length?(magazineVisualsV2(samples[0])[1]||magazineVisualsV2(samples[0])[0]||""):"";
  const annual=samples.length?'<article class="annual-cover-card" id="openAnnualMagazine"><img src="'+coverVisual+'" alt=""><div class="annual-cover-shade"></div><div class="annual-cover-copy"><div class="mag-v2-issue">'+esc(meta.issue||"VOL. 01")+' · '+samples.length+' FEATURE</div><div class="kicker">FILM JOURNAL</div><h4>'+esc(meta.title||"INDIE PORT FILM JOURNAL")+'</h4><p>'+esc(meta.subtitle||"")+'</p><footer><span>2026 CRITICISM</span><span>한 권으로 읽기 →</span></footer></div></article>':"";
  const pendingHtml=pending.length?'<section class="mag-recovery-index"><div class="kicker">2026 CRITICISM INDEX</div><h4>원문 회수 중</h4><p>실제로 작성한 비평이 확인되지만 전체 원문 파일이 아직 회수되지 않은 글입니다. 확인 가능한 실제 문장만 보존하고 새 문장은 만들지 않습니다.</p><div>'+pending.map(x=>'<article data-open-mag="'+esc(x.id)+'"><small>'+esc(x.sourceDate||"2026")+' · RECOVERING</small><b>'+esc(x.headline||x.filmTitle||"")+'</b><span>'+esc(x.filmTitle||"")+'</span></article>').join("")+'</div></section>':"";
  const adminLibraryHtml=magAdminEnabled()?'<section class="mag-admin-library"><div class="kicker">ADMIN LIBRARY</div><h4>정식 원고 수동 편집</h4><p>이 기기에서 수정한 값은 원본 seed 위에 override로 저장됩니다.</p><div>'+samples.map(x=>'<button data-open-mag="'+esc(x.id)+'"><span>'+esc(x.issue||"")+'</span><b>'+esc(x.filmTitle||x.title||"")+'</b><small>'+esc(x.headline||"")+(x._adminEdited?" · 수정됨":"")+'</small></button>').join("")+'</div></section>':"";
  root.innerHTML='<div class="mag-v2-head"><div><div class="kicker">MY CINEMA JOURNAL</div><h3>비평 잡지 서재</h3><p>긴 비평은 원문 그대로 잡지에 싣고, 카드뉴스는 핵심 문장만 별도로 만듭니다.</p></div><div class="mag-admin-head"><button class="ghostbtn" id="toggleMagAdmin">'+(magAdminEnabled()?"ADMIN ON":"관리자 모드")+'</button><button class="ghostbtn" id="exportMagAdminData" '+(magAdminEnabled()?"":"hidden")+'>관리자 JSON</button><button class="ghostbtn" id="newBlankMagazine">+ 새 비평</button></div></div>'+annual+pendingHtml+adminLibraryHtml+
    (mine.length?'<div class="mag-v2-grid personal-mag-grid">'+mine.map(x=>'<article class="mag-v2-cover preset-'+esc(x.preset||"journal")+'" data-open-mag="'+esc(x.id)+'"><div class="mag-v2-issue">ISSUE '+esc(x.issue||"")+'</div><div class="mag-v2-film">'+esc(x.filmTitle||x.title||"FILM JOURNAL")+'</div><h4>'+esc(magazineDisplayTitle(x))+'</h4><p>'+esc(x.deck||x.lead||"")+'</p><footer><span>CRITICISM</span><span>'+esc((x.tags||[]).slice(0,2).map(t=>"#"+t).join(" "))+'</span></footer></article>').join("")+'</div>':"");
  document.getElementById("newBlankMagazine").onclick=()=>openMagazineStudioV2(null);
  document.getElementById("toggleMagAdmin").onclick=toggleMagazineAdminV2;
  document.getElementById("exportMagAdminData")?.addEventListener("click",exportMagazineAdminDataV2);
  document.getElementById("openAnnualMagazine")?.addEventListener("click",openMagazineAnnualV2);
  root.querySelectorAll("[data-open-mag]").forEach(el=>el.onclick=()=>openMagazineStudioV2(el.dataset.openMag));
}
function annualPhotoCreditHtmlV2(x,index){
  const c=(x?.photoCredits||[])[index],label=esc(c?.label||x?.filmTitle||x?.title||"");
  if(!c)return label;
  const meta=[c.creator,c.license].filter(Boolean).map(esc).join(" · "),src=String(c.source||"");
  return '<span>'+label+(meta?' · '+meta:'')+'</span>'+(src.startsWith("http")?'<a href="'+esc(src)+'" target="_blank" rel="noopener">출처 ↗</a>':'');
}
function annualPhotoAltV2(x,index){
  const c=(x?.photoCredits||[])[index];
  return c?.label||((x?.filmTitle||x?.title||"영화")+" 관련 이미지");
}
function annualPhotoMarksV2(paras,count){
  const valid=paras.map((p,i)=>({p,i})).filter(x=>x.i>0&&x.i<paras.length-1&&!/^#{2,3}\s/.test(x.p)).map(x=>x.i);
  if(!valid.length||!count)return [];
  const ratios=[.23,.47,.70,.86].slice(0,count),used=[];
  for(const ratio of ratios){
    const desired=Math.round((paras.length-1)*ratio);
    let candidates=valid.filter(i=>!used.some(u=>Math.abs(u-i)<2));
    if(!candidates.length)candidates=valid;
    const best=candidates.slice().sort((a,b)=>Math.abs(a-desired)-Math.abs(b-desired))[0];
    used.push(best);
  }
  return used;
}
function annualHeroVisualV2(x,src){
  if(!src)return "";
  return '<figure class="annual-article-hero"><img class="annual-article-image" src="'+esc(src)+'" alt="'+esc(annualPhotoAltV2(x,0))+'"><figcaption>'+annualPhotoCreditHtmlV2(x,0)+'</figcaption></figure>';
}
function annualArticleBodyV2(x){
  const paras=String(x?.text||"").split(/\n{2,}/).map(p=>p.trim()).filter(Boolean),visuals=magazineVisualsV2(x).slice(1,5);
  if(!paras.length)return "";
  const marks=annualPhotoMarksV2(paras,visuals.length);
  let out="";
  const pull=paras.find(p=>!/^#{2,3}\s/.test(p)&&p.length>=30&&p.length<=110)||"";
  paras.forEach((p,i)=>{const h3=p.match(/^##\s+(.+)$/s),h4=p.match(/^###\s+(.+)$/s);if(h3)out+='<h3 class="annual-subhead">'+esc(h3[1])+'</h3>';else if(h4)out+='<h4 class="annual-minorhead">'+esc(h4[1])+'</h4>';else out+='<p>'+esc(p).replace(/\n/g,"<br>")+'</p>';if(i===1&&pull&&!/^#{2,3}\s/.test(p))out+='<aside class="annual-pullquote">“'+esc(pull)+'”</aside>';marks.forEach((m,j)=>{if(m===i&&visuals[j])out+='<figure class="annual-inline-photo photo-'+(j+1)+'"><img src="'+esc(visuals[j])+'" alt="'+esc(annualPhotoAltV2(x,j+1))+'" loading="lazy"><figcaption>'+annualPhotoCreditHtmlV2(x,j+1)+'</figcaption></figure>'})});
  return out;
}
function ensureMagazineAnnualV2(){
  let panel=document.getElementById("magAnnualV2");if(panel)return panel;
  panel=document.createElement("div");panel.id="magAnnualV2";panel.className="share-panel annual-reader-v2";
  panel.innerHTML='<div class="share-sheet annual-reader-sheet"><button class="panel-exit" id="closeAnnualV2">← 나가기</button><div class="annual-reader-toolbar" id="annualReaderToolbar"><div class="annual-mode-buttons"><button data-annual-mode="scroll" class="on">스크롤</button><button data-annual-mode="flip">플립북</button></div><div class="annual-page-nav"><button id="annualPrevPage">‹</button><span id="annualPageCounter">1 / 1</span><button id="annualNextPage">›</button></div><div class="annual-output-buttons"><button id="annualPdfBtn">PDF 저장</button><button id="annualPrintBtn">인쇄판</button></div></div><div id="annualReaderContent"></div></div>';
  document.body.appendChild(panel);document.getElementById("closeAnnualV2").onclick=()=>closePanelV08(panel);panel.addEventListener("click",e=>{if(e.target===panel)closePanelV08(panel)});
  panel.querySelectorAll("[data-annual-mode]").forEach(b=>b.onclick=()=>setAnnualViewModeV2(b.dataset.annualMode));
  document.getElementById("annualPrevPage").onclick=()=>showAnnualPageV2(ANNUAL_VIEW.page-1,-1);document.getElementById("annualNextPage").onclick=()=>showAnnualPageV2(ANNUAL_VIEW.page+1,1);
  document.getElementById("annualPdfBtn").onclick=()=>printAnnualV2("pdf");document.getElementById("annualPrintBtn").onclick=()=>printAnnualV2("print");bindAnnualFlipGesturesV2(panel);
  return panel;
}
function annualPagesV2(){
  return [...document.querySelectorAll("#annualReaderContent .annual-front,#annualReaderContent .annual-editor-note,#annualReaderContent .annual-toc,#annualReaderContent .annual-year-divider,#annualReaderContent .annual-article,#annualReaderContent .annual-afterword")];
}
function prepareAnnualPagesV2(){
  annualPagesV2().forEach((p,i)=>{p.classList.add("annual-page");p.dataset.annualPage=String(i)});
  const pages=annualPagesV2();if(ANNUAL_VIEW.page>=pages.length)ANNUAL_VIEW.page=Math.max(0,pages.length-1);return pages;
}
function showAnnualPageV2(index,dir=0){
  if(ANNUAL_VIEW.mode!=="flip")return;const pages=prepareAnnualPagesV2();if(!pages.length)return;index=Math.max(0,Math.min(index,pages.length-1));ANNUAL_VIEW.page=index;
  pages.forEach(p=>p.classList.remove("page-active","page-enter-next","page-enter-prev"));const target=pages[index];target.classList.add("page-active",dir<0?"page-enter-prev":"page-enter-next");target.scrollTop=0;
  const counter=document.getElementById("annualPageCounter");if(counter)counter.textContent=(index+1)+" / "+pages.length;const prev=document.getElementById("annualPrevPage"),next=document.getElementById("annualNextPage");if(prev)prev.disabled=index===0;if(next)next.disabled=index===pages.length-1;
}
function setAnnualViewModeV2(mode){
  ANNUAL_VIEW.mode=mode==="flip"?"flip":"scroll";const sheet=document.querySelector("#magAnnualV2 .annual-reader-sheet");if(!sheet)return;sheet.classList.toggle("flipbook-mode",ANNUAL_VIEW.mode==="flip");
  document.querySelectorAll("[data-annual-mode]").forEach(b=>b.classList.toggle("on",b.dataset.annualMode===ANNUAL_VIEW.mode));const nav=document.querySelector("#magAnnualV2 .annual-page-nav");if(nav)nav.classList.toggle("show",ANNUAL_VIEW.mode==="flip");
  const pages=prepareAnnualPagesV2();if(ANNUAL_VIEW.mode==="flip")showAnnualPageV2(ANNUAL_VIEW.page,1);else{pages.forEach(p=>p.classList.remove("page-active","page-enter-next","page-enter-prev"));const c=document.getElementById("annualPageCounter");if(c)c.textContent="전체 "+pages.length+"면";sheet.scrollTop=0}
}
function goAnnualTargetV2(id){
  const target=document.getElementById("annual-"+id);if(!target)return;if(ANNUAL_VIEW.mode==="flip"){const pages=annualPagesV2(),i=pages.indexOf(target);if(i>=0)showAnnualPageV2(i,1)}else target.scrollIntoView({behavior:"smooth",block:"start"});
}
function bindAnnualFlipGesturesV2(panel){
  const sheet=panel.querySelector(".annual-reader-sheet");if(!sheet||sheet.dataset.flipBound)return;sheet.dataset.flipBound="1";
  sheet.addEventListener("pointerdown",e=>{if(ANNUAL_VIEW.mode!=="flip"||e.target.closest("button,a,input,textarea"))return;ANNUAL_VIEW.swipeStart={x:e.clientX,y:e.clientY,id:e.pointerId}});
  sheet.addEventListener("pointerup",e=>{const s=ANNUAL_VIEW.swipeStart;if(!s||s.id!==e.pointerId||ANNUAL_VIEW.mode!=="flip")return;const dx=e.clientX-s.x,dy=e.clientY-s.y;ANNUAL_VIEW.swipeStart=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.2)showAnnualPageV2(ANNUAL_VIEW.page+(dx<0?1:-1),dx<0?1:-1)});
  if(!window.__annualFlipKeysV2){window.__annualFlipKeysV2=true;window.addEventListener("keydown",e=>{if(!document.getElementById("magAnnualV2")?.classList.contains("open")||ANNUAL_VIEW.mode!=="flip")return;if(e.key==="ArrowRight")showAnnualPageV2(ANNUAL_VIEW.page+1,1);if(e.key==="ArrowLeft")showAnnualPageV2(ANNUAL_VIEW.page-1,-1)})}
}
function printAnnualV2(kind="pdf"){
  const previous=ANNUAL_VIEW.mode,title=document.title;setAnnualViewModeV2("scroll");document.body.classList.add("annual-printing");document.body.dataset.annualOutput=kind;document.title=(MAGAZINE_COLLECTION_META?.title||"INDIE PORT Film Journal")+" - "+(MAGAZINE_COLLECTION_META?.issue||"VOL.01");
  const cleanup=()=>{document.body.classList.remove("annual-printing");delete document.body.dataset.annualOutput;document.title=title;window.removeEventListener("afterprint",cleanup);setAnnualViewModeV2(previous)};window.addEventListener("afterprint",cleanup);
  toast(kind==="pdf"?"인쇄창에서 ‘PDF로 저장’을 선택하면 한 권으로 저장됩니다.":"인쇄판 레이아웃을 준비했습니다.");setTimeout(()=>window.print(),120);
}
function openMagazineAnnualV2(){
  const panel=ensureMagazineAnnualV2(),root=document.getElementById("annualReaderContent"),list=typeof sortMagazineAdminOrderV17==="function"?sortMagazineAdminOrderV17(magazineV2().filter(isCriticismLongformV2)):magazineV2().filter(isCriticismLongformV2).sort((a,b)=>String(a.sourceDate||"").localeCompare(String(b.sourceDate||"")));
  const meta=MAGAZINE_COLLECTION_META||{issue:"SAMPLE 01",title:"INDIE PORT FILM JOURNAL",subtitle:"영화비평 잡지 편집 예시",author:"",note:"장문 원문과 서로 다른 영화 이미지가 함께 확보된 경우에만 잡지 예시로 편집합니다."};
  if(!list.length){root.innerHTML='<div class="empty">장문 원문과 사진을 모두 확보한 비평이 아직 없습니다.</div>';openPanelV08(panel);return}
  const coverVisual=magazineVisualsV2(list[0])[1]||magazineVisualsV2(list[0])[0]||"";
  const toc=list.map((x,i)=>'<button data-annual-jump="'+esc(x.id)+'"><span>'+String(i+1).padStart(2,"0")+'</span><b>'+esc(x.filmTitle||x.title||"")+'</b><small>'+esc(x.headline||"")+'</small></button>').join("");
  let lastYear=null,articles="";
  list.forEach((x,i)=>{const y=x.year||String(x.sourceDate||"").slice(0,4)||"ARCHIVE",visuals=magazineVisualsV2(x);if(y!==lastYear){articles+='<section class="annual-year-divider"><small>CHAPTER</small><h2>'+esc(String(y))+'</h2><p>긴 글과 영화 이미지가 함께 남은 기록.</p></section>';lastYear=y}
    articles+='<article class="annual-article full'+(x.example?" example":"")+'" id="annual-'+esc(x.id)+'">'+annualHeroVisualV2(x,visuals[0])+'<div class="annual-running-head"><b>INDIE PORT FILM JOURNAL</b><span>'+String(i+1).padStart(2,"0")+'</span></div><div class="annual-article-meta"><span>'+(x.example?"MAGAZINE SAMPLE":esc(x.section||"CRITICISM"))+'</span><span>'+esc(x.sourceDate||String(x.year||""))+'</span></div><h2>'+esc(x.headline||x.filmTitle||"")+'</h2>'+(x.deck?'<h3>'+esc(x.deck)+'</h3>':'')+(!x.example&&x.author?'<div class="annual-byline">'+esc(x.author)+(x.rating?' · ★ '+Number(x.rating).toFixed(1)+' / 5':'')+'</div>':'')+'<div class="annual-copy">'+annualArticleBodyV2(x)+'</div><div class="annual-tags">'+(x.tags||[]).map(t=>'<span>#'+esc(t)+'</span>').join("")+'</div><div class="annual-folio">'+String(i+1).padStart(2,"0")+'</div></article>'});
  root.innerHTML='<section class="annual-front"><img src="'+coverVisual+'" alt=""><div class="annual-front-overlay"></div><div class="annual-front-copy"><div class="annual-cover-mast">INDIE PORT</div><div class="kicker">FILM JOURNAL · EDITORIAL SAMPLE</div><small>'+esc(meta.issue||"SAMPLE 01")+'</small><h1>'+esc(meta.title||"INDIE PORT FILM JOURNAL")+'</h1><p>'+esc(meta.subtitle||"")+'</p><em>'+list.length+' FEATURE · EDITORIAL SAMPLE</em></div></section><section class="annual-editor-note"><div class="kicker">EDITOR’S NOTE</div><h2>짧은 메모가 아니라, 끝까지 읽는 비평</h2><p>'+esc(meta.note||"장문 원문과 서로 다른 영화 이미지가 함께 확보된 경우에만 편집합니다.")+'</p></section><section class="annual-toc"><div class="kicker">CONTENTS</div><h2>차례</h2><div>'+toc+'</div></section><div class="annual-articles">'+articles+'</div><section class="annual-afterword"><div class="kicker">END NOTE</div><h2>한 편의 글을 한 권의 리듬으로</h2><p>이 페이지는 잡지 편집 예시입니다. 짧은 메모를 억지로 늘리지 않고, 장문과 서로 다른 이미지가 함께 확보된 경우에만 수록합니다.</p></section>';
  root.querySelectorAll("[data-annual-jump]").forEach(b=>b.onclick=()=>goAnnualTargetV2(b.dataset.annualJump));
  openPanelV08(panel);ANNUAL_VIEW.page=0;prepareAnnualPagesV2();setAnnualViewModeV2(ANNUAL_VIEW.mode);panel.querySelector(".annual-reader-sheet").scrollTop=0;
}
function studioItemFromForm(){
  const base=MAG_STUDIO.id?magazineV2().find(x=>x.id===MAG_STUDIO.id):null;
  const tags=(document.getElementById("magTags")?.value||"").split(/[\s,]+/).map(x=>x.replace(/^#/,"").trim()).filter(Boolean);
  const adminOn=magAdminEnabled(),adminPhotoText=document.getElementById("magPhotoUrlsAdmin")?.value||"";
  const adminPhotos=adminOn?adminPhotoText.split(/\n+/).map(x=>x.trim()).filter(Boolean):(base?.photos||MAG_STUDIO.photos||[]);
  return {...(base||{}),
    id:base?.id||("mag-"+Date.now()),issue:(adminOn?document.getElementById("magIssueAdmin")?.value.trim():"")||base?.issue||magIssueNo(),code:MAG_STUDIO.code||base?.code||null,
    year:base?.year||Number(String((adminOn?document.getElementById("magDateAdmin")?.value:"")||base?.sourceDate||"").slice(0,4))||null,
    sourceDate:(adminOn?document.getElementById("magDateAdmin")?.value:"")||base?.sourceDate||"",section:(adminOn?document.getElementById("magSectionAdmin")?.value.trim():"")||base?.section||"CRITICISM",photos:adminPhotos,
    title:base?.title||document.getElementById("magFilm")?.value.trim()||"영화",filmTitle:document.getElementById("magFilm")?.value.trim()||base?.filmTitle||base?.title||"",
    headline:document.getElementById("magHeadline")?.value.trim()||"영화 비평",deck:document.getElementById("magDeck")?.value.trim()||"",
    author:document.getElementById("magAuthor")?.value.trim()||userProfile().nickname||"",spoiler:!!document.getElementById("magSpoiler")?.checked,
    text:document.getElementById("magBody")?.value||"",rating:Number(document.getElementById("magRating")?.value||0),tags,
    stamp:document.getElementById("magStamp")?.value||"",stampCustom:document.getElementById("magStampCustom")?.value.trim()||"",
    preset:MAG_STUDIO.preset,cardFormat:MAG_STUDIO.format||"feed",stillIndices:MAG_STUDIO.stills||[],coverMode:(MAG_STUDIO.stills||[]).length?"still":"text",
    createdAt:base?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),
    sample:base?.sample||false,excerptOnly:base?.excerptOnly||false,adminHidden:base?.adminHidden||false
  };
}
function renderMagazinePreviewV2(){
  const host=document.getElementById("magPagePreview");if(!host)return;
  const x=studioItemFromForm(),p=magPreset(x.preset),rating=x.rating?("★ "+x.rating.toFixed(1)+" / 5"):"";
  const stills=(x.photos||[]).length?(x.photos||[]):(x.code?localStills(x.code):[]),selected=(x.stillIndices||[]).map(i=>stills[i]).filter(Boolean),hero=selected[0]||stills[0]||"",secondary=selected.slice(1,4);
  host.style.setProperty("--mag-bg",p.bg);host.style.setProperty("--mag-text",p.text);host.style.setProperty("--mag-muted",p.muted);host.style.setProperty("--mag-accent",p.accent);
  host.classList.toggle("serif",p.serif);
  host.innerHTML='<div class="mag-page-mast"><b>INDIE PORT</b><span>LONGFORM FILM JOURNAL · ISSUE '+esc(x.issue||"")+'</span></div>'+
    (hero?'<img class="mag-page-hero" src="'+hero+'" alt="">':'<div class="mag-page-hero text-cover"><span>'+esc(x.filmTitle||x.title||"CINEMA")+'</span></div>')+
    (secondary.length?'<div class="mag-page-photo-strip">'+secondary.map((src,i)=>'<figure><img src="'+src+'" alt="보조 스틸 '+(i+1)+'"><span>FRAME '+String(i+2).padStart(2,"0")+'</span></figure>').join("")+'</div>':'')+
    '<div class="mag-page-body"><small>'+esc(x.filmTitle||x.title||"")+(x.spoiler?' · SPOILER':'')+'</small><h2>'+esc(x.headline)+'</h2>'+(x.deck?'<h3>'+esc(x.deck)+'</h3>':'')+
    '<div class="mag-page-byline">글 '+esc(x.author||"")+(rating?' · '+rating:'')+'</div>'+
    '<div class="mag-page-copy">'+esc(x.text).replace(/\n{2,}/g,'</p><p>').replace(/^/,'<p>').replace(/$/,'</p>').replace(/\n/g,'<br>')+'</div>'+
    (x.excerptOnly?'<div class="mag-page-note">예시에는 현재 확인 가능한 실제 원고 일부만 사용했습니다.</div>':'')+
    '<div class="mag-page-tags">'+(x.tags||[]).map(t=>'<span>#'+esc(t)+'</span>').join("")+'</div></div>';
}
function debounceMagPreview(){clearTimeout(window.__magv2);window.__magv2=setTimeout(renderMagazinePreviewV2,120)}
function ensureMagazineStudioV2(){
  let panel=document.getElementById("magStudioV2");if(panel)return panel;
  panel=document.createElement("div");panel.id="magStudioV2";panel.className="share-panel mag-studio-v2";
  panel.innerHTML='<div class="share-sheet mag-studio-sheet"><button class="panel-exit" id="closeMagStudio">← 나가기</button><div class="kicker">CARD NEWS + LONGFORM MAGAZINE</div><h2>카드뉴스는 크게, 긴 비평은 그대로</h2><p>카드뉴스에는 실제 원문의 핵심 문장만 크게 배치하고, 긴 비평 원문은 아래 잡지 영역에 잘리지 않고 그대로 보관합니다.</p><div id="cardNewsStudioV2" class="cardnews-studio-v2"></div>'+
    '<div class="mag-studio-layout"><div class="mag-controls">'+
    '<label>영화<input id="magFilm" maxlength="80"></label><label>제목<input id="magHeadline" maxlength="120"></label><label>부제<input id="magDeck" maxlength="180"></label><label>글쓴이<input id="magAuthor" maxlength="40"></label>'+
    '<label>본문<textarea id="magBody" maxlength="30000"></textarea></label>'+
    '<div class="mag-meta-grid"><label>별점<input id="magRating" type="number" min="0" max="5" step="0.5"></label><label>태그<input id="magTags" placeholder="#영화비평 #시네필"></label><label class="check"><input id="magSpoiler" type="checkbox"> 스포일러</label></div>'+
    '<div class="mag-preset-row" id="magPresetRow"></div><div class="mag-still-row" id="magStillRow"></div>'+
    '<div class="mag-meta-grid"><label>도장<select id="magStamp"><option value="">없음</option><option>관람완료</option><option>강력추천</option><option>GV 참석</option><option>재관람</option><option>ARCHIVE</option></select></label><label>자유 도장<input id="magStampCustom" maxlength="16" placeholder="예: MY FAVORITE"></label></div>'+
    '<section class="mag-admin-panel" id="magAdminPanel" hidden><div class="kicker">ADMIN EDITOR · LOCAL DEVICE</div><div class="mag-admin-grid"><label>호수<input id="magIssueAdmin" maxlength="24"></label><label>날짜<input id="magDateAdmin" type="date"></label><label>섹션<input id="magSectionAdmin" maxlength="40"></label></div><label>사진 URL · 한 줄에 하나<textarea id="magPhotoUrlsAdmin" rows="5" placeholder="https://..."></textarea></label><div class="mag-admin-actions"><button class="primary" id="saveAdminMagV2">관리자 저장</button><button class="ghostbtn" id="restoreAdminHistoryV2">이전 버전 복원</button><button class="ghostbtn" id="resetAdminMagV2">원본 복원</button><button class="ghostbtn danger" id="hideAdminMagV2">서재에서 숨김</button><button class="ghostbtn" id="exportIssueAdminV2">이 글 JSON</button></div><small>현재는 이 기기의 localStorage에 관리자 수정본을 저장합니다. 공개 서버 원본은 자동 변경하지 않습니다.</small></section>'+
    '<div class="mag-action-row"><button class="primary" id="openCardNewsV2">카드뉴스 만들기</button><button class="ghostbtn" id="saveMagV2">잡지에 보관</button><button class="ghostbtn" id="exportMagV2">잡지 1면 이미지</button></div>'+
    '</div><div class="mag-preview-wrap"><article id="magPagePreview" class="mag-page-preview"></article></div></div></div>';
  document.body.appendChild(panel);
  document.getElementById("closeMagStudio").onclick=()=>closePanelV08(panel);
  panel.addEventListener("click",e=>{if(e.target===panel)closePanelV08(panel)});
  const names=[["journal","Film Journal"],["critic","Critic's Note"],["festival","Festival Program"],["zine","Indie Zine"],["newspaper","Cinema Daily"],["archive","Archive"],["noir","Noir File"],["postcard","Movie Postcard"]];
  document.getElementById("magPresetRow").innerHTML=names.map(([k,n])=>'<button data-magpreset="'+k+'">'+n+'</button>').join("");
  panel.querySelectorAll("[data-magpreset]").forEach(b=>b.onclick=()=>{MAG_STUDIO.preset=b.dataset.magpreset;panel.querySelectorAll("[data-magpreset]").forEach(x=>x.classList.toggle("on",x===b));renderMagazinePreviewV2();renderCardNewsV2()});
  ["magFilm","magHeadline","magDeck","magAuthor","magBody","magRating","magTags","magSpoiler","magStamp","magStampCustom"].forEach(id=>document.getElementById(id).addEventListener("input",debounceMagPreview));
  document.getElementById("saveMagV2").onclick=saveCurrentMagazineV2;
  document.getElementById("exportMagV2").onclick=exportMagazinePageV2;
  document.getElementById("saveAdminMagV2").onclick=saveAdminMagazineV2;
  document.getElementById("restoreAdminHistoryV2").onclick=restoreAdminHistoryV2;
  document.getElementById("resetAdminMagV2").onclick=resetAdminMagazineV2;
  document.getElementById("hideAdminMagV2").onclick=hideAdminMagazineV2;
  document.getElementById("exportIssueAdminV2").onclick=()=>{const item=studioItemFromForm();downloadJsonV2("indie-port-"+(item.id||"issue")+".json",item)};
  ["magIssueAdmin","magDateAdmin","magSectionAdmin","magPhotoUrlsAdmin"].forEach(id=>document.getElementById(id).addEventListener("input",()=>{syncAdminFieldsV2();debounceMagPreview();if(id==="magPhotoUrlsAdmin"){clearTimeout(window.__magPhotoAdmin);window.__magPhotoAdmin=setTimeout(()=>{renderMagStillPickerV2();renderCardNewsV2()},260)}}));
  document.getElementById("openCardNewsV2").onclick=()=>{renderCardNewsV2();document.getElementById("cardNewsStudioV2").scrollIntoView({behavior:"smooth",block:"start"})};
  return panel;
}
function syncAdminFieldsV2(){
  const panel=document.getElementById("magAdminPanel");if(panel)panel.hidden=!magAdminEnabled();
  if(!magAdminEnabled())return;
  const photos=(document.getElementById("magPhotoUrlsAdmin")?.value||"").split(/\n+/).map(x=>x.trim()).filter(Boolean);
  MAG_STUDIO.photos=photos;
}
function fillAdminFieldsV2(x){
  const panel=document.getElementById("magAdminPanel");if(panel)panel.hidden=!magAdminEnabled();
  if(!magAdminEnabled())return;
  document.getElementById("magIssueAdmin").value=x.issue||"";
  document.getElementById("magDateAdmin").value=(x.sourceDate||"").slice(0,10);
  document.getElementById("magSectionAdmin").value=x.section||"CRITICISM";
  document.getElementById("magPhotoUrlsAdmin").value=(x.photos||[]).join("\n");
}
function openMagazineStudioV2(idOrNull,fromPost=null){
  const panel=ensureMagazineStudioV2();
  let x=idOrNull?magazineV2().find(v=>v.id===idOrNull):null;
  if(!x&&fromPost)x=magazineFromPost(fromPost);
  if(!x)x={id:null,issue:magIssueNo(),code:activeMovieCode||null,title:activeMovieCode?MOVIES[activeMovieCode]?.title:"",filmTitle:activeMovieCode?MOVIES[activeMovieCode]?.title:"",headline:activeMovieCode?MOVIES[activeMovieCode]?.title:"새 비평",deck:"",author:userProfile().nickname||"",spoiler:false,text:"",rating:0,tags:[],stamp:"",stampCustom:"",preset:"journal",stillIndices:[0]};
  MAG_STUDIO={code:x.code||null,id:x.id||null,photos:(x.photos||[]).filter(Boolean),preset:x.preset||"journal",format:x.cardFormat||"feed",stills:x.stillIndices||[0],rating:x.rating||0,tags:x.tags||[],stamp:x.stamp||"",stampCustom:x.stampCustom||"",textAlign:"left",fontScale:1,slides:x.slides||[],cardManual:false,cardEdits:[],cardActiveEdit:1};
  document.getElementById("magFilm").value=x.filmTitle||x.title||"";
  document.getElementById("magHeadline").value=x.headline||"";
  document.getElementById("magDeck").value=x.deck||"";
  document.getElementById("magAuthor").value=x.author||userProfile().nickname||"";
  document.getElementById("magBody").value=x.text||"";
  document.getElementById("magRating").value=x.rating||0;
  document.getElementById("magTags").value=(x.tags||[]).map(t=>"#"+t).join(" ");
  document.getElementById("magSpoiler").checked=!!x.spoiler;
  document.getElementById("magStamp").value=x.stamp||"";
  document.getElementById("magStampCustom").value=x.stampCustom||"";
  fillAdminFieldsV2(x);
  panel.querySelectorAll("[data-magpreset]").forEach(b=>b.classList.toggle("on",b.dataset.magpreset===MAG_STUDIO.preset));
  renderMagStillPickerV2();renderMagazinePreviewV2();renderCardNewsV2();openPanelV08(panel);
}
function renderMagStillPickerV2(){
  const root=document.getElementById("magStillRow");if(!root)return;const stills=(MAG_STUDIO.photos||[]).length?(MAG_STUDIO.photos||[]):(MAG_STUDIO.code?localStills(MAG_STUDIO.code):[]);
  if(!stills.length){root.innerHTML='<div class="mag-no-still">스틸 없음 · 텍스트 중심 잡지 레이아웃</div>';return}
  root.innerHTML='<small>카드/잡지 사진 · 최대 4장 · 선택 순서대로 사용</small><div>'+stills.map((src,i)=>{const pos=MAG_STUDIO.stills.indexOf(i);return '<button data-magstill="'+i+'" class="'+(pos>=0?"on":"")+'"><img src="'+src+'" alt=""><span>'+(pos>=0?pos+1:i+1)+'</span></button>'}).join("")+'</div>';
  root.querySelectorAll("[data-magstill]").forEach(b=>b.onclick=()=>{const i=Number(b.dataset.magstill),pos=MAG_STUDIO.stills.indexOf(i);if(pos>=0)MAG_STUDIO.stills.splice(pos,1);else if(MAG_STUDIO.stills.length<4)MAG_STUDIO.stills.push(i);else{MAG_STUDIO.stills.shift();MAG_STUDIO.stills.push(i)}if(!MAG_STUDIO.stills.length)MAG_STUDIO.stills=[i];renderMagStillPickerV2();renderMagazinePreviewV2();renderCardNewsV2()});
}
function saveCurrentMagazineV2(){
  const item=studioItemFromForm();item.slides=splitReviewForCards(item.text,5);upsertMagazineV2(item);MAG_STUDIO.id=item.id;toast("비평을 잡지 서재에 저장했습니다.");
}
function saveAsMagazine(postId){
  const p=postById(postId);if(!p)return;const item=magazineFromPost(p);openMagazineStudioV2(item.id);
}
async function makeMagazinePageBlobV2(item){
  const p=magPreset(item.preset),w=1240,h=1754,canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d");
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);const pad=86;
  const stills=(item.photos||[]).length?(item.photos||[]):(item.code?localStills(item.code):[]),hero=stills[(item.stillIndices||[])[0]||0]||"";
  if(hero){try{const img=await loadImage(hero);coverDraw(ctx,img,0,0,w,560)}catch(e){}}
  if(hero){const g=ctx.createLinearGradient(0,300,0,620);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,p.bg);ctx.fillStyle=g;ctx.fillRect(0,300,w,340)}
  ctx.fillStyle=p.accent;ctx.font="900 28px Pretendard, sans-serif";ctx.fillText("INDIE PORT · FILM JOURNAL · ISSUE "+(item.issue||""),pad,hero?610:90);
  let y=hero?680:165;ctx.fillStyle=p.text;ctx.font=(p.serif?"900 68px Georgia, serif":"900 68px Pretendard, sans-serif");
  const titleLines=wrapLines(ctx,item.headline||item.title,w-pad*2,3);titleLines.forEach((line,i)=>ctx.fillText(line,pad,y+i*78));y+=titleLines.length*78+20;
  if(item.deck){ctx.fillStyle=p.muted;ctx.font=(p.serif?"600 30px Georgia, serif":"600 30px Pretendard, sans-serif");const ds=wrapLines(ctx,item.deck,w-pad*2,3);ds.forEach((line,i)=>ctx.fillText(line,pad,y+i*42));y+=ds.length*42+26}
  ctx.fillStyle=p.accent;ctx.font="800 22px Pretendard, sans-serif";ctx.fillText("글 "+(item.author||"")+(item.rating?"   ★ "+Number(item.rating).toFixed(1):""),pad,y);y+=52;
  ctx.fillStyle=p.text;ctx.font=(p.serif?"24px Georgia, serif":"24px Pretendard, sans-serif");
  const bodyLines=wrapLines(ctx,item.text||"",w-pad*2,22);bodyLines.forEach((line,i)=>ctx.fillText(line,pad,y+i*35));
  const stamp=item.stampCustom||item.stamp;if(stamp){ctx.save();ctx.translate(w-210,h-150);ctx.rotate(-.12);ctx.strokeStyle=p.accent;ctx.lineWidth=5;ctx.strokeRect(-120,-38,240,76);ctx.fillStyle=p.accent;ctx.font="900 24px Pretendard, sans-serif";ctx.textAlign="center";ctx.fillText(stamp,0,8);ctx.restore()}
  ctx.fillStyle=p.muted;ctx.font="18px Pretendard, sans-serif";ctx.textAlign="left";ctx.fillText((item.tags||[]).map(t=>"#"+t).join("  "),pad,h-72);
  return await new Promise(resolve=>canvas.toBlob(resolve,"image/png",.96));
}
async function exportMagazinePageV2(){
  const item=studioItemFromForm(),blob=await makeMagazinePageBlobV2(item),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="indie-port-journal-"+(item.issue||"issue")+".png";a.click();setTimeout(()=>URL.revokeObjectURL(url),1800);toast("잡지 1면 이미지를 저장했습니다.");
}
function cardVisualsV2(item){
  const own=(item?.photos||[]).filter(Boolean);if(own.length)return own;
  const code=item?.code,a=shareAssets?.[code]||{},stills=(a.stills||[]).filter(Boolean),out=[];
  for(const pick of (item?.stillIndices||[])){if(Number.isInteger(pick)&&stills[pick]&&!out.includes(stills[pick]))out.push(stills[pick])}
  if(a.poster&&!out.includes(a.poster))out.push(a.poster);for(const s of stills)if(!out.includes(s))out.push(s);
  return out.length?out:localStills(code);
}
function clipCardTextV2(text,max=148){
  const clean=String(text||"").replace(/\s+/g," ").trim();if(clean.length<=max)return clean;
  const cut=clean.slice(0,max+1),at=Math.max(cut.lastIndexOf(" "),cut.lastIndexOf("다."),cut.lastIndexOf("."));
  return clean.slice(0,at>Math.round(max*.62)?at+1:max).trim()+"…";
}
function cardAutoSlidesV2(item){
  const chunks=splitReviewForCards(item.text,4).slice(0,4).map(x=>clipCardTextV2(x,148)),slides=[];
  slides.push({kind:"cover",role:"cover",title:item.headline,body:clipCardTextV2(item.deck||item.lead||"",104),index:0});
  chunks.forEach((body,i)=>slides.push({kind:"body",role:"body",title:i===0?"비평의 시작":"핵심 문장 "+String(i+1).padStart(2,"0"),body,index:i+1}));
  const trimmed=slides.slice(0,5);if(trimmed.length>2)trimmed[trimmed.length-1].role="end";return trimmed;
}
function cardSentenceCandidatesV2(text){
  const clean=String(text||"").trim(),parts=clean.split(/\n{2,}|(?<=[.!?。！？]|다\.)\s+/).map(x=>x.replace(/\s+/g," ").trim()).filter(x=>x.length>=12),out=[];
  parts.forEach(x=>{const c=clipCardTextV2(x,148);if(c&&!out.includes(c))out.push(c)});
  return out.slice(0,14);
}
function cardSlideDataV2(item){
  if(MAG_STUDIO.cardManual&&MAG_STUDIO.cardEdits?.length)return MAG_STUDIO.cardEdits.slice(0,5).map((s,i)=>({...s,index:i}));
  return cardAutoSlidesV2(item);
}
function cardTextTuneV2(slide){
  const scale=Math.max(.75,Math.min(1.35,Number(slide?.textScale||1))),x=Math.max(-.06,Math.min(.18,Number(slide?.textX||0))),y=Math.max(-.08,Math.min(.18,Number(slide?.textY||0)));
  return {scale,x,y};
}
function updateCardThumbTuneV2(root,index){
  const card=root?.querySelectorAll(".cardnews-thumbs article")?.[index],slide=MAG_STUDIO.cardEdits?.[index];if(!card||!slide)return;const t=cardTextTuneV2(slide);
  card.style.setProperty("--ct-scale",String(t.scale));card.style.setProperty("--ct-x",Math.round(t.x*140)+"px");card.style.setProperty("--ct-y",Math.round(t.y*120)+"px");
}
function cardFormatDimsV2(format){
  if(format==="square")return [1080,1080];
  if(format==="story")return [1080,1920];
  return [1080,1350];
}
function drawCardPresetPhotoV2(ctx,img,preset,w,imageH,pad,p){
  ctx.save();
  if(preset==="critic"){
    ctx.filter="grayscale(.35) contrast(1.18)";coverDraw(ctx,img,0,0,w,imageH);ctx.filter="none";
    ctx.fillStyle="rgba(0,0,0,.24)";ctx.fillRect(0,0,w,imageH);ctx.fillStyle=p.accent;ctx.fillRect(0,0,18,imageH);
  }else if(preset==="festival"){
    ctx.fillStyle=p.accent;ctx.fillRect(pad-10,26,w-pad*2+20,imageH-42);coverDraw(ctx,img,pad,36,w-pad*2,imageH-62);
  }else if(preset==="zine"){
    ctx.translate(w/2,imageH/2);ctx.rotate(-.025);ctx.fillStyle=p.accent;ctx.fillRect(-w*.43,-imageH*.40,w*.86,imageH*.80);coverDraw(ctx,img,-w*.405,-imageH*.365,w*.81,imageH*.73);
  }else if(preset==="newspaper"){
    coverDraw(ctx,img,0,0,w*.69,imageH);ctx.strokeStyle=p.text;ctx.lineWidth=3;ctx.strokeRect(w*.72,34,w*.22,imageH-68);
    ctx.fillStyle=p.text;ctx.font="900 25px Georgia, serif";ctx.fillText("CINEMA",w*.745,88);ctx.font="700 17px Georgia, serif";ctx.fillText("DAILY / PHOTO",w*.745,120);
  }else if(preset==="archive"){
    ctx.strokeStyle=p.accent;ctx.lineWidth=4;ctx.strokeRect(pad-18,24,w-pad*2+36,imageH-48);coverDraw(ctx,img,pad,44,w-pad*2,imageH-88);
    ctx.fillStyle=p.accent;ctx.font="800 18px monospace";ctx.fillText("FRAME / ARCHIVE",pad,30);
  }else if(preset==="noir"){
    ctx.filter="grayscale(1) contrast(1.35)";coverDraw(ctx,img,0,0,w,imageH);ctx.filter="none";
    ctx.fillStyle="rgba(0,0,0,.32)";ctx.fillRect(0,0,w,imageH);ctx.strokeStyle="rgba(255,255,255,.55)";ctx.lineWidth=2;ctx.strokeRect(28,28,w-56,imageH-56);
  }else if(preset==="postcard"){
    ctx.fillStyle="rgba(255,255,255,.72)";ctx.fillRect(46,30,w-92,imageH-52);coverDraw(ctx,img,62,46,w-124,imageH-84);
    ctx.fillStyle=p.accent;ctx.font="italic 22px Georgia, serif";ctx.fillText("from the cinema",w-270,imageH-24);
  }else{
    coverDraw(ctx,img,0,0,w,imageH);ctx.fillStyle=p.accent;ctx.fillRect(pad,22,150,7);
  }
  ctx.restore();
}
async function makeCardSlideBlobV2(item,slide,index){
  const slidePreset=slide?.preset||item.preset||"journal",role=slide?.role||(index===0?"cover":index===cardSlideDataV2(item).length-1?"end":"body"),p=magPreset(slidePreset),format=item.cardFormat||MAG_STUDIO.format||"feed",[w,h]=cardFormatDimsV2(format),canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d"),pad=76;
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);const stills=cardVisualsV2(item),rawIndex=Number.isInteger(slide?.imageIndex)?slide.imageIndex:index,imageIndex=rawIndex<0?-1:rawIndex%Math.max(1,stills.length),useStill=imageIndex>=0?(stills[imageIndex]||stills[0]||""):"";
  const imageH=format==="story"?800:format==="square"?390:520,start=useStill?imageH+46:112,photoMode=slide?.photoMode||"single";
  if(useStill){try{
    if(photoMode==="single"){const img=await loadImage(useStill);drawCardPresetPhotoV2(ctx,img,slidePreset,w,imageH,pad,p)}
    else{const count=photoMode==="duo"?2:photoMode==="trio"?3:4,urls=Array.from({length:count},(_,i)=>stills[(imageIndex+i)%stills.length]).filter(Boolean),imgs=await Promise.all(urls.map(loadImage));ctx.save();ctx.strokeStyle=p.accent;ctx.lineWidth=4;if(count===2){imgs.forEach((img,i)=>coverDraw(ctx,img,i*w/2,0,w/2,imageH))}else if(count===3){coverDraw(ctx,imgs[0],0,0,w*.58,imageH);coverDraw(ctx,imgs[1],w*.58,0,w*.42,imageH/2);coverDraw(ctx,imgs[2],w*.58,imageH/2,w*.42,imageH/2)}else{imgs.forEach((img,i)=>coverDraw(ctx,img,(i%2)*w/2,Math.floor(i/2)*imageH/2,w/2,imageH/2))}ctx.strokeRect(12,12,w-24,imageH-24);ctx.restore()}
    const g=ctx.createLinearGradient(0,imageH*.62,0,imageH+90);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,p.bg);ctx.fillStyle=g;ctx.fillRect(0,imageH*.54,w,imageH*.54)
  }catch(e){}}
  const roleLabel=role==="cover"?"COVER":role==="end"?"END NOTE":"BODY";ctx.fillStyle=p.accent;ctx.font="900 28px Pretendard, sans-serif";ctx.fillText("INDIE PORT · "+roleLabel+" · "+String(index+1).padStart(2,"0")+" / "+String(cardSlideDataV2(item).length).padStart(2,"0"),pad,start);
  if(role==="end"){ctx.strokeStyle=p.accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(pad,start+34);ctx.lineTo(w-pad,start+34);ctx.stroke()}
  const tune=cardTextTuneV2(slide),textX=Math.round(tune.x*w),textY=Math.round(tune.y*h),textPad=Math.max(42,Math.min(w-pad-300,pad+textX)),textWidth=Math.max(300,w-textPad-pad);
  const titleBase=format==="story"?82:format==="square"?62:74,roleScale=role==="cover"?1.12:role==="end"?.92:1,titleSize=Math.round(titleBase*tune.scale*roleScale),titleGap=Math.round(titleSize*1.12);
  ctx.fillStyle=p.text;ctx.font=(p.serif?"900 ":"900 ")+titleSize+"px "+(p.serif?"Georgia, serif":"Pretendard, sans-serif");const ts=wrapLines(ctx,slide.title||item.headline,textWidth,format==="square"?2:3);ts.forEach((line,i)=>ctx.fillText(line,textPad,start+86+textY+i*titleGap));
  let y=start+86+textY+ts.length*titleGap+30;const bodyBase=format==="story"?50:format==="square"?36:44,bodySize=Math.round(bodyBase*tune.scale*(role==="end"?1.08:1)),bodyGap=Math.round(bodySize*1.42),maxLines=role==="end"?5:(format==="story"?8:format==="square"?5:6);
  ctx.font=(p.serif?"600 ":"650 ")+bodySize+"px "+(p.serif?"Georgia, serif":"Pretendard, sans-serif");const body=wrapLines(ctx,slide.body||"",textWidth,maxLines);body.forEach((line,i)=>ctx.fillText(line,textPad,y+i*bodyGap));
  if(item.rating&&index===0){ctx.fillStyle=p.accent;ctx.font="800 30px Pretendard, sans-serif";ctx.fillText("★ "+Number(item.rating).toFixed(1)+" / 5",pad,h-154)}
  const stamp=item.stampCustom||item.stamp;if(stamp){ctx.save();ctx.translate(w-190,h-158);ctx.rotate(-.1);ctx.strokeStyle=p.accent;ctx.lineWidth=4;ctx.strokeRect(-110,-36,220,72);ctx.fillStyle=p.accent;ctx.font="900 23px Pretendard, sans-serif";ctx.textAlign="center";ctx.fillText(stamp,0,8);ctx.restore()}
  ctx.fillStyle=p.muted;ctx.font="21px Pretendard, sans-serif";ctx.textAlign="left";ctx.fillText("글 "+(item.author||"")+"   "+(item.tags||[]).slice(0,3).map(t=>"#"+t).join(" "),pad,h-76);
  return await new Promise(resolve=>canvas.toBlob(resolve,"image/png",.96));
}
function enableCardManualV2(){
  const item=studioItemFromForm(),visuals=cardVisualsV2(item);MAG_STUDIO.cardManual=true;
  MAG_STUDIO.cardEdits=cardAutoSlidesV2(item).map((s,i)=>({...s,role:s.role||(i===0?"cover":i===cardAutoSlidesV2(item).length-1?"end":"body"),imageIndex:visuals.length?i%visuals.length:-1,photoMode:"single",preset:item.preset||"journal",textScale:1,textX:0,textY:0}));
  MAG_STUDIO.cardActiveEdit=Math.min(1,MAG_STUDIO.cardEdits.length-1);renderCardNewsV2();
}
function moveCardEditV2(pos,delta){
  const to=pos+delta,a=MAG_STUDIO.cardEdits;if(to<0||to>=a.length)return;[a[pos],a[to]]=[a[to],a[pos]];MAG_STUDIO.cardActiveEdit=to;renderCardNewsV2();
}
function setCardCandidateV2(text){
  if(!MAG_STUDIO.cardManual)return;const i=Math.max(0,Math.min(MAG_STUDIO.cardActiveEdit||0,MAG_STUDIO.cardEdits.length-1));MAG_STUDIO.cardEdits[i].body=text;renderCardNewsV2();
}
function cardRoleOptionsV2(selected){
  return [["cover","표지"],["body","본문"],["end","엔드카드"]].map(([k,n])=>'<option value="'+k+'" '+(selected===k?"selected":"")+'>'+n+'</option>').join("");
}
function cardPresetOptionsV2(selected){
  return [["journal","Film Journal"],["critic","Critic's Note"],["festival","Festival"],["zine","Indie Zine"],["newspaper","Cinema Daily"],["archive","Archive"],["noir","Noir"],["postcard","Postcard"]].map(([k,n])=>'<option value="'+k+'" '+(selected===k?"selected":"")+'>'+n+'</option>').join("");
}
function cardThumbVisualHtmlV2(thumbs,slide,index){
  if(!thumbs.length||slide?.imageIndex===-1)return "";
  const start=Number.isInteger(slide?.imageIndex)?slide.imageIndex:index,mode=slide?.photoMode||"single",count=mode==="duo"?2:mode==="trio"?3:mode==="quad"?4:1,imgs=Array.from({length:count},(_,i)=>thumbs[(start+i)%thumbs.length]).filter(Boolean);
  return '<div class="card-thumb-media mode-'+mode+'">'+imgs.map(src=>'<img src="'+src+'" alt="">').join("")+'</div>';
}
function renderCardNewsV2(){
  const root=document.getElementById("cardNewsStudioV2");if(!root)return;const item=studioItemFromForm(),slides=cardSlideDataV2(item),thumbs=cardVisualsV2(item),cp=magPreset(item.preset);
  const formats=[["feed","4:5 피드"],["square","1:1"],["story","9:16 스토리"]],vars='--cp-bg:'+cp.bg+';--cp-text:'+cp.text+';--cp-muted:'+cp.muted+';--cp-accent:'+cp.accent,candidates=cardSentenceCandidatesV2(item.text);
  const manual=MAG_STUDIO.cardManual?'<section class="card-manual-editor"><div class="card-manual-head"><div><b>카드별 직접편집</b><small>문장·사진·콜라주·프리셋을 카드마다 따로 정하고 ↑↓로 순서까지 바꿀 수 있습니다.</small></div><button id="cardAutoReset" class="ghostbtn">자동분할로 복귀</button></div><div class="card-candidates">'+candidates.map((c,i)=>'<button data-card-candidate="'+i+'">'+esc(c)+'</button>').join("")+'</div><div class="card-edit-list">'+slides.map((s,i)=>'<article class="'+(i===MAG_STUDIO.cardActiveEdit?"active":"")+'" data-card-edit-row="'+i+'"><div><b>CARD '+String(i+1).padStart(2,"0")+'</b><span><button data-card-up="'+i+'" '+(i===0?"disabled":"")+'>↑</button><button data-card-down="'+i+'" '+(i===slides.length-1?"disabled":"")+'>↓</button></span></div><div class="card-edit-options"><label>사진<select data-card-image="'+i+'"><option value="-1" '+(s.imageIndex===-1?"selected":"")+'>사진 없음</option>'+thumbs.map((_,n)=>'<option value="'+n+'" '+(Number(s.imageIndex)===n?"selected":"")+'>PHOTO '+(n+1)+'</option>').join("")+'</select></label><label>배치<select data-card-mode="'+i+'"><option value="single" '+((s.photoMode||"single")==="single"?"selected":"")+'>1컷</option><option value="duo" '+(s.photoMode==="duo"?"selected":"")+'>2컷</option><option value="trio" '+(s.photoMode==="trio"?"selected":"")+'>3컷</option><option value="quad" '+(s.photoMode==="quad"?"selected":"")+'>4컷</option></select></label><label>프리셋<select data-card-preset="'+i+'">'+cardPresetOptionsV2(s.preset||item.preset)+'</select></label><label>역할<select data-card-role="'+i+'">'+cardRoleOptionsV2(s.role||(i===0?"cover":i===slides.length-1?"end":"body"))+'</select></label></div><div class="card-text-options"><label>글자 크기 <output data-card-scale-out="'+i+'">'+Math.round(cardTextTuneV2(s).scale*100)+'%</output><input data-card-scale="'+i+'" type="range" min="0.75" max="1.35" step="0.05" value="'+cardTextTuneV2(s).scale+'"></label><label>가로 위치 <output data-card-x-out="'+i+'">'+Math.round(cardTextTuneV2(s).x*100)+'%</output><input data-card-x="'+i+'" type="range" min="-0.06" max="0.18" step="0.01" value="'+cardTextTuneV2(s).x+'"></label><label>세로 위치 <output data-card-y-out="'+i+'">'+Math.round(cardTextTuneV2(s).y*100)+'%</output><input data-card-y="'+i+'" type="range" min="-0.08" max="0.18" step="0.01" value="'+cardTextTuneV2(s).y+'"></label></div><input data-card-title="'+i+'" value="'+esc(s.title||"")+'"><textarea data-card-body="'+i+'" maxlength="180">'+esc(s.body||"")+'</textarea></article>').join("")+'</div></section>':'';
  const thumbHtml=slides.map((s,i)=>{const sp=magPreset(s.preset||item.preset),t=cardTextTuneV2(s),role=s.role||(i===0?"cover":i===slides.length-1?"end":"body"),roleLabel=role==="cover"?"COVER":role==="end"?"END":"BODY",sv='--cp-bg:'+sp.bg+';--cp-text:'+sp.text+';--cp-muted:'+sp.muted+';--cp-accent:'+sp.accent+';--ct-scale:'+t.scale+';--ct-x:'+Math.round(t.x*140)+'px;--ct-y:'+Math.round(t.y*120)+'px';return '<article class="card-thumb-v2 preset-'+esc(s.preset||item.preset||"journal")+' role-'+role+'" style="'+sv+'">'+cardThumbVisualHtmlV2(thumbs,s,i)+'<span>'+roleLabel+' · CARD '+String(i+1).padStart(2,"0")+'</span><b>'+esc(s.title)+'</b><p>'+esc(s.body)+'</p><button class="card-save-one" data-card-save="'+i+'">이 장 PNG 저장</button></article>'}).join("");
  root.innerHTML='<div class="cardnews-head"><div><div class="kicker">CARD NEWS STUDIO</div><h3>'+slides.length+'장 핵심 카드뉴스</h3><p>자동 분할을 그대로 쓰거나, 실제 원문에서 원하는 문장을 직접 골라 5장 순서를 편집할 수 있습니다.</p><div class="card-format-row">'+formats.map(([k,n])=>'<button data-card-format="'+k+'" class="'+(MAG_STUDIO.format===k?"on":"")+'">'+n+'</button>').join("")+'<button id="toggleCardManual" class="'+(MAG_STUDIO.cardManual?"on":"")+'">'+(MAG_STUDIO.cardManual?"직접편집 중":"문장 직접편집")+'</button></div></div><div class="cardnews-batch"><button class="ghostbtn" id="downloadCardsV2">'+slides.length+'장 ZIP 저장</button><button class="primary" id="shareCardsV2">'+slides.length+'장 SNS 공유</button></div></div><div class="cardnews-thumbs">'+thumbHtml+'</div>'+manual;
  root.querySelectorAll("[data-card-format]").forEach(b=>b.onclick=()=>{MAG_STUDIO.format=b.dataset.cardFormat;renderCardNewsV2()});document.getElementById("toggleCardManual").onclick=()=>MAG_STUDIO.cardManual?(MAG_STUDIO.cardManual=false,MAG_STUDIO.cardEdits=[],renderCardNewsV2()):enableCardManualV2();
  document.getElementById("cardAutoReset")?.addEventListener("click",()=>{MAG_STUDIO.cardManual=false;MAG_STUDIO.cardEdits=[];renderCardNewsV2()});root.querySelectorAll("[data-card-edit-row]").forEach(el=>el.onclick=e=>{if(e.target.closest("button,input,textarea,select"))return;MAG_STUDIO.cardActiveEdit=Number(el.dataset.cardEditRow);renderCardNewsV2()});
  root.querySelectorAll("[data-card-title]").forEach(el=>el.oninput=()=>{const i=Number(el.dataset.cardTitle);MAG_STUDIO.cardEdits[i].title=el.value;const t=root.querySelectorAll(".cardnews-thumbs b")[i];if(t)t.textContent=el.value});root.querySelectorAll("[data-card-body]").forEach(el=>el.oninput=()=>{const i=Number(el.dataset.cardBody);MAG_STUDIO.cardEdits[i].body=el.value;const p=root.querySelectorAll(".cardnews-thumbs p")[i];if(p)p.textContent=el.value});
  root.querySelectorAll("[data-card-image]").forEach(el=>el.onchange=()=>{const i=Number(el.dataset.cardImage);MAG_STUDIO.cardEdits[i].imageIndex=Number(el.value);renderCardNewsV2()});
  root.querySelectorAll("[data-card-mode]").forEach(el=>el.onchange=()=>{const i=Number(el.dataset.cardMode);MAG_STUDIO.cardEdits[i].photoMode=el.value;renderCardNewsV2()});
  root.querySelectorAll("[data-card-preset]").forEach(el=>el.onchange=()=>{const i=Number(el.dataset.cardPreset);MAG_STUDIO.cardEdits[i].preset=el.value;renderCardNewsV2()});
  root.querySelectorAll("[data-card-role]").forEach(el=>el.onchange=()=>{const i=Number(el.dataset.cardRole);MAG_STUDIO.cardEdits[i].role=el.value;renderCardNewsV2()});
  root.querySelectorAll("[data-card-scale]").forEach(el=>el.oninput=()=>{const i=Number(el.dataset.cardScale),v=Number(el.value);MAG_STUDIO.cardEdits[i].textScale=v;const o=root.querySelector('[data-card-scale-out="'+i+'"]');if(o)o.textContent=Math.round(v*100)+'%';updateCardThumbTuneV2(root,i)});
  root.querySelectorAll("[data-card-x]").forEach(el=>el.oninput=()=>{const i=Number(el.dataset.cardX),v=Number(el.value);MAG_STUDIO.cardEdits[i].textX=v;const o=root.querySelector('[data-card-x-out="'+i+'"]');if(o)o.textContent=Math.round(v*100)+'%';updateCardThumbTuneV2(root,i)});
  root.querySelectorAll("[data-card-y]").forEach(el=>el.oninput=()=>{const i=Number(el.dataset.cardY),v=Number(el.value);MAG_STUDIO.cardEdits[i].textY=v;const o=root.querySelector('[data-card-y-out="'+i+'"]');if(o)o.textContent=Math.round(v*100)+'%';updateCardThumbTuneV2(root,i)});
  root.querySelectorAll("[data-card-up]").forEach(b=>b.onclick=()=>moveCardEditV2(Number(b.dataset.cardUp),-1));root.querySelectorAll("[data-card-down]").forEach(b=>b.onclick=()=>moveCardEditV2(Number(b.dataset.cardDown),1));root.querySelectorAll("[data-card-candidate]").forEach(b=>b.onclick=()=>setCardCandidateV2(candidates[Number(b.dataset.cardCandidate)]||""));
  document.getElementById("downloadCardsV2").onclick=()=>exportCardNewsV2(false);document.getElementById("shareCardsV2").onclick=()=>exportCardNewsV2(true);root.querySelectorAll("[data-card-save]").forEach(b=>b.onclick=()=>exportCardSlideV2(Number(b.dataset.cardSave)));
}
async function exportCardSlideV2(index){
  const item=studioItemFromForm(),slides=cardSlideDataV2(item),slide=slides[index];if(!slide)return;
  const blob=await makeCardSlideBlobV2(item,slide,index),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="indie-port-card-"+String(index+1).padStart(2,"0")+".png";a.click();setTimeout(()=>URL.revokeObjectURL(url),1800);toast((index+1)+"번 카드를 저장했습니다.");
}
function crc32CardV2(bytes){
  const table=window.__cardCrc32V2||(window.__cardCrc32V2=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})());
  let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;
}
async function makeCardZipV2(files){
  const enc=new TextEncoder(),locals=[],centrals=[];let offset=0,centralSize=0;
  for(const file of files){
    const name=enc.encode(file.name),data=new Uint8Array(await file.arrayBuffer()),crc=crc32CardV2(data);
    const lb=new ArrayBuffer(30+name.length+data.length),lv=new DataView(lb),lu=new Uint8Array(lb);
    lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0,true);lv.setUint16(8,0,true);lv.setUint16(10,0,true);lv.setUint16(12,0,true);lv.setUint32(14,crc,true);lv.setUint32(18,data.length,true);lv.setUint32(22,data.length,true);lv.setUint16(26,name.length,true);lv.setUint16(28,0,true);lu.set(name,30);lu.set(data,30+name.length);locals.push(lu);
    const cb=new ArrayBuffer(46+name.length),cv=new DataView(cb),cu=new Uint8Array(cb);
    cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0,true);cv.setUint16(10,0,true);cv.setUint16(12,0,true);cv.setUint16(14,0,true);cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);cv.setUint16(30,0,true);cv.setUint16(32,0,true);cv.setUint16(34,0,true);cv.setUint16(36,0,true);cv.setUint32(38,0,true);cv.setUint32(42,offset,true);cu.set(name,46);centrals.push(cu);offset+=lu.byteLength;centralSize+=cu.byteLength;
  }
  const end=new ArrayBuffer(22),ev=new DataView(end);ev.setUint32(0,0x06054b50,true);ev.setUint16(4,0,true);ev.setUint16(6,0,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);ev.setUint16(20,0,true);
  return new Blob([...locals,...centrals,new Uint8Array(end)],{type:"application/zip"});
}
async function downloadCardZipV2(files,item){
  const zip=await makeCardZipV2(files),u=URL.createObjectURL(zip),a=document.createElement("a"),safe=String(item.filmTitle||item.title||item.code||"cards").replace(/[\\/:*?"<>|]/g,"-").replace(/\s+/g,"-");
  a.href=u;a.download="indie-port-"+safe+"-"+files.length+"cards.zip";a.click();setTimeout(()=>URL.revokeObjectURL(u),2500);
}
async function exportCardNewsV2(share){
  const item=studioItemFromForm(),slides=cardSlideDataV2(item),files=[];
  for(let i=0;i<slides.length;i++){const blob=await makeCardSlideBlobV2(item,slides[i],i);files.push(new File([blob],"indie-port-card-"+String(i+1).padStart(2,"0")+".png",{type:"image/png"}))}
  if(share){
    if(navigator.share&&(!navigator.canShare||navigator.canShare({files}))){try{await navigator.share({title:item.headline,text:(item.tags||[]).map(t=>"#"+t).join(" "),files});toast(files.length+"장을 한 번에 공유했습니다.");return}catch(e){if(e.name==="AbortError")return}}
    await downloadCardZipV2(files,item);toast("이 기기에서는 다중파일 SNS 공유가 제한되어 "+files.length+"장 ZIP으로 저장했습니다.");return;
  }
  await downloadCardZipV2(files,item);toast(files.length+"장 카드뉴스를 ZIP 하나로 저장했습니다.");
}
async function initV08(){
  await seedMagazineSamples();
  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(document.getElementById("my")&&typeof userProfile==="function"){
      clearInterval(timer);renderMagazineShelfV2();
      const oldSave=window.saveAsMagazine;window.saveAsMagazine=function(postId){const p=postById(postId);if(!p)return oldSave?.(postId);const item=magazineFromPost(p);openMagazineStudioV2(item.id)};
      const oldCreate=window.submitPost; if(typeof oldCreate==="function"&&!oldCreate.__v08){const wrapped=function(makeMagazine){oldCreate(makeMagazine);setTimeout(()=>{if(makeMagazine){const p=communityPosts().slice(-1)[0];if(p){const item=magazineFromPost(p);openMagazineStudioV2(item.id)}}},80)};wrapped.__v08=true;window.submitPost=wrapped}
    }
    if(tries>100)clearInterval(timer);
  },100);
}
initV08();
// v0.9 card studio extension
