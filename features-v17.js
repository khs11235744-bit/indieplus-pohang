// INDIE PORT v0.17 — local photo crop, library search/filter, admin order
let V17_CROP={img:null,zoom:1,x:0,y:0};
const v17Order=()=>JSON.parse(localStorage.getItem("indiePortMagazineOrder")||"[]");
const v17SaveOrder=a=>localStorage.setItem("indiePortMagazineOrder",JSON.stringify(a));
function sortMagazineAdminOrderV17(arr){
  const order=v17Order(),rank=new Map(order.map((id,i)=>[id,i]));
  return arr.slice().sort((a,b)=>{
    const ai=rank.has(a.id)?rank.get(a.id):9999,bi=rank.has(b.id)?rank.get(b.id):9999;
    if(ai!==bi)return ai-bi;
    return String(a.sourceDate||"").localeCompare(String(b.sourceDate||""));
  });
}

function v17InstallPhotoCrop(){
  const panel=document.getElementById("magAdminPanel");if(!panel||panel.querySelector("#v17PhotoUpload"))return;
  const box=document.createElement("section");box.className="v17-photo-upload";
  box.innerHTML='<div class="kicker">LOCAL PHOTO CROP</div><label class="v17-file-label">휴대폰/PC 사진 추가<input id="v17PhotoUpload" type="file" accept="image/*"></label>'+
    '<div id="v17CropBox" hidden><canvas id="v17CropCanvas" width="900" height="506"></canvas><div class="v17-crop-controls">'+
    '<label>확대 <input id="v17CropZoom" type="range" min="1" max="3" step="0.05" value="1"></label>'+
    '<label>좌우 <input id="v17CropX" type="range" min="-100" max="100" step="1" value="0"></label>'+
    '<label>상하 <input id="v17CropY" type="range" min="-100" max="100" step="1" value="0"></label>'+
    '<button class="primary" id="v17ApplyCrop">16:9 사진으로 추가</button></div></div>';
  panel.querySelector(".mag-admin-grid")?.insertAdjacentElement("afterend",box);
  document.getElementById("v17PhotoUpload").onchange=e=>{const f=e.target.files?.[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{const img=new Image();img.onload=()=>{V17_CROP={img,zoom:1,x:0,y:0};document.getElementById("v17CropBox").hidden=false;["v17CropZoom","v17CropX","v17CropY"].forEach(id=>document.getElementById(id).value=id==="v17CropZoom"?1:0);v17DrawCrop()};img.src=rd.result};rd.readAsDataURL(f)};
  ["v17CropZoom","v17CropX","v17CropY"].forEach(id=>document.getElementById(id).oninput=()=>{V17_CROP.zoom=Number(document.getElementById("v17CropZoom").value);V17_CROP.x=Number(document.getElementById("v17CropX").value);V17_CROP.y=Number(document.getElementById("v17CropY").value);v17DrawCrop()});
  document.getElementById("v17ApplyCrop").onclick=v17ApplyCrop;
}
function v17DrawCrop(){
  const c=document.getElementById("v17CropCanvas"),img=V17_CROP.img;if(!c||!img)return;const ctx=c.getContext("2d"),w=c.width,h=c.height,base=Math.max(w/img.width,h/img.height),scale=base*V17_CROP.zoom,sw=w/scale,sh=h/scale,maxX=Math.max(0,(img.width-sw)/2),maxY=Math.max(0,(img.height-sh)/2),sx=Math.max(0,Math.min(img.width-sw,(img.width-sw)/2+maxX*V17_CROP.x/100)),sy=Math.max(0,Math.min(img.height-sh,(img.height-sh)/2+maxY*V17_CROP.y/100));
  ctx.fillStyle="#08090a";ctx.fillRect(0,0,w,h);ctx.drawImage(img,sx,sy,sw,sh,0,0,w,h);ctx.strokeStyle="rgba(216,255,67,.85)";ctx.lineWidth=3;ctx.strokeRect(2,2,w-4,h-4);
}
function v17ApplyCrop(){
  const c=document.getElementById("v17CropCanvas"),ta=document.getElementById("magPhotoUrlsAdmin");if(!c||!ta)return;
  const out=document.createElement("canvas");out.width=1280;out.height=720;out.getContext("2d").drawImage(c,0,0,1280,720);
  const data=out.toDataURL("image/jpeg",.8),arr=ta.value.split(/\n+/).map(x=>x.trim()).filter(Boolean);arr.push(data);ta.value=arr.join("\n");MAG_STUDIO.photos=arr;renderMagStillPickerV2();renderMagazinePreviewV2();renderCardNewsV2();toast("크롭한 사진을 관리자 원고에 추가했습니다.");
}

function v17LibraryItems(){
  return sortMagazineAdminOrderV17(magazineV2().filter(isCriticismLongformV2));
}
function v17InjectLibraryTools(){
  const shelf=document.getElementById("magazineShelfV2");if(!shelf)return;
  let box=document.getElementById("v17LibraryBrowser");if(box)box.remove();
  const items=v17LibraryItems(),years=[...new Set(items.map(x=>String(x.year||String(x.sourceDate||"").slice(0,4))).filter(Boolean))].sort().reverse();
  box=document.createElement("section");box.id="v17LibraryBrowser";box.className="v17-library-browser";
  box.innerHTML='<div class="v17-library-head"><div><div class="kicker">CRITICISM LIBRARY</div><h4>비평 찾아보기</h4></div><span>'+items.length+'편</span></div>'+
    '<div class="v17-library-filter"><input id="v17LibQuery" type="search" placeholder="제목·작품·태그 검색"><select id="v17LibYear"><option value="">전체 연도</option>'+years.map(y=>'<option>'+y+'</option>').join("")+'</select><select id="v17LibPreset"><option value="">전체 디자인</option>'+[...new Set(items.map(x=>x.preset).filter(Boolean))].map(p=>'<option value="'+p+'">'+magPreset(p).name+'</option>').join("")+'</select></div><div class="v17-library-list" id="v17LibraryList"></div>';
  const admin=document.querySelector(".mag-admin-library"),annual=document.querySelector(".annual-cover-card");(admin||annual||shelf.firstChild)?.insertAdjacentElement(admin?"beforebegin":"afterend",box);
  ["v17LibQuery","v17LibYear","v17LibPreset"].forEach(id=>document.getElementById(id).addEventListener("input",v17RenderLibraryList));v17RenderLibraryList();
}
function v17RenderLibraryList(){
  const root=document.getElementById("v17LibraryList");if(!root)return;const q=(document.getElementById("v17LibQuery")?.value||"").trim().toLowerCase(),year=document.getElementById("v17LibYear")?.value||"",preset=document.getElementById("v17LibPreset")?.value||"";
  const items=v17LibraryItems().filter(x=>{const hay=[x.filmTitle,x.headline,x.deck,...(x.tags||[])].join(" ").toLowerCase();return(!q||hay.includes(q))&&(!year||String(x.year||x.sourceDate||"").startsWith(year))&&(!preset||x.preset===preset)});
  root.innerHTML=items.map((x,i)=>'<article class="v17-library-item" draggable="'+(magAdminEnabled()?"true":"false")+'" data-v17-id="'+esc(x.id)+'"><span class="v17-drag">'+(magAdminEnabled()?"☰":"0"+(i+1))+'</span><div><small>'+esc(String(x.year||"2026"))+' · '+esc(x.issue||"")+'</small><b>'+esc(x.filmTitle||x.title||"")+'</b><p>'+esc(x.headline||"")+'</p><em>'+(x.tags||[]).slice(0,3).map(t=>"#"+esc(t)).join(" ")+'</em></div><div class="v17-library-actions"><button data-v17-read="'+esc(x.id)+'">읽기</button>'+(magAdminEnabled()?'<button data-v17-edit="'+esc(x.id)+'">편집</button>':"")+'</div></article>').join("")||'<div class="empty">조건에 맞는 비평이 없습니다.</div>';
  root.querySelectorAll("[data-v17-read]").forEach(b=>b.onclick=()=>{openMagazineAnnualV2();setTimeout(()=>goAnnualTargetV2(b.dataset.v17Read),60)});
  root.querySelectorAll("[data-v17-edit]").forEach(b=>b.onclick=()=>openMagazineStudioV2(b.dataset.v17Edit));
  if(magAdminEnabled())v17BindDragOrder();
}
function v17BindDragOrder(){
  const rows=[...document.querySelectorAll("#v17LibraryList .v17-library-item")];let dragged=null;
  rows.forEach(row=>{row.ondragstart=()=>{dragged=row;row.classList.add("dragging")};row.ondragend=()=>{row.classList.remove("dragging");dragged=null};row.ondragover=e=>e.preventDefault();row.ondrop=e=>{e.preventDefault();if(!dragged||dragged===row)return;const root=row.parentElement,rect=row.getBoundingClientRect();root.insertBefore(dragged,e.clientY<rect.top+rect.height/2?row:row.nextSibling);const visible=[...root.querySelectorAll("[data-v17-id]")].map(x=>x.dataset.v17Id),all=v17Order(),rest=all.filter(id=>!visible.includes(id)),fallback=v17LibraryItems().map(x=>x.id).filter(id=>!visible.includes(id)&&!rest.includes(id));v17SaveOrder([...visible,...rest,...fallback]);renderMagazineShelfV2();toast("잡지 목차 순서를 저장했습니다.")}});
}

(function initV17(){
  const baseShelf=renderMagazineShelfV2;renderMagazineShelfV2=function(){baseShelf();v17InjectLibraryTools()};
  const baseOpen=openMagazineStudioV2;openMagazineStudioV2=function(...args){const r=baseOpen(...args);setTimeout(v17InstallPhotoCrop,0);return r};
  setTimeout(()=>{if(document.getElementById("magazineShelfV2"))v17InjectLibraryTools()},500);
})();
