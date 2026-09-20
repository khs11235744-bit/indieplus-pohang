const magazineV2=()=>JSON.parse(localStorage.getItem("indiePortMagazineV2")||"[]");
const saveMagazineV2=a=>localStorage.setItem("indiePortMagazineV2",JSON.stringify(a));
let MAG_STUDIO={code:null,id:null,preset:"journal",format:"feed",stills:[0],rating:0,tags:[],stamp:"",stampCustom:"",textAlign:"left",fontScale:1,slides:[]};

function splitReviewForCards(text,max=5){
  const clean=String(text||"").trim();if(!clean)return [];
  const paras=clean.split(/\n{2,}/).map(x=>x.trim()).filter(Boolean);
  if(paras.length>1)return paras.slice(0,max);
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
  if(magazineV2().some(x=>x.sample))return;
  try{
    const pack=await fetch("./data/sample-magazines.json?v="+Date.now()).then(r=>r.ok?r.json():null);
    if(!pack?.items?.length)return;
    const list=magazineV2();
    for(const s of pack.items){
      list.push({
        id:s.id,issue:s.issue||magIssueNo(),code:null,title:s.filmTitle||"영화",filmTitle:s.filmTitle,filmTitleOriginal:s.filmTitleOriginal,
        headline:s.headline,deck:s.deck,author:s.author||"",spoiler:!!s.spoiler,lead:s.lead||"",text:s.body||"",continuationNote:s.continuationNote||"",
        editorialPlan:s.editorialPlan||[],rating:s.rating||0,tags:s.tags||[],stamp:"",stampCustom:"",preset:s.preset||"journal",stillIndices:[],coverMode:s.coverMode||"text",
        slides:splitReviewForCards(s.body||"",5),sample:true,excerptOnly:!!s.excerptOnly,createdAt:s.createdAt||new Date().toISOString(),updatedAt:s.createdAt||new Date().toISOString()
      });
    }
    saveMagazineV2(list.slice(-150));
  }catch(e){console.warn("sample magazines",e)}
}
function magazineDisplayTitle(x){return x.headline||x.title||x.filmTitle||"영화 비평"}
function renderMagazineShelfV2(){
  const my=document.getElementById("my");if(!my)return;
  let root=document.getElementById("magazineShelfV2");
  if(!root){root=document.createElement("section");root.id="magazineShelfV2";root.className="magazine-shelf-v2";my.appendChild(root)}
  const list=magazineV2().slice().reverse();
  root.innerHTML='<div class="mag-v2-head"><div><div class="kicker">MY CINEMA JOURNAL</div><h3>내 비평 잡지 서재</h3><p>비평 한 편을 한 권의 작은 영화잡지처럼 보관하고, 같은 원고로 카드뉴스를 만듭니다.</p></div><button class="ghostbtn" id="newBlankMagazine">+ 새 잡지</button></div>'+
    (list.length?'<div class="mag-v2-grid">'+list.map(x=>'<article class="mag-v2-cover preset-'+esc(x.preset||"journal")+'" onclick="openMagazineStudioV2(\''+x.id+'\')"><div class="mag-v2-issue">ISSUE '+esc(x.issue||"")+(x.sample?' · SAMPLE':'')+'</div><div class="mag-v2-film">'+esc(x.filmTitle||x.title||"FILM JOURNAL")+'</div><h4>'+esc(magazineDisplayTitle(x))+'</h4><p>'+esc(x.deck||x.lead||"")+'</p><footer><span>'+esc(x.author||userProfile().nickname||"")+'</span><span>'+esc((x.tags||[]).slice(0,2).map(t=>"#"+t).join(" "))+'</span></footer></article>').join("")+'</div>':'<div class="empty">아직 잡지가 없습니다.</div>');
  document.getElementById("newBlankMagazine").onclick=()=>openMagazineStudioV2(null);
}
function studioItemFromForm(){
  const base=MAG_STUDIO.id?magazineV2().find(x=>x.id===MAG_STUDIO.id):null;
  const tags=(document.getElementById("magTags")?.value||"").split(/[\s,]+/).map(x=>x.replace(/^#/,"").trim()).filter(Boolean);
  return {...(base||{}),
    id:base?.id||("mag-"+Date.now()),issue:base?.issue||magIssueNo(),code:MAG_STUDIO.code||base?.code||null,
    title:base?.title||document.getElementById("magFilm")?.value.trim()||"영화",filmTitle:document.getElementById("magFilm")?.value.trim()||base?.filmTitle||base?.title||"",
    headline:document.getElementById("magHeadline")?.value.trim()||"영화 비평",deck:document.getElementById("magDeck")?.value.trim()||"",
    author:document.getElementById("magAuthor")?.value.trim()||userProfile().nickname||"",spoiler:!!document.getElementById("magSpoiler")?.checked,
    text:document.getElementById("magBody")?.value||"",rating:Number(document.getElementById("magRating")?.value||0),tags,
    stamp:document.getElementById("magStamp")?.value||"",stampCustom:document.getElementById("magStampCustom")?.value.trim()||"",
    preset:MAG_STUDIO.preset,stillIndices:MAG_STUDIO.stills||[],coverMode:(MAG_STUDIO.stills||[]).length?"still":"text",
    createdAt:base?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),
    sample:base?.sample||false,excerptOnly:base?.excerptOnly||false
  };
}
function renderMagazinePreviewV2(){
  const host=document.getElementById("magPagePreview");if(!host)return;
  const x=studioItemFromForm(),p=magPreset(x.preset),rating=x.rating?("★ "+x.rating.toFixed(1)+" / 5"):"";
  const stills=x.code?localStills(x.code):[],hero=stills[(x.stillIndices||[])[0]||0]||"";
  host.style.setProperty("--mag-bg",p.bg);host.style.setProperty("--mag-text",p.text);host.style.setProperty("--mag-muted",p.muted);host.style.setProperty("--mag-accent",p.accent);
  host.classList.toggle("serif",p.serif);
  host.innerHTML='<div class="mag-page-mast"><b>INDIE PORT</b><span>FILM JOURNAL · ISSUE '+esc(x.issue||"")+'</span></div>'+
    (hero?'<img class="mag-page-hero" src="'+hero+'" alt="">':'<div class="mag-page-hero text-cover"><span>'+esc(x.filmTitle||x.title||"CINEMA")+'</span></div>')+
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
  panel.innerHTML='<div class="share-sheet mag-studio-sheet"><button class="close" id="closeMagStudio">×</button><div class="kicker">CINEMA JOURNAL STUDIO</div><h2>비평을 잡지 한 면으로</h2><p>비평문을 편집하고, 같은 원고에서 카드뉴스를 자동으로 만듭니다.</p>'+
    '<div class="mag-studio-layout"><div class="mag-controls">'+
    '<label>영화<input id="magFilm" maxlength="80"></label><label>제목<input id="magHeadline" maxlength="120"></label><label>부제<input id="magDeck" maxlength="180"></label><label>글쓴이<input id="magAuthor" maxlength="40"></label>'+
    '<label>본문<textarea id="magBody" maxlength="12000"></textarea></label>'+
    '<div class="mag-meta-grid"><label>별점<input id="magRating" type="number" min="0" max="5" step="0.5"></label><label>태그<input id="magTags" placeholder="#영화비평 #시네필"></label><label class="check"><input id="magSpoiler" type="checkbox"> 스포일러</label></div>'+
    '<div class="mag-preset-row" id="magPresetRow"></div><div class="mag-still-row" id="magStillRow"></div>'+
    '<div class="mag-meta-grid"><label>도장<select id="magStamp"><option value="">없음</option><option>관람완료</option><option>강력추천</option><option>GV 참석</option><option>재관람</option><option>ARCHIVE</option></select></label><label>자유 도장<input id="magStampCustom" maxlength="16" placeholder="예: MY FAVORITE"></label></div>'+
    '<div class="mag-action-row"><button class="primary" id="saveMagV2">잡지에 저장</button><button class="ghostbtn" id="exportMagV2">잡지 1면 이미지</button><button class="ghostbtn" id="openCardNewsV2">카드뉴스 만들기</button></div>'+
    '</div><div class="mag-preview-wrap"><article id="magPagePreview" class="mag-page-preview"></article></div></div>'+
    '<div id="cardNewsStudioV2" class="cardnews-studio-v2"></div></div>';
  document.body.appendChild(panel);
  document.getElementById("closeMagStudio").onclick=()=>panel.classList.remove("open");
  panel.addEventListener("click",e=>{if(e.target===panel)panel.classList.remove("open")});
  const names=[["journal","저널"],["critic","크리틱"],["festival","프로그램"],["zine","진"],["newspaper","신문"],["archive","아카이브"],["noir","누아르"],["postcard","포스트카드"]];
  document.getElementById("magPresetRow").innerHTML=names.map(([k,n])=>'<button data-magpreset="'+k+'">'+n+'</button>').join("");
  panel.querySelectorAll("[data-magpreset]").forEach(b=>b.onclick=()=>{MAG_STUDIO.preset=b.dataset.magpreset;panel.querySelectorAll("[data-magpreset]").forEach(x=>x.classList.toggle("on",x===b));renderMagazinePreviewV2();renderCardNewsV2()});
  ["magFilm","magHeadline","magDeck","magAuthor","magBody","magRating","magTags","magSpoiler","magStamp","magStampCustom"].forEach(id=>document.getElementById(id).addEventListener("input",debounceMagPreview));
  document.getElementById("saveMagV2").onclick=saveCurrentMagazineV2;
  document.getElementById("exportMagV2").onclick=exportMagazinePageV2;
  document.getElementById("openCardNewsV2").onclick=()=>{renderCardNewsV2();document.getElementById("cardNewsStudioV2").scrollIntoView({behavior:"smooth",block:"start"})};
  return panel;
}
function openMagazineStudioV2(idOrNull,fromPost=null){
  const panel=ensureMagazineStudioV2();
  let x=idOrNull?magazineV2().find(v=>v.id===idOrNull):null;
  if(!x&&fromPost)x=magazineFromPost(fromPost);
  if(!x)x={id:null,issue:magIssueNo(),code:activeMovieCode||null,title:activeMovieCode?MOVIES[activeMovieCode]?.title:"",filmTitle:activeMovieCode?MOVIES[activeMovieCode]?.title:"",headline:activeMovieCode?MOVIES[activeMovieCode]?.title:"새 비평",deck:"",author:userProfile().nickname||"",spoiler:false,text:"",rating:0,tags:[],stamp:"",stampCustom:"",preset:"journal",stillIndices:[0]};
  MAG_STUDIO={code:x.code||null,id:x.id||null,preset:x.preset||"journal",format:"feed",stills:x.stillIndices||[0],rating:x.rating||0,tags:x.tags||[],stamp:x.stamp||"",stampCustom:x.stampCustom||"",textAlign:"left",fontScale:1,slides:x.slides||[]};
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
  panel.querySelectorAll("[data-magpreset]").forEach(b=>b.classList.toggle("on",b.dataset.magpreset===MAG_STUDIO.preset));
  renderMagStillPickerV2();renderMagazinePreviewV2();renderCardNewsV2();panel.classList.add("open");
}
function renderMagStillPickerV2(){
  const root=document.getElementById("magStillRow");if(!root)return;const stills=MAG_STUDIO.code?localStills(MAG_STUDIO.code):[];
  if(!stills.length){root.innerHTML='<div class="mag-no-still">스틸 없음 · 텍스트 중심 잡지 레이아웃</div>';return}
  root.innerHTML='<small>대표 스틸</small><div>'+stills.map((src,i)=>'<button data-magstill="'+i+'" class="'+(MAG_STUDIO.stills.includes(i)?"on":"")+'"><img src="'+src+'" alt=""><span>'+Number(i+1)+'</span></button>').join("")+'</div>';
  root.querySelectorAll("[data-magstill]").forEach(b=>b.onclick=()=>{const i=Number(b.dataset.magstill);MAG_STUDIO.stills=[i];root.querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));renderMagazinePreviewV2();renderCardNewsV2()});
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
  const stills=item.code?localStills(item.code):[],hero=stills[(item.stillIndices||[])[0]||0]||"";
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
function cardSlideDataV2(item){
  const chunks=splitReviewForCards(item.text,5),slides=[];
  slides.push({kind:"cover",title:item.headline,body:item.deck||item.lead||"",index:0});
  chunks.slice(0,4).forEach((body,i)=>slides.push({kind:"body",title:i===0?"비평":"계속 읽기",body,index:i+1}));
  return slides.slice(0,5);
}
async function makeCardSlideBlobV2(item,slide,index){
  const p=magPreset(item.preset),w=1080,h=1350,canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d"),pad=74;
  ctx.fillStyle=p.bg;ctx.fillRect(0,0,w,h);const stills=item.code?localStills(item.code):[];
  const useStill=stills[(item.stillIndices||[])[index%(item.stillIndices||[0]).length]||0]||stills[0]||"";
  if(useStill&&index===0){try{const img=await loadImage(useStill);coverDraw(ctx,img,0,0,w,610);const g=ctx.createLinearGradient(0,350,0,710);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,p.bg);ctx.fillStyle=g;ctx.fillRect(0,350,w,370)}catch(e){}}
  const start=index===0&&useStill?650:120;ctx.fillStyle=p.accent;ctx.font="900 24px Pretendard, sans-serif";ctx.fillText("INDIE PORT · CARD "+String(index+1).padStart(2,"0")+" / "+String(cardSlideDataV2(item).length).padStart(2,"0"),pad,start);
  ctx.fillStyle=p.text;ctx.font=(p.serif?"900 58px Georgia, serif":"900 58px Pretendard, sans-serif");const ts=wrapLines(ctx,slide.title||item.headline,w-pad*2,3);ts.forEach((line,i)=>ctx.fillText(line,pad,start+76+i*68));
  let y=start+76+ts.length*68+40;ctx.font=(p.serif?"28px Georgia, serif":"28px Pretendard, sans-serif");const body=wrapLines(ctx,slide.body||"",w-pad*2,index===0?7:18);body.forEach((line,i)=>ctx.fillText(line,pad,y+i*42));
  if(item.rating&&index===0){ctx.fillStyle=p.accent;ctx.font="800 26px Pretendard, sans-serif";ctx.fillText("★ "+Number(item.rating).toFixed(1)+" / 5",pad,h-150)}
  ctx.fillStyle=p.muted;ctx.font="19px Pretendard, sans-serif";ctx.fillText("글 "+(item.author||"")+"   "+(item.tags||[]).slice(0,3).map(t=>"#"+t).join(" "),pad,h-72);
  return await new Promise(resolve=>canvas.toBlob(resolve,"image/png",.96));
}
function renderCardNewsV2(){
  const root=document.getElementById("cardNewsStudioV2");if(!root)return;const item=studioItemFromForm(),slides=cardSlideDataV2(item);
  root.innerHTML='<div class="cardnews-head"><div><div class="kicker">AUTO CARD NEWS</div><h3>같은 비평문으로 '+slides.length+'장 카드뉴스</h3><p>첫 장은 표지, 이후 장은 본문을 자동 분할합니다.</p></div><div><button class="ghostbtn" id="downloadCardsV2">전체 저장</button><button class="primary" id="shareCardsV2">SNS 공유</button></div></div><div class="cardnews-thumbs">'+slides.map((s,i)=>'<article><span>'+(i+1)+'</span><b>'+esc(s.title)+'</b><p>'+esc(s.body).slice(0,90)+'</p></article>').join("")+'</div>';
  document.getElementById("downloadCardsV2").onclick=()=>exportCardNewsV2(false);document.getElementById("shareCardsV2").onclick=()=>exportCardNewsV2(true);
}
async function exportCardNewsV2(share){
  const item=studioItemFromForm(),slides=cardSlideDataV2(item),files=[];
  for(let i=0;i<slides.length;i++){const blob=await makeCardSlideBlobV2(item,slides[i],i);files.push(new File([blob],"indie-port-card-"+String(i+1).padStart(2,"0")+".png",{type:"image/png"}))}
  if(share&&navigator.share&&navigator.canShare?.({files})){try{await navigator.share({title:item.headline,text:(item.tags||[]).map(t=>"#"+t).join(" "),files});return}catch(e){if(e.name==="AbortError")return}}
  for(const f of files){const u=URL.createObjectURL(f),a=document.createElement("a");a.href=u;a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000)}
  toast(files.length+"장 카드뉴스를 저장했습니다.");
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
