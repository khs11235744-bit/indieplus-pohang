(()=>{'use strict';
const V42=window.INDIP_V42={version:'43.0.0',portraits:{},wikiCache:{},masterObserver:null};
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function loadPortraitMap(){
  try{
    const r=await fetch('./data/director-portraits.json',{cache:'no-store'});
    if(r.ok){const d=await r.json();V42.portraits=d?.portraits||{};}
  }catch{}
}
function currentDirectorName(){
  const small=$('#v30MasterBody small');return (small?.textContent||'').split(' · ')[0].trim();
}
async function wikiPortrait(name){
  if(!name)return null;
  if(V42.wikiCache[name]!==undefined)return V42.wikiCache[name];
  try{
    const u='https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages|info&inprop=url&piprop=thumbnail&pithumbsize=720&redirects=1&titles='+encodeURIComponent(name);
    const r=await fetch(u,{cache:'force-cache'});
    const j=await r.json();const p=Object.values(j?.query?.pages||{})[0];
    const out=p?.thumbnail?.source?{path:p.thumbnail.source,source:p.fullurl||('https://en.wikipedia.org/wiki/'+encodeURIComponent(name.replace(/ /g,'_'))),creator:'Wikipedia / Wikimedia',license:'source page',kind:'portrait'}:null;
    V42.wikiCache[name]=out;return out;
  }catch{V42.wikiCache[name]=null;return null}
}
async function portraitFor(name){
  return V42.portraits[name]||await wikiPortrait(name);
}
async function renderDirectorPortrait(){
  const body=$('#v30MasterBody'),panel=$('#v30Master');if(!body||!panel)return;
  const name=currentDirectorName();if(!name)return;
  if(panel.dataset.v42PortraitFor===name&&panel.querySelector('.v42-director-portrait'))return;
  panel.dataset.v42PortraitFor=name;
  panel.querySelectorAll('.v42-director-portrait,.m33-portrait').forEach(x=>x.remove());
  let layout=panel.querySelector('.v42-master-layout');
  if(!layout){
    layout=document.createElement('div');layout.className='v42-master-layout';
    body.before(layout);layout.appendChild(body);body.classList.add('v42-master-copy');
  }else if(body.parentElement!==layout){layout.appendChild(body)}
  const p=await portraitFor(name);
  if(panel.dataset.v42PortraitFor!==name||!p?.path)return;
  const fig=document.createElement('figure');fig.className='v42-director-portrait'+(p.kind==='signature'?' signature':'');
  const img=document.createElement('img');img.src=p.path;img.alt=name+' 사진';img.loading='eager';img.fetchPriority='low';img.decoding='async';
  const cap=document.createElement('figcaption');cap.innerHTML='<a href="'+esc(p.source||'#')+'" target="_blank" rel="noopener noreferrer">사진 출처 ↗</a>';
  fig.append(img,cap);layout.insertBefore(fig,body);
  setTimeout(prepareDirectorShare,30);
}
function observeMaster(){
  const body=$('#v30MasterBody');if(!body)return;
  V42.masterObserver?.disconnect();
  V42.masterObserver=new MutationObserver(()=>setTimeout(renderDirectorPortrait,20));
  V42.masterObserver.observe(body,{childList:true,subtree:true,characterData:true});
  renderDirectorPortrait();
}
function sharePackText(){
  const opts=typeof readV05Opts==='function'?readV05Opts():{};
  const m=(typeof MOVIES!=='undefined'&&typeof activeMovieCode!=='undefined')?MOVIES[activeMovieCode]:null;
  return [m?.title,opts?.text,(opts?.tags||[]).map(t=>'#'+t).join(' '),'https://indip.web.app'].filter(Boolean).join('\n');
}
function currentShareCache(){
  if(typeof readV05Opts!=='function'||typeof activeMovieCode==='undefined')return null;
  const cache=window.__indipShareCache,opts=readV05Opts();
  if(!cache?.ready||cache.code!==activeMovieCode)return null;
  const key=typeof shareCacheKeyV05==='function'?shareCacheKeyV05(activeMovieCode,opts):activeMovieCode+'|'+JSON.stringify(opts);
  return cache.key===key?cache:null;
}
async function makeCurrentShareBlob(){
  const cache=currentShareCache();if(cache?.blob)return cache.blob;
  if(typeof makeShareBlobV05!=='function'||typeof readV05Opts!=='function'||typeof activeMovieCode==='undefined')throw new Error('share renderer unavailable');
  return await makeShareBlobV05(activeMovieCode,readV05Opts());
}
async function copyImage(blob){
  if(!navigator.clipboard?.write||!window.ClipboardItem)return false;
  try{await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);return true}catch{return false}
}
async function copyText(text){try{await navigator.clipboard.writeText(text);return true}catch{return false}}
function setStatus(msg){
  const el=$('#sharePanelV05 .v42-share-status');if(el)el.textContent=msg;
  if(typeof toast==='function')toast(msg);
}
function nativeShareWithPhoto(){
  const panel=$('#sharePanelV05');panel?.classList.remove('v43-share-fallback-open');
  const cache=currentShareCache(),text=sharePackText();
  if(!cache?.file){
    setStatus('최신 공유 이미지를 준비 중입니다. 준비되면 바로 공유 버튼이 활성화됩니다.');
    if(typeof refreshV05Preview==='function')refreshV05Preview();
    return;
  }
  if(navigator.share){
    try{
      const fileCapable=!navigator.canShare||navigator.canShare({files:[cache.file]});
      const payload=fileCapable?{title:'INDI+P',text,files:[cache.file]}:{title:'INDI+P',text,url:'https://indip.web.app'};
      const promise=navigator.share(payload);
      Promise.resolve(promise).catch(e=>{if(e?.name!=='AbortError'){console.warn('native share',e);openShareFallback(cache.blob,text)}});
      return;
    }catch(e){console.warn('native share sync',e)}
  }
  openShareFallback(cache.blob,text);
}
function socialShare(kind){
  const cache=currentShareCache(),text=sharePackText();
  if(!cache?.blob){setStatus('공유 이미지를 준비 중입니다. 잠시 후 다시 눌러주세요.');if(typeof refreshV05Preview==='function')refreshV05Preview();return}
  const label=kind==='instagram'?'Instagram':kind==='threads'?'Threads':kind==='facebook'?'Facebook':'X';
  const target={instagram:'https://www.instagram.com/',threads:'https://www.threads.net/',facebook:'https://www.facebook.com/'}[kind]||'';
  if(kind==='x')window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(text),'_blank','noopener');
  else window.open(target,'_blank','noopener');
  copyImage(cache.blob).then(copied=>{
    if(copied)setStatus(label+'를 열었습니다. 공유 사진이 클립보드에 복사되었습니다.');
    else copyText(text).then(ok=>setStatus(ok?label+'를 열고 공유 문구를 복사했습니다.':'열린 '+label+'에서 직접 공유해 주세요.'));
  });
}
function openShareFallback(blob,text){
  const panel=$('#sharePanelV05');if(!panel)return;
  panel.classList.add('v43-share-fallback-open');
  setStatus('이 브라우저는 사진 파일 네이티브 공유가 제한됩니다. 아래 SNS를 선택하면 사진을 클립보드에 준비합니다.');
  if(blob)copyImage(blob).then(ok=>{if(!ok&&text)copyText(text)});
}
function installDesktopSocial(panel){
  if(!panel)return;
  const right=panel.querySelector('.v20-share-preview-pane'),actions=panel.querySelector('.share-actions');if(!right||!actions)return;
  const native=panel.querySelector('#nativeShareV05');if(native){native.textContent='바로 공유';native.onclick=nativeShareWithPhoto}
  if(panel.querySelector('.v42-social-share'))return;
  const row=document.createElement('div');row.className='v42-social-share';
  row.innerHTML='<button data-v42-social="instagram">Instagram</button><button data-v42-social="threads">Threads</button><button data-v42-social="x">X</button><button data-v42-social="facebook">Facebook</button><button class="v42-copy" data-v42-copy="image">사진 복사</button><button class="v42-copy" data-v42-copy="text">문구 복사</button>';
  const status=document.createElement('div');status.className='v42-share-status';status.textContent=navigator.share?'‘바로 공유’를 누르면 기기의 공유 메뉴로 사진을 넘깁니다.':'이 브라우저에서는 아래 SNS 버튼과 이미지 클립보드 공유를 사용합니다.';
  actions.insertAdjacentElement('afterend',row);row.insertAdjacentElement('afterend',status);
  row.addEventListener('click',async e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.v42Social){await socialShare(b.dataset.v42Social);return}
    if(b.dataset.v42Copy==='text'){if(await copyText(sharePackText()))setStatus('문구를 복사했습니다.');else setStatus('문구 복사 권한이 없어 직접 선택해 주세요.');return}
    if(b.dataset.v42Copy==='image'){const cache=currentShareCache();if(!cache?.blob){setStatus('공유 이미지를 준비 중입니다.');if(typeof refreshV05Preview==='function')refreshV05Preview();return}if(await copyImage(cache.blob))setStatus('사진을 클립보드에 복사했습니다.');else setStatus('이 브라우저가 이미지 클립보드를 지원하지 않습니다. 네이티브 공유 또는 문구 복사를 이용해 주세요.')}
  });
}
function patchShareOpen(){
  if(typeof openSharePanelV05!=='function'||V42.sharePatched)return;
  V42.sharePatched=true;const old=openSharePanelV05;
  openSharePanelV05=function(...args){const out=old.apply(this,args);const panel=$('#sharePanelV05');panel?.classList.remove('v43-share-fallback-open');setTimeout(()=>installDesktopSocial(panel),100);return out}
}
let directorShareCache={name:'',file:null,blob:null,ready:false};
async function prepareDirectorShare(){
  const body=$('#v30MasterBody');if(!body)return null;
  const name=currentDirectorName(),ko=body.querySelector('b')?.textContent||name,tag=body.querySelector('.v30-master-tag')?.textContent||'감독의 작업 노트',note=body.querySelector('.v38-master-note')?.textContent||'',source=(body.querySelector('small')?.textContent||'').split(' · ')[1]||'';
  if(directorShareCache.ready&&directorShareCache.name===name)return directorShareCache;
  directorShareCache={name,file:null,blob:null,ready:false};
  try{
    const p=await portraitFor(name),blob=await directorStoryBlob(name,ko,tag,note,source,p),file=new File([blob],'indip-director-note.png',{type:'image/png'});
    if(currentDirectorName()===name)directorShareCache={name,ko,note,file,blob,ready:true};
  }catch(e){console.warn('director share prepare',e)}
  return directorShareCache;
}
function loadImg(src){
  return new Promise((resolve,reject)=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=reject;img.src=src});
}
function drawCover(c,img,x,y,w,h){
  const s=Math.max(w/img.width,h/img.height),sw=w/s,sh=h/s,sx=(img.width-sw)/2,sy=(img.height-sh)/2;
  c.drawImage(img,sx,sy,sw,sh,x,y,w,h);
}
function wrap(c,text,x,y,max,line){
  const words=String(text||'').split(/\s+/);let row='';
  for(const word of words){const test=row?row+' '+word:word;if(c.measureText(test).width>max&&row){c.fillText(row,x,y);y+=line;row=word}else row=test}
  if(row)c.fillText(row,x,y);return y+line;
}
async function directorStoryBlob(name,ko,tag,note,source,portrait){
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;const c=canvas.getContext('2d');
  c.fillStyle='#0c0d0c';c.fillRect(0,0,1080,1920);
  if(portrait?.path){try{const img=await loadImg(portrait.path);c.save();c.globalAlpha=.92;drawCover(c,img,0,0,1080,850);c.restore();const g=c.createLinearGradient(0,420,0,1000);g.addColorStop(0,'rgba(12,13,12,0)');g.addColorStop(1,'#0c0d0c');c.fillStyle=g;c.fillRect(0,360,1080,700)}catch{}}
  c.fillStyle='#d8ff43';c.fillRect(76,80,8,1760);
  c.fillStyle='#f2efe7';c.font='700 32px sans-serif';c.fillText('INDI+P · DIRECTOR NOTE',116,145);
  c.fillStyle='#9da39b';c.font='600 28px sans-serif';c.fillText(tag||'감독의 작업 노트',116,930);
  c.fillStyle='#fff';c.font='800 72px sans-serif';let y=wrap(c,ko||name,116,1040,850,88);
  c.fillStyle='#d7d2c9';c.font='500 39px sans-serif';y=wrap(c,note,116,y+60,850,58);
  c.fillStyle='#858d85';c.font='500 25px sans-serif';wrap(c,(source||'')+' · INDI+P 편집 해설',116,1700,850,38);
  c.fillStyle='#d8ff43';c.font='800 30px sans-serif';c.fillText('indip.web.app',116,1810);
  return await new Promise(res=>canvas.toBlob(res,'image/png',.94));
}
function shareDirectorStory(){
  const cache=directorShareCache,name=currentDirectorName();
  if(!cache.ready||cache.name!==name||!cache.file){if(typeof toast==='function')toast('감독 사진 공유카드를 준비 중입니다. 잠시 후 다시 눌러주세요.');prepareDirectorShare();return}
  if(navigator.share){
    try{
      const fileCapable=!navigator.canShare||navigator.canShare({files:[cache.file]});
      const payload=fileCapable?{files:[cache.file],title:cache.ko,text:cache.note}:{title:cache.ko,text:cache.note,url:'https://indip.web.app'};
      Promise.resolve(navigator.share(payload)).catch(e=>{if(e?.name!=='AbortError')copyImage(cache.blob).then(ok=>typeof toast==='function'&&toast(ok?'사진을 클립보드에 복사했습니다.':'이 브라우저의 사진 공유가 제한됩니다.'))});
      return;
    }catch(e){console.warn('director native share',e)}
  }
  copyImage(cache.blob).then(ok=>{if(typeof toast==='function')toast(ok?'감독 사진 카드를 클립보드에 복사했습니다.':'이 브라우저에서는 사진 직접 공유가 제한됩니다.')});
}
function interceptDirectorShare(){
  document.addEventListener('click',e=>{const b=e.target.closest('[data-v30-share="master"]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();shareDirectorStory();},true);
}
Object.assign(V42,{portraitFor,directorStoryBlob,makeCurrentShareBlob,nativeShareWithPhoto,shareDirectorStory,currentShareCache,prepareDirectorShare});
async function init(){
  await loadPortraitMap();observeMaster();patchShareOpen();
  setTimeout(()=>{observeMaster();patchShareOpen();if($('#sharePanelV05'))installDesktopSocial($('#sharePanelV05'))},900);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();