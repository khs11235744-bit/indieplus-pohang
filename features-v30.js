// INDI+P v30 — Cinema Culture Lab + Pohang Cultural Foundation live feed.
(() => {
  const V30 = window.INDIP_V30 = window.INDIP_V30 || {};
  V30.version = '30.0.0';
  V30.phcf = null;
  V30.tab = 'notice';

  const E = (s,r=document)=>r.querySelector(s);
  const EA = (s,r=document)=>[...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const MUSIC_ROOMS = [
    {key:'leitmotif',label:'ROOM 01 · LEITMOTIF',title:'인물을 따라다니는 선율',body:'같은 멜로디가 인물·기억·장소와 함께 되돌아올 때, 음악은 설명이 아니라 서사의 기억 장치가 됩니다.',term:'라이트모티프'},
    {key:'diegetic',label:'ROOM 02 · SOURCE MUSIC',title:'화면 안에서 실제로 흐르는 음악',body:'라디오·공연장·이어폰처럼 인물도 듣는 음악을 구분하면, 장면이 누구의 감각에 가까운지 보이기 시작합니다.',term:'디제시스 사운드'},
    {key:'needle',label:'ROOM 03 · NEEDLE DROP',title:'이미 아는 노래가 장면을 바꿀 때',body:'기성곡은 가사·시대·개인적 기억까지 한꺼번에 불러옵니다. 같은 장면도 어떤 곡을 얹느냐에 따라 전혀 다른 영화가 됩니다.',term:'니들 드롭'},
    {key:'silence',label:'ROOM 04 · SILENCE',title:'음악이 사라지는 순간',body:'음악이 멈춘 뒤 남는 숨소리·발소리·룸톤은 감정을 더 직접적으로 만들 수 있습니다. 침묵도 하나의 음악적 선택입니다.',term:'룸톤'}
  ];

  const MASTER_NOTES = [
    {name:'Alfred Hitchcock',ko:'알프레드 히치콕',source:'Hitchcock/Truffaut',note:'관객이 위험을 먼저 알고 인물은 모를 때, 놀람보다 오래 지속되는 서스펜스가 만들어진다.',tag:'서스펜스',disclaimer:'작업론 의역'},
    {name:'Robert Bresson',ko:'로베르 브레송',source:'Notes on the Cinematograph',note:'이미지가 충분히 말한 것을 소리로 반복하지 말고, 소리가 말한 것을 이미지로 되풀이하지 않는다.',tag:'이미지와 소리',disclaimer:'작업론 의역'},
    {name:'Andrei Tarkovsky',ko:'안드레이 타르콥스키',source:'Sculpting in Time',note:'영화는 사건을 배열하는 일만이 아니라, 한 숏 안에 흐르는 시간을 포착하고 조각하는 예술에 가깝다.',tag:'시간',disclaimer:'작업론 의역'},
    {name:'Agnès Varda',ko:'아녜스 바르다',source:'The Gleaners and I 및 인터뷰 작업론',note:'영화 만들기는 사람과 장소에서 버려질 뻔한 조각을 줍고, 새로운 관계 속에 다시 놓는 일이 될 수 있다.',tag:'관찰과 수집',disclaimer:'작업론 의역'},
    {name:'Akira Kurosawa',ko:'구로사와 아키라',source:'Something Like an Autobiography',note:'연출은 카메라 기술만으로 생기지 않는다. 많이 읽고, 많이 보고, 끝까지 쓰는 힘이 영화의 토대가 된다.',tag:'연출과 글쓰기',disclaimer:'작업론 의역'}
  ];

  const TERMS = [
    ['라이트모티프','Leitmotif','특정 인물·장소·감정과 반복적으로 연결되는 음악적 테마. 다시 들릴 때 이전 장면의 기억까지 불러옵니다.','사운드'],
    ['디제시스 사운드','Diegetic Sound','영화 속 인물도 들을 수 있는 소리. 라디오, 공연, 문 닫는 소리처럼 화면 세계 안에 출처가 있습니다.','사운드'],
    ['니들 드롭','Needle Drop','기존에 발표된 곡을 특정 장면에 배치하는 방식. 곡이 가진 문화적 기억까지 장면에 들어옵니다.','사운드'],
    ['룸톤','Room Tone','대사가 없어도 공간에 깔려 있는 미세한 환경음. 장면의 공기와 공간감을 이어주는 소리입니다.','사운드'],
    ['사운드 브리지','Sound Bridge','다음 장면의 소리가 화면보다 먼저 들리거나 이전 장면의 소리가 다음 컷까지 이어지는 전환 방식입니다.','사운드'],
    ['미장센','Mise-en-scène','프레임 안에 배치되는 인물·공간·조명·의상·소품·움직임을 포함한 시각적 구성 전체입니다.','화면'],
    ['블로킹','Blocking','장면 안에서 배우가 어디에 서고 어떻게 움직이는지 설계하는 일. 관계와 권력을 시각화합니다.','연기'],
    ['롱테이크','Long Take','한 숏을 비교적 오래 유지하는 촬영 방식. 시간의 지속과 배우·카메라의 움직임 자체가 서사가 됩니다.','촬영'],
    ['딥 포커스','Deep Focus','전경부터 배경까지 넓은 범위를 선명하게 보여주는 초점 방식. 관객이 화면 안에서 시선을 선택하게 합니다.','촬영'],
    ['얕은 심도','Shallow Depth of Field','초점이 맞는 범위를 좁혀 주인공이나 특정 사물을 배경에서 분리하는 방식입니다.','촬영'],
    ['매치 컷','Match Cut','형태·동작·의미가 닮은 두 이미지를 이어 붙여 장면 사이에 시각적 또는 개념적 연결을 만드는 컷입니다.','편집'],
    ['점프 컷','Jump Cut','같은 피사체의 시간이나 위치가 불연속적으로 튀어 보이게 이어 붙이는 컷. 시간의 균열을 드러냅니다.','편집'],
    ['몽타주','Montage','여러 숏의 충돌과 결합을 통해 각각의 숏만으로는 없던 새로운 의미나 리듬을 만드는 편집 방식입니다.','편집'],
    ['쇼트/리버스 쇼트','Shot/Reverse Shot','대화 장면에서 두 인물을 번갈아 보여주는 기본적인 편집 구조. 시선과 관계를 조직합니다.','편집'],
    ['아이라인 매치','Eyeline Match','인물이 바라보는 방향과 다음 컷의 대상을 연결해 공간을 자연스럽게 이해하게 하는 편집 원리입니다.','편집'],
    ['맥거핀','MacGuffin','인물의 행동을 움직이지만 그 자체의 정체보다 이야기를 진행시키는 기능이 더 중요한 목표물이나 정보입니다.','서사'],
    ['생략','Ellipsis','사건이나 시간을 의도적으로 건너뛰는 서사·편집 방식. 관객이 빈칸을 스스로 연결하게 합니다.','서사'],
    ['보이스오버','Voice-over','화면에 직접 보이지 않는 화자의 목소리가 장면 위에 덧붙는 방식. 기억·해설·불신뢰 서술에 활용됩니다.','서사'],
    ['오퇴르','Auteur','감독의 반복되는 주제·형식·세계관을 작품 전체에서 하나의 창작자적 서명처럼 읽는 관점입니다.','영화사'],
    ['네오리얼리즘','Neorealism','전후 이탈리아에서 비전문 배우·실제 공간·일상적 삶을 통해 사회 현실을 포착하려 한 영화 경향입니다.','영화사'],
    ['누벨바그','Nouvelle Vague','1950~60년대 프랑스에서 가벼운 촬영 장비·로케이션·점프 컷·자기반영성을 통해 기존 영화 문법을 흔든 흐름입니다.','영화사']
  ].map((x,i)=>({id:i+1,term:x[0],eng:x[1],definition:x[2],category:x[3]}));

  function dayIndex(len,offset=0){
    const d=new Date();
    const start=new Date(d.getFullYear(),0,0);
    return (Math.floor((d-start)/86400000)+offset)%len;
  }

  function fmtDate(v){
    if(!v) return '';
    const d=new Date(v);
    if(Number.isNaN(+d)) return String(v).slice(0,10);
    return new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric',weekday:'short'}).format(d);
  }

  function ensureSection(){
    let sec=E('#cultureLab');
    if(sec) return sec;
    sec=document.createElement('section');
    sec.id='cultureLab';
    sec.className='wrap section v30-culture-lab';
    sec.innerHTML=
      '<div class="v30-lab-head"><div><div class="kicker">CINEMA CULTURE LAB</div><h2>영화를 보고 난 뒤에도, 계속 이어지는 것들</h2><p>영화음악·감독의 작업론·영화 용어·포항의 문화소식을 매일 한 조각씩 엮습니다.</p></div><span>EDITORIAL + LOCAL LIVE</span></div>'+
      '<section class="v30-music-special"><div class="v30-section-title"><div><span>EDITORIAL SPECIAL</span><h3>SOUND & CINEMA</h3><p>영화음악을 듣는 네 개의 방</p></div><button class="ghostbtn" data-v30-share="music">스토리 공유</button></div><div class="v30-music-grid" id="v30MusicGrid"></div></section>'+
      '<div class="v30-note-dict-grid">'+
        '<section class="v30-master" id="v30Master"><div class="v30-section-title"><div><span>MASTER NOTE</span><h3>거장의 한마디</h3></div><button class="ghostbtn" data-v30-share="master">스토리 공유</button></div><div id="v30MasterBody"></div><button class="v30-next" id="v30NextMaster">다른 거장 보기 →</button></section>'+
        '<section class="v30-dictionary" id="v30Dictionary"><div class="v30-section-title"><div><span>DAILY GLOSSARY</span><h3>오늘의 영화사전</h3></div><button class="ghostbtn" data-v30-share="term">스토리 공유</button></div><div id="v30TermBody"></div><div class="v30-dict-actions"><button class="v30-next" id="v30NextTerm">다른 용어 →</button><button class="v30-next" id="v30ToggleDict">사전 전체 보기</button></div><div class="v30-term-list" id="v30TermList" hidden></div></section>'+
      '</div>'+
      '<section class="v30-phcf" id="v30Phcf"><div class="v30-section-title v30-phcf-head"><div><span>POHANG CULTURE LIVE</span><h3>포항 문화소식</h3><p>포항문화재단 공식 API · 기존 3시간 뉴스 동기화와 함께 자동 갱신</p></div><div><button class="ghostbtn" id="v30RefreshPhcf">↻ 새로고침</button><a class="ghostbtn" href="https://www.phcf.or.kr/view/index.do" target="_blank" rel="noopener">공식 홈페이지 ↗</a></div></div>'+
      '<div class="v30-phcf-tabs" id="v30PhcfTabs"><button class="on" data-tab="notice">공지·소식</button><button data-tab="event">공연·행사</button><button data-tab="indie">인디플러스·영화</button><button data-tab="open">공모·보도</button></div>'+
      '<div class="v30-phcf-meta" id="v30PhcfMeta">공식 데이터를 불러오는 중입니다.</div><div class="v30-phcf-grid" id="v30PhcfGrid"></div></section>';
    const program=E('#program');
    (program||E('#discover'))?.insertAdjacentElement('afterend',sec);
    return sec;
  }

  function renderMusic(){
    const root=E('#v30MusicGrid'); if(!root) return;
    root.innerHTML=MUSIC_ROOMS.map((x,i)=>'<article class="v30-music-card" data-key="'+x.key+'"><span>'+esc(x.label)+'</span><b>0'+(i+1)+'</b><h4>'+esc(x.title)+'</h4><p>'+esc(x.body)+'</p><button data-v30-term="'+esc(x.term)+'">영화사전에서 보기 →</button></article>').join('');
  }

  function masterAt(i=dayIndex(MASTER_NOTES.length)){
    V30.masterIndex=(i+MASTER_NOTES.length)%MASTER_NOTES.length;
    return MASTER_NOTES[V30.masterIndex];
  }
  function renderMaster(i){
    const m=masterAt(Number.isInteger(i)?i:V30.masterIndex);
    const root=E('#v30MasterBody');if(!root)return;
    root.innerHTML='<span class="v30-master-tag">'+esc(m.tag)+'</span><blockquote>“'+esc(m.note)+'”</blockquote><div><b>'+esc(m.ko)+'</b><small>'+esc(m.name)+' · '+esc(m.source)+' · '+esc(m.disclaimer)+'</small></div>';
  }

  function termAt(i=dayIndex(TERMS.length)){
    V30.termIndex=(i+TERMS.length)%TERMS.length;
    return TERMS[V30.termIndex];
  }
  function renderTerm(i){
    const t=termAt(Number.isInteger(i)?i:V30.termIndex);
    const root=E('#v30TermBody');if(!root)return;
    root.innerHTML='<span>'+esc(t.category)+'</span><h4>'+esc(t.term)+'</h4><small>'+esc(t.eng)+'</small><p>'+esc(t.definition)+'</p>';
    EA('#v30TermList button').forEach(b=>b.classList.toggle('on',Number(b.dataset.index)===V30.termIndex));
  }
  function renderTermList(){
    const root=E('#v30TermList');if(!root)return;
    root.innerHTML=TERMS.map((t,i)=>'<button data-index="'+i+'"><span>'+esc(t.category)+'</span><b>'+esc(t.term)+'</b><small>'+esc(t.eng)+'</small></button>').join('');
  }

  async function loadStaticPhcf(){
    try{
      const r=await fetch('./data/phcf.json',{cache:'no-store'});
      if(r.ok) return await r.json();
    }catch(_){}
    return null;
  }
  async function loadFirestorePhcf(){
    const v=window.INDIP_V21;
    if(!v?.firebase) return null;
    try{
      const {db,fs}=v.firebase,snap=await fs.getDoc(fs.doc(db,'public','phcf'));
      return snap.exists()?snap.data():null;
    }catch(e){console.warn('v30 phcf firestore',e);return null}
  }
  async function refreshPhcf(){
    const meta=E('#v30PhcfMeta');
    if(meta) meta.textContent='포항문화재단 공식 데이터를 불러오는 중입니다.';
    const staticData=await loadStaticPhcf();
    if(staticData){V30.phcf=staticData;renderPhcf()}
    for(let i=0;i<12;i++){
      const live=await loadFirestorePhcf();
      if(live){V30.phcf=live;renderPhcf();return}
      await new Promise(r=>setTimeout(r,500));
    }
    renderPhcf();
  }

  function isCurrentEvent(x){
    const end=new Date(x.endAt||x.startAt||0);
    return !Number.isNaN(+end) && +end >= Date.now()-86400000;
  }
  function indieItem(x){return /인디플러스|영화|cinema|시네마|ost/i.test((x.title||'')+' '+(x.venue||''))}
  function phcfItems(){
    const data=V30.phcf||{notices:[],events:[]};
    if(V30.tab==='event') return (data.events||[]).filter(isCurrentEvent).slice(0,12).map(x=>({...x,_kind:'event'}));
    if(V30.tab==='indie'){
      return [
        ...(data.events||[]).filter(x=>isCurrentEvent(x)&&indieItem(x)).map(x=>({...x,_kind:'event'})),
        ...(data.notices||[]).filter(indieItem).map(x=>({...x,_kind:'notice'}))
      ].slice(0,12);
    }
    if(V30.tab==='open') return (data.notices||[]).filter(x=>['공모·모집','보도자료'].includes(x.category)).slice(0,12).map(x=>({...x,_kind:'notice'}));
    return (data.notices||[]).filter(x=>x.category==='공지사항'||x.category==='보도자료').slice(0,12).map(x=>({...x,_kind:'notice'}));
  }

  function renderPhcf(){
    const grid=E('#v30PhcfGrid'),meta=E('#v30PhcfMeta');if(!grid)return;
    const d=V30.phcf,items=phcfItems();
    if(meta){
      const when=d?.generatedAt?new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(d.generatedAt)):'';
      meta.textContent=(d?'공식 API 동기화 · '+when:'공식 데이터를 아직 가져오지 못했습니다.')+' · 이미지/PDF는 복사하지 않고 원문 링크만 연결';
    }
    if(!items.length){grid.innerHTML='<div class="v30-phcf-empty">이 분류의 최신 항목이 없습니다. 포항문화재단 공식 홈페이지에서 전체 목록을 확인할 수 있습니다.</div>';return}
    grid.innerHTML=items.map(x=>{
      if(x._kind==='event'){
        return '<a class="v30-phcf-card event" href="'+esc(x.url)+'" target="_blank" rel="noopener">'+
          (x.imageUrl?'<img src="'+esc(x.imageUrl)+'" alt="" loading="lazy">':'<div class="v30-phcf-noimg">PHCF</div>')+
          '<div><span>'+esc(x.category||'행사')+'</span><small>'+esc(fmtDate(x.startAt))+(x.venue?' · '+esc(x.venue):'')+'</small><h4>'+esc(x.title)+'</h4><em>공식 행사정보 →</em></div></a>';
      }
      return '<a class="v30-phcf-card notice" href="'+esc(x.url)+'" target="_blank" rel="noopener"><div><span>'+esc(x.category||'공지')+'</span><small>'+esc(x.date)+(x.author?' · '+esc(x.author):'')+'</small><h4>'+esc(x.title)+'</h4><em>공식 원문 →</em></div></a>';
    }).join('');
  }

  async function storyBlob(title,subtitle,body,footer){
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
    const c=canvas.getContext('2d');
    c.fillStyle='#11100e';c.fillRect(0,0,1080,1920);
    c.fillStyle='#d8ff43';c.fillRect(70,80,10,1760);
    c.fillStyle='#f1ede4';c.font='700 34px sans-serif';c.fillText('INDI+P · CINEMA CULTURE LAB',110,150);
    c.fillStyle='#92998d';c.font='600 30px sans-serif';wrap(c,subtitle,110,245,850,46);
    c.fillStyle='#ffffff';c.font='800 76px sans-serif';let y=wrap(c,title,110,390,850,92);
    c.fillStyle='#d8d4cc';c.font='500 42px sans-serif';y=wrap(c,body,110,y+90,850,64);
    c.fillStyle='#8f968c';c.font='500 28px sans-serif';wrap(c,footer,110,1700,850,42);
    c.fillStyle='#d8ff43';c.font='800 32px sans-serif';c.fillText('indip.web.app',110,1810);
    return new Promise(res=>canvas.toBlob(res,'image/png',.94));
  }
  function wrap(c,text,x,y,max,line){
    const words=String(text||'').split(/\s+/);let row='';
    for(const w of words){
      const test=row?row+' '+w:w;
      if(c.measureText(test).width>max&&row){c.fillText(row,x,y);y+=line;row=w}else row=test;
    }
    if(row)c.fillText(row,x,y);
    return y+line;
  }
  async function shareStory(kind){
    let title='',subtitle='',body='',footer='';
    if(kind==='master'){
      const m=masterAt(V30.masterIndex);title=m.ko;subtitle='거장의 한마디 · '+m.tag;body=m.note;footer=m.source+' · '+m.disclaimer;
    }else if(kind==='term'){
      const t=termAt(V30.termIndex);title=t.term;subtitle='오늘의 영화사전 · '+t.eng;body=t.definition;footer=t.category+' · INDI+P';
    }else{
      const m=MUSIC_ROOMS[dayIndex(MUSIC_ROOMS.length)];title='SOUND & CINEMA';subtitle='영화음악을 듣는 네 개의 방';body=m.title+' — '+m.body;footer='EDITORIAL SPECIAL · INDI+P';
    }
    const blob=await storyBlob(title,subtitle,body,footer);if(!blob)return;
    const file=new File([blob],'indip-story.png',{type:'image/png'});
    try{
      if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title});return}
    }catch(e){if(e?.name==='AbortError')return}
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='indip-story.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  function bind(){
    document.addEventListener('click',e=>{
      const share=e.target.closest('[data-v30-share]');if(share){shareStory(share.dataset.v30Share);return}
      const term=e.target.closest('[data-v30-term]');if(term){
        const idx=TERMS.findIndex(x=>x.term===term.dataset.v30Term);if(idx>=0){renderTerm(idx);E('#v30Dictionary')?.scrollIntoView({behavior:'smooth',block:'center'})}return;
      }
      if(e.target.closest('#v30NextMaster')){renderMaster((V30.masterIndex+1)%MASTER_NOTES.length);return}
      if(e.target.closest('#v30NextTerm')){renderTerm((V30.termIndex+1)%TERMS.length);return}
      if(e.target.closest('#v30ToggleDict')){const list=E('#v30TermList');if(list){list.hidden=!list.hidden;e.target.textContent=list.hidden?'사전 전체 보기':'사전 닫기'}return}
      const dict=e.target.closest('#v30TermList button');if(dict){renderTerm(Number(dict.dataset.index));E('#v30TermBody')?.scrollIntoView({behavior:'smooth',block:'center'});return}
      const tab=e.target.closest('#v30PhcfTabs [data-tab]');if(tab){V30.tab=tab.dataset.tab;EA('#v30PhcfTabs button').forEach(x=>x.classList.toggle('on',x===tab));renderPhcf();return}
      if(e.target.closest('#v30RefreshPhcf')){refreshPhcf();return}
    },true);
  }

  function init(){
    ensureSection();renderMusic();renderTermList();renderMaster();renderTerm();bind();refreshPhcf();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();