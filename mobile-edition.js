/* INDI+P mobile edition 34. Presentation only; existing auth, editor and data owners remain unchanged. */
(() => {
  'use strict';
  const VERSION='mobile-35', media=matchMedia('(max-width:760px)');
  const S=window.INDIP_MOBILE_EDITION={version:VERSION,ready:false};
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl=v=>{if(!v||!String(v).trim())return '';try{const u=new URL(v,location.href);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
  const books=()=>{try{return typeof magazineV2==='function'?magazineV2().filter(x=>x.sample&&!x.example&&!x.excerptOnly):[]}catch{return []}};
  const chosenId='archive-sentimental-2026';
  const expandedNews=new Set();let observedNews=null;
  let portraitData={},observedList=null,masterObserved=false,pending=false,booted=false;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function jump(id){const e=document.getElementById(id);if(e)e.scrollIntoView({behavior:reduced()?'auto':'smooth',block:'start'});}
  function read(id){
    if(typeof openMagazineAnnualV2!=='function')return;
    openMagazineAnnualV2();
    if(typeof setAnnualViewModeV2==='function')setAnnualViewModeV2('scroll');
    requestAnimationFrame(()=>{const target=document.getElementById('annual-'+id);if(target){target.scrollIntoView({behavior:'auto',block:'start'});const h=$('h2',target);if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}});
  }
  function makeFront(){
    if($('#m33Front'))return;
    const main=$('#home');if(!main)return;
    const front=document.createElement('section');front.id='m33Front';front.className='m33-front';front.setAttribute('aria-label','모바일 매거진 첫 화면');
    const date=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    front.innerHTML='<div class="m33-edition"><span>포항에서 시작하는 영화와 비평</span><small>모바일판 34</small></div><div id="m33Cover" aria-busy="true"><p class="m33-loading">이번 호의 비평을 불러옵니다.</p></div><nav class="m33-shortcuts" aria-label="자주 찾는 코너"><button data-m33-go="schedule">상영시간표<span aria-hidden="true">↗</span></button><button data-m33-go="criticism">비평집<span aria-hidden="true">↗</span></button><button data-m33-go="v30Dictionary">영화사전<span aria-hidden="true">↗</span></button><button data-m33-go="v30Phcf">문화소식<span aria-hidden="true">↗</span></button></nav><div class="m33-date">'+esc(date)+'</div>';
    main.prepend(front);
  }
  function renderCover(){
    const root=$('#m33Cover'),all=books(),item=all.find(x=>x.id===chosenId)||all.find(x=>x.photos?.length);
    if(!root||!item||root.dataset.item===item.id)return;
    const photo=safeUrl(item.photos?.[1]||item.photos?.[0]||'');
    root.innerHTML='<article class="m33-feature"><button class="m33-photo" data-m33-read="'+esc(item.id)+'" aria-label="'+esc(item.filmTitle)+' 비평 읽기">'+(photo?'<img src="'+esc(photo)+'" alt="'+esc(item.filmTitle)+' 비평에 수록된 장면" width="720" height="440" fetchpriority="high" decoding="async">':'')+'<span>이번 호의 비평</span></button><div class="m33-feature-meta">'+esc(item.filmTitle)+'<span>글 '+esc(item.author||'편집부')+'</span></div><h2><button data-m33-read="'+esc(item.id)+'">'+esc(item.headline)+'<span aria-hidden="true">↗</span></button></h2><p>'+esc(item.deck)+'</p></article>';
    root.dataset.item=item.id;root.setAttribute('aria-busy','false');S.ready=true;
  }
  function decorateLibrary(){
    const list=$('#v17LibraryList');if(!list)return;
    const byId=new Map(books().map(x=>[x.id,x]));
    $$('.v17-library-item',list).forEach((row,index)=>{
      const number=$('.v17-drag',row),label=String(index+1).padStart(2,'0');if(number&&number.textContent!=='☰'&&number.textContent!==label)number.textContent=label;
      if(row.dataset.m33Decorated)return;
      const item=byId.get(row.dataset.v17Id);if(!item)return;
      const photo=safeUrl(item.photos?.[0]||'');
      if(photo){const img=document.createElement('img');img.className='m33-library-photo';img.src=photo;img.alt=item.filmTitle+' 비평 표지';img.loading='lazy';img.width=84;img.height=118;row.prepend(img);row.classList.add('m33-with-photo');}
      const readBtn=$('[data-v17-read]',row);if(readBtn)readBtn.setAttribute('aria-label',item.filmTitle+' 장문 비평 읽기');
      row.dataset.m33Decorated='1';
    });
    const shelf=$('#magazineShelfV2');
    if(shelf&&!$('#m33Revised',shelf)){
      const recent=books().filter(x=>['archive-monster-koreeda-2026','archive-handmaiden-long'].includes(x.id));
      if(recent.length){const box=document.createElement('div');box.id='m33Revised';box.innerHTML='<span>고쳐 쓴 비평</span>'+recent.map(x=>'<button data-m33-read="'+esc(x.id)+'">'+esc(x.filmTitle)+'<span aria-hidden="true">↗</span></button>').join('');shelf.prepend(box);}
    }
    if(observedList!==list){S.listObserver?.disconnect();observedList=list;S.listObserver=new MutationObserver(decorateLibrary);S.listObserver.observe(list,{childList:true});}
    const coverImg=$('#openAnnualMagazine>img');if(coverImg&&!coverImg.getAttribute('src'))coverImg.removeAttribute('src');
  }
  function decorateNews(){
    const tracker=$('#newsroom .source-tracker-block');
    if(tracker&&!$('#m33Sources')){
      const toggle=document.createElement('button');toggle.id='m33Sources';toggle.className='m33-disclosure';toggle.type='button';toggle.textContent='영화제·영화관 바로가기';toggle.setAttribute('aria-expanded','false');tracker.id=tracker.id||'m33SourceDirectory';toggle.setAttribute('aria-controls',tracker.id);tracker.before(toggle);
      toggle.onclick=()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));tracker.classList.toggle('m33-source-open',open);};
    }
    const grid=$('#newsGrid');if(grid&&observedNews!==grid){S.newsObserver?.disconnect();observedNews=grid;S.newsObserver=new MutationObserver(decorateNews);S.newsObserver.observe(grid,{childList:true});}
    $$('#newsroom .news-card').forEach((card,index)=>{
      const key=$('.news-actions a',card)?.href||$('h3',card)?.textContent||String(index);card.dataset.m33NewsKey=key;card.classList.toggle('m33-news-open',expandedNews.has(key));
      if(!$('.m33-news-index',card)){const no=document.createElement('span');no.className='m33-news-index';no.textContent=String(index+1).padStart(2,'0');card.prepend(no);}
      if(!$('.m33-news-expand',card)&&$('.news-why,.news-keypoints,.news-source-details',card)){
        const btn=document.createElement('button');btn.className='m33-news-expand';btn.textContent='기사 맥락 펼치기';btn.setAttribute('aria-expanded','false');card.append(btn);if(expandedNews.has(key)){btn.setAttribute('aria-expanded','true');btn.textContent='접기';}
        btn.onclick=()=>{const open=!expandedNews.has(key);if(open)expandedNews.add(key);else expandedNews.delete(key);card.classList.toggle('m33-news-open',open);btn.setAttribute('aria-expanded',String(open));btn.textContent=open?'접기':'기사 맥락 펼치기';};
      }
    });
  }
  function decoratePortrait(){
    const body=$('#v30MasterBody'),panel=$('#v30Master');if(!body||!panel)return;
    const name=($('small',body)?.textContent||'').split(' · ')[0],p=portraitData[name];
    if(panel.dataset.portraitFor===name)return;
    $('.m33-portrait',panel)?.remove();
    panel.classList.toggle('m33-has-portrait',!!p);panel.dataset.portraitFor=name;
    if(!p)return;
    const kind=p.kind==='signature'?'signature':'photo';const fig=document.createElement('figure');fig.className='m33-portrait m33-'+kind;
    const mediaLabel=kind==='signature'?'서명':'사진';fig.innerHTML='<img src="'+esc(safeUrl(p.path))+'" alt="'+esc($('b',body)?.textContent||name)+(kind==='signature'?' 서명':' 사진')+'" width="480" height="580" loading="lazy"><figcaption><a href="'+esc(safeUrl(p.source))+'" target="_blank" rel="noopener">'+mediaLabel+': '+esc(p.creator||name)+' · '+esc(p.license)+'</a></figcaption>';
    body.before(fig);
  }
  function localizeCulture(){
    const head=$('#cultureLab .v30-lab-head h2');
    if(head&&!head.dataset.m33Original){head.dataset.m33Original=head.textContent;}
    if(head){const text=media.matches?'영화의 곁':head.dataset.m33Original;if(head.textContent!==text)head.textContent=text;}
    const p=$('#cultureLab .v30-lab-head p');
    if(p&&!p.dataset.m33Original)p.dataset.m33Original=p.textContent;
    if(p){const text=media.matches?'감독의 작업 노트, 영화사전, 그리고 포항의 문화소식.':p.dataset.m33Original;if(p.textContent!==text)p.textContent=text;}
    const master=$('#v30MasterBody');
    if(master&&!masterObserved){masterObserved=true;new MutationObserver(decoratePortrait).observe(master,{childList:true});}
    decoratePortrait();
  }
  function markLocation(){
    pending=false;if(!media.matches)return;
    let area='home';
    const anchors=[['schedule','discover'],['discover','discover'],['criticism','criticism'],['cultureLab','home'],['newsroom','newsroom'],['community','community'],['my','my']];
    for(const [id,tab] of anchors){const e=document.getElementById(id);if(!e)continue;const r=e.getBoundingClientRect();if(r.top<innerHeight*.42&&r.bottom>100){area=tab;break;}}
    document.body.dataset.m33Area=area;
    $$('.mobile-nav [data-scroll]').forEach(b=>{const on=b.dataset.scroll===area;b.classList.toggle('m33-active',on);if(on)b.setAttribute('aria-current','location');else b.removeAttribute('aria-current');});
  }
  function scan(){
    renderCover();decorateLibrary();decorateNews();localizeCulture();
    const strip=$('.data-strip')?.parentElement;if(strip)strip.classList.add('m33-sync-strip');
    markLocation();
  }
  function applyMode(){document.body.classList.toggle('mobile-edition',media.matches);document.body.dataset.uiRelease=VERSION;localizeCulture();markLocation();}
  function revealUpdate(){
    if($('#m33Update'))return;
    const n=document.createElement('aside');n.id='m33Update';n.className='m33-update';n.setAttribute('role','status');n.innerHTML='<span>새 화면이 준비되었습니다.</span><button type="button">적용하기</button>';
    $('button',n).onclick=()=>{const draft=$$('.share-panel.open textarea,.overlay.open textarea').some(x=>x.value.trim());if(draft){$('span',n).textContent='작성 중인 글을 저장한 뒤 새로고침해 주세요.';return;}location.reload();};document.body.append(n);
  }
  async function checkRelease(){try{const r=await fetch('./data/ui-release.json',{cache:'no-store'});if(r.ok){const v=await r.json();if(v.id&&v.id!==VERSION)revealUpdate();}}catch{/* Offline: preserve the current screen and drafts. */}}
  function init(){
    if(booted)return;booted=true;makeFront();applyMode();scan();
    let retries=0;const boot=setInterval(()=>{scan();if(++retries>=32)clearInterval(boot)},350);
    document.addEventListener('click',e=>{const readBtn=e.target.closest('[data-m33-read]');if(readBtn){e.preventDefault();read(readBtn.dataset.m33Read);return;}const go=e.target.closest('[data-m33-go]');if(go){jump(go.dataset.m33Go);return;}
      if(e.target.closest('#newsFilter,#v30PhcfTabs,#boardFilter'))setTimeout(scan,50);
    });
    window.addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(markLocation)}},{passive:true});media.addEventListener('change',applyMode);
    fetch('./data/director-portraits.json',{cache:'force-cache'}).then(r=>r.ok?r.json():null).then(d=>{portraitData=d?.portraits||{};const p=$('#v30Master');if(p)delete p.dataset.portraitFor;decoratePortrait();}).catch(()=>{});
    if('serviceWorker' in navigator){navigator.serviceWorker.addEventListener('controllerchange',checkRelease);navigator.serviceWorker.getRegistration().then(r=>r?.update()).catch(()=>{});}
    window.addEventListener('pageshow',checkRelease);checkRelease();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
