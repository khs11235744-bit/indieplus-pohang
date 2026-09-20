const communityPosts=()=>JSON.parse(localStorage.getItem("indiePohangCommunity")||"[]");
const saveCommunity=a=>localStorage.setItem("indiePohangCommunity",JSON.stringify(a));
const magazineArchive=()=>JSON.parse(localStorage.getItem("indiePohangMagazines")||"[]");
const saveMagazines=a=>localStorage.setItem("indiePohangMagazines",JSON.stringify(a));
let v05Share={preset:"cinema",format:"feed",rating:0,tags:[],stamp:"",stillIndex:0};

function userProfile(){
  const p=profile();
  if(!p.id){p.id="local-"+Math.random().toString(36).slice(2,10);p.nickname="포항의 관객";p.bio="영화를 보고 문장을 남깁니다.";saveProfile(p)}
  return p;
}
function stars(r){const full=Math.floor(r),half=r-full>=.5;return "★".repeat(full)+(half?"½":"")+"☆".repeat(Math.max(0,5-full-(half?1:0)))}
function createPost(data){
  const p=userProfile(),posts=communityPosts();
  const post={id:"p"+Date.now(),author:p.nickname,createdAt:new Date().toISOString(),likes:0,liked:false,comments:[],...data};
  posts.push(post);saveCommunity(posts.slice(-200));renderCommunityBoard();return post;
}
function togglePostLike(id){
  const posts=communityPosts(),p=posts.find(x=>x.id===id);if(!p)return;
  p.liked=!p.liked;p.likes=Math.max(0,(p.likes||0)+(p.liked?1:-1));saveCommunity(posts);renderCommunityBoard();
}
function addPostComment(id,text){
  const t=String(text||"").trim();if(!t)return;
  const posts=communityPosts(),p=posts.find(x=>x.id===id);if(!p)return;
  p.comments=p.comments||[];p.comments.push({author:userProfile().nickname,text:t,at:new Date().toISOString()});
  saveCommunity(posts);renderCommunityBoard();
}
function renderCommunityBoard(){
  const root=document.getElementById("communityBoard");if(!root)return;
  const posts=communityPosts().slice().reverse();
  root.innerHTML=posts.length?posts.map(p=>{
    const m=MOVIES[p.code]||{},tags=(p.tags||[]).map(t=>"<span>#"+esc(t)+"</span>").join("");
    return '<article class="board-post"><div class="board-author"><b>'+esc(p.author)+'</b><small>'+new Date(p.createdAt).toLocaleDateString("ko-KR")+'</small></div>'+
      '<div class="board-movie"><img src="'+(m.poster||'')+'" alt=""><div><small>'+esc(p.type||"비평")+'</small><h3>'+esc(m.title||p.title||"영화")+'</h3><div class="rating-line">'+(p.rating?stars(p.rating)+" "+p.rating.toFixed(1):"별점 없음")+'</div></div></div>'+
      '<h4>'+esc(p.title||"")+'</h4><p>'+esc(p.body||"")+'</p><div class="board-tags">'+tags+'</div>'+
      '<div class="board-actions"><button onclick="togglePostLike(\''+p.id+'\')">'+(p.liked?"♥":"♡")+' '+(p.likes||0)+'</button><button onclick="openCommentPrompt(\''+p.id+'\')">댓글 '+(p.comments?.length||0)+'</button><button onclick="openSharePanelV05(\''+p.code+'\',\''+p.id+'\')">공유</button><button onclick="saveAsMagazine(\''+p.id+'\')">잡지로 보관</button></div>'+
      (p.comments?.length?'<div class="comment-list">'+p.comments.slice(-3).map(c=>'<p><b>'+esc(c.author)+'</b> '+esc(c.text)+'</p>').join("")+'</div>':"")+
      '</article>';
  }).join(""):'<div class="empty">첫 글을 남겨보세요. 한줄평, 긴 비평, GV 후기, 추천, 질문 모두 가능합니다.</div>';
}
function openCommentPrompt(id){const t=prompt("댓글을 입력하세요");if(t)addPostComment(id,t)}
function postById(id){return communityPosts().find(x=>x.id===id)}
function localStills(code){
  const a=shareAssets[code]||{};
  return (a.stills&&a.stills.length?a.stills:[a.still,a.poster]).filter(Boolean);
}
function presetStyle(name){
  const map={
    cinema:{bg:"#090a0b",text:"#f7f7f2",muted:"#a2a8b0",accent:"#d8ff43"},
    magazine:{bg:"#f3f0e8",text:"#151515",muted:"#5e5b55",accent:"#b32821"},
    ticket:{bg:"#e9dfc7",text:"#1b1915",muted:"#726a5c",accent:"#143642"},
    filmstrip:{bg:"#050505",text:"#f7f4e8",muted:"#9b978b",accent:"#ff5e3a"},
    minimal:{bg:"#f7f7f3",text:"#111214",muted:"#73777d",accent:"#111214"}
  };return map[name]||map.cinema;
}
async function makeShareBlobV05(code,opts={}){
  const m=MOVIES[code],format=opts.format||"feed",dims=format==="story"?[1080,1920]:format==="square"?[1080,1080]:[1080,1350];
  const [w,h]=dims,canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d"),sty=presetStyle(opts.preset||"cinema");
  ctx.fillStyle=sty.bg;ctx.fillRect(0,0,w,h);
  const stills=localStills(code),src=stills[Math.min(opts.stillIndex||0,Math.max(0,stills.length-1))]||m.poster;
  const magazine=opts.preset==="magazine",ticket=opts.preset==="ticket",film=opts.preset==="filmstrip";
  let imageH=magazine?Math.round(h*.50):ticket?Math.round(h*.42):Math.round(h*.58);
  if(src){try{const img=await loadImage(src);coverDraw(ctx,img,0,0,w,imageH)}catch(e){console.warn(e)}}
  if(film){ctx.fillStyle="#050505";for(let y=18;y<imageH;y+=58){ctx.fillRect(10,y,24,34);ctx.fillRect(w-34,y,24,34)}}
  if(!magazine&&!ticket){
    const g=ctx.createLinearGradient(0,imageH*.45,0,imageH+160);g.addColorStop(0,"rgba(9,10,11,0)");g.addColorStop(1,sty.bg);ctx.fillStyle=g;ctx.fillRect(0,0,w,imageH+160);
  }
  const pad=Math.round(w*.07),top=imageH+Math.round(h*.035);
  ctx.fillStyle=sty.accent;ctx.font="900 "+Math.round(w*.025)+"px Pretendard, sans-serif";
  ctx.fillText(magazine?"POHANG CINEMA JOURNAL":ticket?"ADMIT ONE · INDIE+ POHANG":"INDIE+ POHANG · MY CINEMA",pad,top);
  ctx.fillStyle=sty.text;ctx.font="900 "+Math.round(w*(magazine?.068:.062))+"px Pretendard, sans-serif";
  const titleLines=wrapLines(ctx,m.title,w-pad*2,2);titleLines.forEach((line,i)=>ctx.fillText(line,pad,top+76+i*72));
  let y=top+76+titleLines.length*72+28;
  const rating=Number(opts.rating||0);
  if(rating){ctx.fillStyle=sty.accent;ctx.font="800 "+Math.round(w*.031)+"px Pretendard, sans-serif";ctx.fillText("★ "+rating.toFixed(1)+" / 5",pad,y);y+=54}
  const quote=opts.text||editorial.oneLiners?.[code]||m.short||"";
  ctx.fillStyle=sty.text;ctx.font=(magazine?"600 ":"700 ")+Math.round(w*.034)+"px Pretendard, sans-serif";
  const qLines=wrapLines(ctx,magazine?quote:"“"+quote+"”",w-pad*2,format==="story"?9:6);qLines.forEach((line,i)=>ctx.fillText(line,pad,y+i*49));y+=qLines.length*49+24;
  const tags=(opts.tags||[]).slice(0,8).map(t=>"#"+String(t).replace(/^#/,"")).join("  ");
  if(tags){ctx.fillStyle=sty.muted;ctx.font="700 "+Math.round(w*.022)+"px Pretendard, sans-serif";ctx.fillText(tags,pad,Math.min(y,h-pad*1.7))}
  if(opts.stamp){ctx.save();ctx.translate(w-pad*1.55,h-pad*1.25);ctx.rotate(-.12);ctx.strokeStyle=sty.accent;ctx.lineWidth=6;ctx.strokeRect(-150,-48,300,96);ctx.fillStyle=sty.accent;ctx.font="900 "+Math.round(w*.027)+"px Pretendard, sans-serif";ctx.textAlign="center";ctx.fillText(opts.stamp,0,12);ctx.restore()}
  ctx.fillStyle=sty.muted;ctx.font="600 "+Math.round(w*.018)+"px Pretendard, sans-serif";ctx.textAlign="left";ctx.fillText("indieplus pohang · cinema diary",pad,h-pad*.55);
  return await new Promise(resolve=>canvas.toBlob(resolve,"image/png",.96));
}
let v05PreviewUrl="";
function openSharePanelV05(code,postId=""){
  const m=MOVIES[code];if(!m)return;activeMovieCode=code;
  const post=postId?postById(postId):null;
  let panel=document.getElementById("sharePanelV05");
  if(!panel){
    panel=document.createElement("div");panel.id="sharePanelV05";panel.className="share-panel";
    panel.innerHTML='<div class="share-sheet v05"><button class="close" id="closeShareV05">×</button><div class="kicker">SOCIAL CARD STUDIO</div><h2>영화 기록 카드 만들기</h2><p>글·태그·별점·도장·스틸컷을 자유롭게 조합하세요.</p>'+
      '<div class="preset-row" id="presetRow"></div><div class="share-formats" id="formatRow"><button data-format="feed" class="on">4:5 피드</button><button data-format="story">9:16 스토리</button><button data-format="square">1:1</button></div>'+
      '<div class="still-picker" id="stillPicker"></div><textarea id="shareTextV05" maxlength="700" placeholder="공유할 글을 자유롭게 입력"></textarea>'+
      '<div class="share-options"><label>별점 <input id="shareRating" type="range" min="0" max="5" step="0.5" value="0"><b id="shareRatingValue">0.0</b></label><label>태그 <input id="shareTags" type="text" placeholder="#독립영화 #포항 #오늘의영화"></label><label>도장 <select id="shareStamp"><option value="">없음</option><option>관람완료</option><option>강력추천</option><option>GV 참석</option><option>재관람</option><option>포항관객</option></select></label></div>'+
      '<div class="share-preview"><img id="sharePreviewV05" alt="공유카드 미리보기"></div><div class="share-actions"><button class="primary" id="nativeShareV05">SNS로 공유</button><button class="ghostbtn" id="saveShareV05">이미지 저장</button><button class="ghostbtn" id="magazineSaveV05">잡지 1장 보관</button></div><small>모바일에서는 시스템 공유 시트로 Instagram·카카오톡 등 설치 앱을 선택할 수 있습니다.</small></div>';
    document.body.appendChild(panel);
    document.getElementById("closeShareV05").onclick=()=>panel.classList.remove("open");
    panel.addEventListener("click",e=>{if(e.target===panel)panel.classList.remove("open")});
    document.getElementById("presetRow").innerHTML=[["cinema","시네마"],["magazine","매거진"],["ticket","티켓"],["filmstrip","필름"],["minimal","미니멀"]].map(([k,n],i)=>'<button data-preset="'+k+'" class="'+(i?"":"on")+'">'+n+'</button>').join("");
    panel.querySelectorAll("[data-preset]").forEach(b=>b.onclick=()=>{panel.querySelectorAll("[data-preset]").forEach(x=>x.classList.remove("on"));b.classList.add("on");v05Share.preset=b.dataset.preset;refreshV05Preview()});
    panel.querySelectorAll("[data-format]").forEach(b=>b.onclick=()=>{panel.querySelectorAll("[data-format]").forEach(x=>x.classList.remove("on"));b.classList.add("on");v05Share.format=b.dataset.format;refreshV05Preview()});
    ["shareTextV05","shareTags","shareStamp"].forEach(id=>document.getElementById(id).addEventListener("input",debounceV05Preview));
    document.getElementById("shareRating").addEventListener("input",e=>{document.getElementById("shareRatingValue").textContent=Number(e.target.value).toFixed(1);debounceV05Preview()});
    document.getElementById("nativeShareV05").onclick=shareV05;
    document.getElementById("saveShareV05").onclick=downloadV05;
    document.getElementById("magazineSaveV05").onclick=()=>saveMagazineFromCurrent();
  }
  const txt=post?.body||latestReviewText(code)||editorial.oneLiners?.[code]||m.short||"";
  document.getElementById("shareTextV05").value=txt;
  document.getElementById("shareRating").value=post?.rating||0;document.getElementById("shareRatingValue").textContent=Number(post?.rating||0).toFixed(1);
  document.getElementById("shareTags").value=(post?.tags||[]).map(t=>"#"+t).join(" ");
  document.getElementById("shareStamp").value="";
  v05Share={preset:"cinema",format:"feed",rating:Number(post?.rating||0),tags:post?.tags||[],stamp:"",stillIndex:0};
  panel.querySelectorAll("[data-preset]").forEach(x=>x.classList.toggle("on",x.dataset.preset==="cinema"));panel.querySelectorAll("[data-format]").forEach(x=>x.classList.toggle("on",x.dataset.format==="feed"));
  renderStillPicker(code);panel.classList.add("open");refreshV05Preview();
}
function debounceV05Preview(){clearTimeout(window.__v05share);window.__v05share=setTimeout(refreshV05Preview,220)}
function readV05Opts(){
  const tags=(document.getElementById("shareTags")?.value||"").split(/[\s,]+/).map(x=>x.replace(/^#/,"").trim()).filter(Boolean);
  return {preset:v05Share.preset,format:v05Share.format,rating:Number(document.getElementById("shareRating")?.value||0),tags,stamp:document.getElementById("shareStamp")?.value||"",stillIndex:v05Share.stillIndex,text:document.getElementById("shareTextV05")?.value.trim()||""};
}
function renderStillPicker(code){
  const root=document.getElementById("stillPicker"),stills=localStills(code);if(!root)return;
  root.innerHTML=stills.map((src,i)=>'<button data-still="'+i+'" class="'+(i?"":"on")+'"><img src="'+src+'" alt="스틸 '+(i+1)+'"><span>'+(i+1)+'</span></button>').join("");
  root.querySelectorAll("[data-still]").forEach(b=>b.onclick=()=>{root.querySelectorAll("button").forEach(x=>x.classList.remove("on"));b.classList.add("on");v05Share.stillIndex=Number(b.dataset.still);refreshV05Preview()});
}
async function refreshV05Preview(){
  if(!activeMovieCode)return;const opts=readV05Opts();v05Share={...v05Share,...opts};
  const blob=await makeShareBlobV05(activeMovieCode,opts);if(v05PreviewUrl)URL.revokeObjectURL(v05PreviewUrl);v05PreviewUrl=URL.createObjectURL(blob);
  const img=document.getElementById("sharePreviewV05");if(img)img.src=v05PreviewUrl;
}
async function shareV05(){
  const opts=readV05Opts(),blob=await makeShareBlobV05(activeMovieCode,opts),m=MOVIES[activeMovieCode];
  const file=new File([blob],"indie-pohang-"+activeMovieCode+"-"+opts.preset+"-"+opts.format+".png",{type:"image/png"});
  const shareText=[m.title,opts.text,(opts.tags||[]).map(t=>"#"+t).join(" ")].filter(Boolean).join("\n");
  if(navigator.share&&navigator.canShare?.({files:[file]})){try{await navigator.share({title:m.title,text:shareText,files:[file]});return}catch(e){if(e.name==="AbortError")return}}
  await downloadV05();
}
async function downloadV05(){
  const opts=readV05Opts(),blob=await makeShareBlobV05(activeMovieCode,opts),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="indie-pohang-"+activeMovieCode+"-"+opts.preset+"-"+opts.format+".png";a.click();setTimeout(()=>URL.revokeObjectURL(url),1800);toast("공유카드 이미지를 저장했습니다.");
}
function saveMagazineFromCurrent(){
  const opts=readV05Opts(),m=MOVIES[activeMovieCode],list=magazineArchive();
  list.push({id:"m"+Date.now(),code:activeMovieCode,title:m.title,text:opts.text,rating:opts.rating,tags:opts.tags,stamp:opts.stamp,stillIndex:opts.stillIndex,date:todayISO(),preset:"magazine"});
  saveMagazines(list.slice(-100));renderMagazineArchive();toast("잡지 1장으로 보관했습니다.");
}
function saveAsMagazine(postId){
  const p=postById(postId);if(!p)return;const list=magazineArchive(),m=MOVIES[p.code]||{};
  list.push({id:"m"+Date.now(),code:p.code,title:m.title||p.title,text:p.body,rating:p.rating||0,tags:p.tags||[],stamp:"ARCHIVE",stillIndex:0,date:todayISO(),preset:"magazine"});
  saveMagazines(list.slice(-100));renderMagazineArchive();toast("비평문을 잡지 1장으로 보관했습니다.");
}
function renderMagazineArchive(){
  const my=document.getElementById("my");if(!my)return;let root=document.getElementById("magazineArchive");
  if(!root){root=document.createElement("section");root.id="magazineArchive";root.className="magazine-archive";my.appendChild(root)}
  const list=magazineArchive().slice().reverse();
  root.innerHTML='<div class="diary-head"><div><div class="kicker">MY CINEMA MAGAZINE</div><h3>내 비평 잡지함</h3><p>비평문을 한 장의 영화 잡지처럼 보관합니다.</p></div></div>'+
    (list.length?'<div class="mag-grid">'+list.map(x=>{const m=MOVIES[x.code]||{};const img=localStills(x.code)[x.stillIndex||0]||m.poster||"";return '<article class="mag-card" onclick="openMagazineCard(\''+x.id+'\')"><img src="'+img+'" alt=""><div><small>ISSUE · '+esc(x.date)+'</small><h4>'+esc(m.title||x.title)+'</h4><p>'+esc(x.text||"")+'</p><span>'+((x.rating||0)?stars(x.rating):"NO RATING")+'</span></div></article>'}).join("")+'</div>':'<div class="empty">아직 보관한 잡지가 없습니다. 비평문에서 ‘잡지로 보관’을 눌러보세요.</div>');
}
function openMagazineCard(id){
  const x=magazineArchive().find(v=>v.id===id);if(!x)return;activeMovieCode=x.code;openSharePanelV05(x.code);setTimeout(()=>{const text=document.getElementById("shareTextV05");if(text)text.value=x.text||"";const r=document.getElementById("shareRating");if(r){r.value=x.rating||0;document.getElementById("shareRatingValue").textContent=Number(x.rating||0).toFixed(1)}v05Share.preset="magazine";v05Share.stillIndex=x.stillIndex||0;document.querySelectorAll("[data-preset]").forEach(b=>b.classList.toggle("on",b.dataset.preset==="magazine"));refreshV05Preview()},40);
}
function injectCommunityStudio(){
  const sec=document.getElementById("community");if(!sec||document.getElementById("communityStudio"))return;
  const box=document.createElement("section");box.id="communityStudio";box.className="community-studio";
  box.innerHTML='<div class="community-toolbar"><div><div class="kicker">COMMUNITY BETA</div><h3>포항 영화 커뮤니티</h3><p>한줄평·긴 비평·GV 후기·추천·질문을 영화와 연결해 남겨보세요.</p></div><button class="primary" id="newPostBtn">+ 글쓰기</button></div>'+
    '<div class="board-filter" id="boardFilter"><button data-type="all" class="on">전체</button><button data-type="한줄평">한줄평</button><button data-type="긴 비평">긴 비평</button><button data-type="GV 후기">GV 후기</button><button data-type="추천">추천</button><button data-type="질문">질문</button></div><div id="communityBoard" class="community-board"></div>';
  sec.appendChild(box);document.getElementById("newPostBtn").onclick=openPostComposer;
  box.querySelectorAll("[data-type]").forEach(b=>b.onclick=()=>{box.querySelectorAll("[data-type]").forEach(x=>x.classList.remove("on"));b.classList.add("on");renderCommunityBoardFiltered(b.dataset.type)});
  renderCommunityBoard();
}
function renderCommunityBoardFiltered(type){
  const root=document.getElementById("communityBoard");if(!root)return;const all=communityPosts();const filtered=type==="all"?all:all.filter(p=>p.type===type);
  const backup=localStorage.getItem("indiePohangCommunity");localStorage.setItem("indiePohangCommunity",JSON.stringify(filtered));renderCommunityBoard();localStorage.setItem("indiePohangCommunity",backup||"[]");
}
function openPostComposer(){
  let panel=document.getElementById("postComposer");if(!panel){
    panel=document.createElement("div");panel.id="postComposer";panel.className="share-panel";
    panel.innerHTML='<div class="share-sheet post-compose"><button class="close" id="closePost">×</button><div class="kicker">NEW COMMUNITY POST</div><h2>영화 이야기 남기기</h2>'+
      '<label>글 종류<select id="postType"><option>한줄평</option><option>긴 비평</option><option>GV 후기</option><option>추천</option><option>질문</option></select></label>'+
      '<label>영화<select id="postMovie"></select></label><label>제목<input id="postTitle" maxlength="80" placeholder="제목"></label><label>본문<textarea id="postBody" maxlength="5000" placeholder="영화에 대해 자유롭게 써보세요"></textarea></label>'+
      '<div class="post-meta-grid"><label>별점<input id="postRating" type="number" min="0" max="5" step="0.5" value="0"></label><label>태그<input id="postTags" placeholder="#독립영화 #GV"></label><label class="check"><input id="postSpoiler" type="checkbox"> 스포일러 포함</label></div>'+
      '<div class="share-actions"><button class="primary" id="publishPost">게시하기</button><button class="ghostbtn" id="savePostMagazine">게시+잡지 보관</button></div><small>현재 커뮤니티 베타는 이 기기에 저장됩니다. SNS 로그인/클라우드가 연결되면 계정 간 동기화할 수 있습니다.</small></div>';
    document.body.appendChild(panel);document.getElementById("closePost").onclick=()=>panel.classList.remove("open");panel.addEventListener("click",e=>{if(e.target===panel)panel.classList.remove("open")});
    document.getElementById("publishPost").onclick=()=>submitPost(false);document.getElementById("savePostMagazine").onclick=()=>submitPost(true);
  }
  const sel=document.getElementById("postMovie");sel.innerHTML=Object.entries(MOVIES).map(([c,m])=>'<option value="'+c+'">'+esc(m.title)+'</option>').join("");
  document.getElementById("postType").value="한줄평";document.getElementById("postTitle").value="";document.getElementById("postBody").value="";document.getElementById("postRating").value="0";document.getElementById("postTags").value="";document.getElementById("postSpoiler").checked=false;panel.classList.add("open");
}
function submitPost(makeMagazine){
  const code=document.getElementById("postMovie").value,body=document.getElementById("postBody").value.trim();if(!body)return toast("본문을 입력해주세요.");
  const post=createPost({code,type:document.getElementById("postType").value,title:document.getElementById("postTitle").value.trim(),body,rating:Number(document.getElementById("postRating").value||0),tags:document.getElementById("postTags").value.split(/[\s,]+/).map(x=>x.replace(/^#/,"")).filter(Boolean),spoiler:document.getElementById("postSpoiler").checked});
  document.getElementById("postComposer").classList.remove("open");if(makeMagazine)saveAsMagazine(post.id);toast("커뮤니티에 글을 저장했습니다.");
}
function injectProfileLogin(){
  const nav=document.querySelector(".nav-actions");if(!nav||document.getElementById("profileBtnV05"))return;
  const btn=document.createElement("button");btn.id="profileBtnV05";btn.className="chipbtn";btn.textContent="프로필";btn.onclick=openProfilePanel;nav.prepend(btn);
  const old=document.getElementById("accountPanel");if(old){old.querySelectorAll("[data-social]").forEach(b=>b.onclick=openProfilePanel)}
}
function openProfilePanel(){
  const p=userProfile();let panel=document.getElementById("profilePanelV05");
  if(!panel){
    panel=document.createElement("div");panel.id="profilePanelV05";panel.className="share-panel";
    panel.innerHTML='<div class="share-sheet profile-sheet"><button class="close" id="closeProfile">×</button><div class="kicker">ACCOUNT / PROFILE</div><h2>내 영화 프로필</h2><label>닉네임<input id="profileNickname" maxlength="24"></label><label>한줄소개<input id="profileBio" maxlength="80"></label><div class="profile-stats" id="profileStats"></div>'+
      '<button class="primary" id="saveProfileV05">기기 프로필 저장</button><div class="oauth-divider"><span>클라우드 계정 연결</span></div><div class="oauth-buttons"><button data-oauth="google">G · Google</button><button data-oauth="kakao">K · Kakao</button><button data-oauth="naver">N · Naver</button></div><small>OAuth 키가 연결되기 전까지는 모든 기록이 이 기기에 안전하게 저장됩니다.</small></div>';
    document.body.appendChild(panel);document.getElementById("closeProfile").onclick=()=>panel.classList.remove("open");panel.addEventListener("click",e=>{if(e.target===panel)panel.classList.remove("open")});
    document.getElementById("saveProfileV05").onclick=()=>{const cur=userProfile();cur.nickname=document.getElementById("profileNickname").value.trim()||"포항의 관객";cur.bio=document.getElementById("profileBio").value.trim();saveProfile(cur);panel.classList.remove("open");renderCommunityBoard();toast("프로필을 저장했습니다.")};
    panel.querySelectorAll("[data-oauth]").forEach(b=>b.onclick=()=>toast(b.dataset.oauth.toUpperCase()+" OAuth 키 연결 후 실제 로그인이 활성화됩니다."));
  }
  document.getElementById("profileNickname").value=p.nickname||"";document.getElementById("profileBio").value=p.bio||"";
  const posts=communityPosts().filter(x=>x.author===p.nickname).length,seen=watched().length,mag=magazineArchive().length;
  document.getElementById("profileStats").innerHTML='<span>본 영화 <b>'+seen+'</b></span><span>게시글 <b>'+posts+'</b></span><span>잡지 <b>'+mag+'</b></span>';
  panel.classList.add("open");
}
function initV05(){
  let tries=0;
  const wait=setInterval(()=>{
    tries++;
    if(live&&Object.keys(MOVIES||{}).length&&document.getElementById("community")){
      clearInterval(wait);
      injectCommunityStudio();renderCommunityBoard();renderMagazineArchive();injectProfileLogin();
      const shareBtn=document.getElementById("detailShare");if(shareBtn)shareBtn.onclick=()=>openSharePanelV05(activeMovieCode);
      const saveReviewBtn=document.getElementById("saveReview");
      if(saveReviewBtn&&!saveReviewBtn.dataset.v05){
        saveReviewBtn.dataset.v05="1";
        saveReviewBtn.addEventListener("click",()=>setTimeout(()=>{const latest=reviews().slice(-1)[0];if(latest?.code){const existing=communityPosts().some(p=>p.body===latest.text&&p.code===latest.code);if(!existing)createPost({code:latest.code,type:"한줄평",title:"",body:latest.text,rating:0,tags:[],spoiler:false})}},50));
      }
    }
    if(tries>100)clearInterval(wait);
  },100);
}
initV05();
