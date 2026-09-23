// INDI+P v30 — Cinema Culture Lab + Pohang Cultural Foundation live feed.
(() => {
  const V30 = window.INDIP_V30 = window.INDIP_V30 || {};
  V30.version = '39.0.0';
  V30.musicOverride = null;
  V30.musicDecks = {};
  V30.currentDayKey = '';
  const SOUND_KEYS=['ost','story','album','pair'];
  V30.culture = null;
  V30.musicOffset = 0;
  V30.phcf = null;
  V30.tab = 'notice';

  const E = (s,r=document)=>r.querySelector(s);
  const EA = (s,r=document)=>[...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const MUSIC_ROOMS = [{"id": "ost-01", "type": "OST PICK", "film": "Psycho", "year": "1960", "composer": "Bernard Herrmann", "title": "Psycho — Bernard Herrmann", "body": "현악기만으로 만든 날카로운 음색이 공포를 설명하기보다 신경계에 직접 닿는다. 샤워 장면만이 아니라 전곡의 반복적 불안이 핵심이다.", "listen": "긴장감을 멜로디보다 음색과 반복으로 만드는 법을 듣기 좋은 음반이다.", "image": "./assets/soundtrack-posters/539.jpg", "filmTitleKo": "사이코", "tmdbId": 539, "sourceUrl": "https://www.themoviedb.org/movie/539", "sourceLabel": "작품 정보", "editorialBy": "INDI+P", "contentKind": "editorial-listening-note", "listenLinks": [{"label": "YouTube Music에서 찾기", "url": "https://music.youtube.com/search?q=Psycho%20Bernard%20Herrmann%20soundtrack"}, {"label": "Spotify에서 찾기", "url": "https://open.spotify.com/search/Psycho%20Bernard%20Herrmann%20soundtrack"}, {"label": "MusicBrainz 앨범 검색", "url": "https://musicbrainz.org/search?query=Psycho%20Bernard%20Herrmann&type=release_group&method=indexed"}], "imageKind": "film-poster", "imageCredit": {"label": "작품 포스터 · 음반 커버 아님", "source": "https://www.themoviedb.org/movie/539", "rights": "영화 포스터. 저작권은 각 권리자에게 있으며 오픈 라이선스 이미지로 분류하지 않습니다."}}, {"id": "ost-06", "type": "OST PICK", "film": "Blade Runner", "year": "1982", "composer": "Vangelis", "title": "Blade Runner — Vangelis", "body": "신시사이저의 전자적 질감과 색소폰·보컬의 인간적 잔향이 미래도시의 차가움과 고독을 동시에 만든다.", "listen": "도시의 환경음과 음악이 어디서 분리되고 섞이는지 집중해서 들어볼 만하다.", "image": "./assets/soundtrack-posters/78.jpg", "filmTitleKo": "블레이드 러너", "tmdbId": 78, "sourceUrl": "https://www.themoviedb.org/movie/78", "sourceLabel": "작품 정보", "editorialBy": "INDI+P", "contentKind": "editorial-listening-note", "listenLinks": [{"label": "YouTube Music에서 찾기", "url": "https://music.youtube.com/search?q=Blade%20Runner%20Vangelis%20soundtrack"}, {"label": "Spotify에서 찾기", "url": "https://open.spotify.com/search/Blade%20Runner%20Vangelis%20soundtrack"}, {"label": "MusicBrainz 앨범 검색", "url": "https://musicbrainz.org/search?query=Blade%20Runner%20Vangelis&type=release_group&method=indexed"}], "imageKind": "film-poster", "imageCredit": {"label": "작품 포스터 · 음반 커버 아님", "source": "https://www.themoviedb.org/movie/78", "rights": "영화 포스터. 저작권은 각 권리자에게 있으며 오픈 라이선스 이미지로 분류하지 않습니다."}}];

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

  function kstDateKey(now=Date.now()){
    const value=now instanceof Date?now.getTime():Number(now);
    return new Date(value+9*3600000).toISOString().slice(0,10);
  }
  function dayIndex(len,offset=0,now=Date.now()){
    if(!Number.isInteger(len)||len<1)return 0;
    const start=V30.culture?.programmeStartsOn||'2026-09-23';
    const day=Math.floor((Date.parse(kstDateKey(now)+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/86400000);
    return ((day+offset)%len+len)%len;
  }
  async function loadCultureYear(){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6500);
    try{
      const response=await fetch('./data/culture-year.json',{cache:'no-store',signal:controller.signal});
      if(!response.ok)throw new Error('culture HTTP '+response.status);
      const data=await response.json();
      if(!Array.isArray(data.days)||data.days.length!==365||!data.masters?.length||!data.terms?.length)throw new Error('invalid annual data');
      for(const key of SOUND_KEYS){
        const pool=data.soundPools?.[key];
        if(!Array.isArray(pool)||!pool.length||data.days.some(d=>!Number.isInteger(d.sound?.[key])||d.sound[key]<0||d.sound[key]>=pool.length))throw new Error('invalid '+key+' programme');
      }
      V30.culture=data;return data;
    }catch(error){V30.dataError=String(error);console.warn('culture-year',error);return null}
    finally{clearTimeout(timer)}
  }
  function cultureDay(offset=0){
    const days=V30.culture?.days||[];
    if(!days.length)return null;
    return days[(dayIndex(days.length)+offset+days.length)%days.length];
  }
  function masterPool(){return V30.culture?.masters?.length?V30.culture.masters:MASTER_NOTES}
  function termPool(){return V30.culture?.terms?.length?V30.culture.terms:TERMS}
  function musicItems(offset=V30.musicOffset){
    const pools=V30.culture?.soundPools,day=cultureDay(offset);
    if(!pools||!day)return MUSIC_ROOMS;
    return SOUND_KEYS.map((key,i)=>pools[key][V30.musicOverride?.[i]??day.sound[key]]).filter(Boolean);
  }
  function safeLink(value){
    if(typeof value!=='string'||!value.trim())return '';
    try{const url=new URL(value,location.href);return url.protocol==='https:'||(url.origin===location.origin&&url.protocol==='http:')?url.href:''}catch{return ''}
  }
  function shuffle(values){
    for(let i=values.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]]}return values;
  }
  function nextMusic(){
    const pools=V30.culture?.soundPools;if(!pools)return;
    const previous=musicItems();
    V30.musicOverride=SOUND_KEYS.map((key,i)=>{
      const pool=pools[key],last=pool.findIndex(x=>x.id===previous[i]?.id);
      let deck=V30.musicDecks[key];
      if(!deck){deck=shuffle(pool.map((_,j)=>j).filter(j=>j!==last));}
      else if(!deck.length){deck=shuffle(pool.map((_,j)=>j));if(deck.length>1&&deck[0]===last)[deck[0],deck[1]]=[deck[1],deck[0]];}
      V30.musicDecks[key]=deck;return deck.shift()??0;
    });
    renderMusic();
  }
  function resetMusic(){V30.musicOverride=null;V30.musicDecks={};V30.musicOffset=0;renderMusic();}
  function musicLinkHtml(link){const url=safeLink(link.url);return url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(link.label)+' ↗</a>':'';}
  function renderMusicLibrary(){
    const root=E('#v38MusicLibraryList');if(!root)return;
    const needle=(E('#v38MusicSearch')?.value||'').trim().toLocaleLowerCase();
    const items=(V30.culture?.soundPools?.ost||MUSIC_ROOMS).filter(x=>[x.filmTitleKo,x.film,x.composer,x.composerKo,x.searchTerms].join(' ').toLocaleLowerCase().includes(needle));
    root.innerHTML=items.map(x=>'<article><h5>'+esc(x.filmTitleKo||x.film)+'</h5><p>'+esc(x.composer)+' · '+esc(x.year)+'</p><div>'+((x.listenLinks||[]).slice(0,2).map(musicLinkHtml).join(''))+'</div></article>').join('')||'<p>이 검색어에 맞는 OST가 없습니다.</p>';
    E('#v38MusicLibraryCount').textContent=items.length+'개 OST';
  }
  function renderOpenReadings(){
    const root=E('#v38OpenReadings');if(!root)return;
    root.innerHTML=(V30.culture?.openReadings||[]).map(x=>'<article><span>'+esc(x.journal)+' · '+esc(x.year)+'</span><h4>'+esc(x.title)+'</h4><p>'+esc(x.body)+'</p><small>'+esc(x.authors)+'</small><small>'+esc(x.adaptation)+'</small><div>'+musicLinkHtml({label:'연구 원문 읽기',url:x.source})+musicLinkHtml({label:x.license,url:x.licenseUrl})+'</div></article>').join('');
  }
  function refreshCultureDay(){
    const key=kstDateKey();if(V30.currentDayKey===key)return;
    V30.currentDayKey=key;V30.masterIndex=undefined;V30.termIndex=undefined;resetMusic();renderMaster();renderTerm();
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
      '<section class="v30-music-special"><div class="v30-section-title"><div><span>DAILY SOUNDTRACK EDIT</span><h3>SOUND & CINEMA</h3><p>OST 추천 · 음악감독 비하인드 · 앨범 노트 · 감독×작곡가</p></div><div class="v37-music-actions"><button class="ghostbtn" id="v30NextMusic">다른 음악 보기</button><button class="ghostbtn" id="v38TodayMusic">오늘의 음악</button><button class="ghostbtn" data-v30-share="music">스토리 공유</button></div></div><div class="v30-music-grid" id="v30MusicGrid"></div><div class="v37-music-meta" id="v37MusicMeta" role="status" aria-live="polite"></div><details class="v38-music-library" id="v38MusicLibrary"><summary>OST 전체 찾아보기</summary><label class="v38-search-label">영화·작곡가 검색<input type="search" id="v38MusicSearch" placeholder="예: 사카모토, Monster" autocomplete="off"></label><p id="v38MusicLibraryCount"></p><div id="v38MusicLibraryList"></div></details><details class="v38-open-reading"><summary>함께 읽는 오픈 리서치</summary><p class="v38-editorial-disclaimer">음반 리뷰와 구분한 공개 연구 소개입니다. 저자·라이선스를 확인한 글만 원문으로 연결합니다.</p><div id="v38OpenReadings"></div></details></section>'+
      '<div class="v30-note-dict-grid">'+
        '<section class="v30-master" id="v30Master"><div class="v30-section-title"><div><span>MASTER NOTE</span><h3>감독의 작업 노트</h3></div><button class="ghostbtn" data-v30-share="master">스토리 공유</button></div><div id="v30MasterBody"></div><button class="v30-next" id="v30NextMaster">다른 감독 보기 →</button></section>'+
        '<section class="v30-dictionary" id="v30Dictionary"><div class="v30-section-title"><div><span>DAILY GLOSSARY</span><h3>오늘의 영화사전</h3></div><button class="ghostbtn" data-v30-share="term">스토리 공유</button></div><div id="v30TermBody"></div><div class="v30-dict-actions"><button class="v30-next" id="v30NextTerm">다른 용어 →</button><button class="v30-next" id="v30ToggleDict">사전 전체 보기</button></div><div id="v38TermSearchWrap" hidden><label class="v38-search-label">영화 용어 검색<input id="v38TermSearch" type="search" placeholder="예: 몽타주, 편집" autocomplete="off"></label><small id="v38TermCount"></small></div><div class="v30-term-list" id="v30TermList" hidden></div></section>'+
      '</div>'+
      '<section class="v30-phcf" id="v30Phcf"><div class="v30-section-title v30-phcf-head"><div><span>POHANG CULTURE LIVE</span><h3>포항 문화소식</h3><p>포항문화재단 공식 API · 기존 3시간 뉴스 동기화와 함께 자동 갱신</p></div><div><button class="ghostbtn" id="v30RefreshPhcf">↻ 새로고침</button><a class="ghostbtn" href="https://www.phcf.or.kr/view/index.do" target="_blank" rel="noopener">공식 홈페이지 ↗</a></div></div>'+
      '<div class="v30-phcf-tabs" id="v30PhcfTabs"><button class="on" data-tab="notice">공지·소식</button><button data-tab="event">공연·행사</button><button data-tab="indie">인디플러스·영화</button><button data-tab="open">공모·보도</button></div>'+
      '<div class="v30-phcf-meta" id="v30PhcfMeta">공식 데이터를 불러오는 중입니다.</div><div class="v30-phcf-grid" id="v30PhcfGrid"></div></section>';
    const program=E('#program');
    (program||E('#discover'))?.insertAdjacentElement('afterend',sec);
    return sec;
  }

  function renderMusic(){
    const root=E('#v30MusicGrid');if(!root)return;
    root.classList.add('v38-sound-grid');
    const items=musicItems(),labels=['오늘의 OST','음악감독 비하인드','앨범 감상 노트','감독 × 작곡가'];
    root.innerHTML=items.map((x,i)=>{
      if(i===0){
        const image=safeLink(x.image||'');
        return '<article class="v38-sound-feature" data-key="'+esc(x.id)+'">'+
          (image?'<figure class="v38-sound-cover"><img src="'+esc(image)+'" alt="'+esc((x.filmTitleKo||x.film)+' 작품 포스터')+'" loading="lazy" decoding="async"><figcaption>작품 포스터 · 음반 커버 아님</figcaption></figure>':'')+
          '<div class="v38-sound-intro"><span class="v38-eyebrow">'+labels[0]+'</span><h4>'+esc(x.filmTitleKo||x.film||x.title)+'</h4><p class="v38-film-original">'+esc(x.film||'')+'</p><p class="v38-composer">'+esc(x.composer||'')+' <small>'+esc(x.year||'')+'</small></p><div class="v38-listen-links">'+(x.listenLinks||[]).slice(0,2).map(musicLinkHtml).join('')+'</div></div>'+
          '<div class="v38-sound-body"><p>'+esc(x.body||'')+'</p>'+(x.listen?'<p class="v38-listening-note">'+esc(x.listen)+'</p>':'')+'<div class="v38-source-line">'+(x.sourceUrl?musicLinkHtml({label:x.sourceLabel||'작품 정보',url:x.sourceUrl}):'')+((x.listenLinks||[]).slice(2).map(musicLinkHtml).join(''))+'</div></div></article>';
      }
      return '<article class="v38-sound-note" data-key="'+esc(x.id)+'"><span class="v38-eyebrow">'+esc(labels[i]||x.type)+'</span><h4>'+esc(x.title||x.film||'')+'</h4><p>'+esc(x.body||'')+'</p><footer>'+ (x.sourceUrl?musicLinkHtml({label:x.sourceLabel||'자료 출처',url:x.sourceUrl}):'<small>INDI+P 편집 노트</small>')+'</footer></article>';
    }).join('');
    const meta=E('#v37MusicMeta'),c=V30.culture;
    if(meta)meta.textContent=c?'한국시간 '+kstDateKey()+' · '+(V30.musicOverride?'직접 넘겨보는 음악':'오늘의 편성')+' · OST '+c.soundPools.ost.length+'개 / 음악 이야기 '+(c.soundPools.story.length+c.soundPools.album.length+c.soundPools.pair.length)+'개를 365일 편성으로 순환합니다.':'자료 연결을 기다리는 동안 기본 OST를 표시합니다.';
  }

  function masterAt(i){
    const pool=masterPool(),base=V30.culture?cultureDay()?.master:dayIndex(pool.length);
    const idx=Number.isInteger(i)?i:(Number.isInteger(V30.masterIndex)?V30.masterIndex:base||0);
    V30.masterIndex=(idx+pool.length)%pool.length;
    return pool[V30.masterIndex];
  }
  function renderMaster(i){
    const m=masterAt(Number.isInteger(i)?i:V30.masterIndex),root=E('#v30MasterBody');if(!root||!m)return;
    root.innerHTML='<span class="v30-master-tag">'+esc(m.tag)+'</span><p class="v38-master-note">'+esc(m.note)+'</p><div><b>'+esc(m.ko)+'</b><small>'+esc(m.name)+' · INDI+P 편집 해설</small><p class="v38-editorial-disclaimer">감독의 직접 인용이 아니라 작품을 읽는 편집 노트입니다.</p></div>';
  }

  function termAt(i){
    const pool=termPool(),base=V30.culture?cultureDay()?.term:dayIndex(pool.length);
    const idx=Number.isInteger(i)?i:(Number.isInteger(V30.termIndex)?V30.termIndex:base||0);
    V30.termIndex=(idx+pool.length)%pool.length;
    return pool[V30.termIndex];
  }
  function renderTerm(i){
    const t=termAt(Number.isInteger(i)?i:V30.termIndex);
    const root=E('#v30TermBody');if(!root)return;
    root.innerHTML='<span>'+esc(t.category)+'</span><h4>'+esc(t.term)+'</h4><small>'+esc(t.eng)+'</small><p>'+esc(t.definition)+'</p>';
    EA('#v30TermList button').forEach(b=>b.classList.toggle('on',Number(b.dataset.index)===V30.termIndex));
  }
  function renderTermList(){
    const root=E('#v30TermList');if(!root)return;
    const needle=(E('#v38TermSearch')?.value||'').trim().toLocaleLowerCase();
    const terms=termPool().map((term,index)=>({term,index})).filter(x=>[x.term.term,x.term.eng,x.term.category].join(' ').toLocaleLowerCase().includes(needle));
    root.innerHTML=terms.map(({term:t,index:i})=>'<button data-index="'+i+'"><span>'+esc(t.category)+'</span><b>'+esc(t.term)+'</b><small>'+esc(t.eng)+'</small></button>').join('')||'<p>찾는 용어가 없습니다.</p>';
    E('#v38TermCount').textContent=terms.length+'개 용어';
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

  function storyCanvas(title,subtitle,body,footer){
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
    return canvas;
  }
  async function storyBlob(title,subtitle,body,footer){
    const canvas=storyCanvas(title,subtitle,body,footer);
    return new Promise(res=>canvas.toBlob(res,'image/png',.94));
  }
  function storyFileSync(title,subtitle,body,footer){
    const data=storyCanvas(title,subtitle,body,footer).toDataURL('image/png');
    const raw=atob(data.split(',')[1]),bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    return new File([bytes],'indip-story.png',{type:'image/png'});
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
  function shareStory(kind){
    if(kind==='master'&&window.INDIP_V42?.shareDirectorStory){window.INDIP_V42.shareDirectorStory();return}
    let title='',subtitle='',body='',footer='';
    if(kind==='master'){
      const m=masterAt(V30.masterIndex);title=m.ko;subtitle='감독의 작업 노트 · '+m.tag;body=m.note;footer=m.source+' · '+m.disclaimer;
    }else if(kind==='term'){
      const t=termAt(V30.termIndex);title=t.term;subtitle='오늘의 영화사전 · '+t.eng;body=t.definition;footer=t.category+' · INDI+P';
    }else{
      const m=musicItems()[0]||{};title='SOUND & CINEMA';subtitle=m.type||'오늘의 OST';body=(m.title||m.film||'')+' — '+(m.body||'');footer=[m.composer,m.film,'INDI+P'].filter(Boolean).join(' · ');
    }
    const file=storyFileSync(title,subtitle,body,footer),text=[title,body,'https://indip.web.app'].filter(Boolean).join('\n');
    if(navigator.share){
      try{
        const fileCapable=!navigator.canShare||navigator.canShare({files:[file]});
        const payload=fileCapable?{files:[file],title,text}:{title,text,url:'https://indip.web.app'};
        Promise.resolve(navigator.share(payload)).catch(e=>{if(e?.name!=='AbortError')console.warn('culture share',e)});
        return;
      }catch(e){console.warn('culture share sync',e)}
    }
    if(navigator.clipboard?.write&&window.ClipboardItem){
      navigator.clipboard.write([new ClipboardItem({'image/png':file})]).then(()=>toast?.('공유 이미지를 클립보드에 복사했습니다.')).catch(()=>navigator.clipboard?.writeText?.(text));
      return;
    }
    navigator.clipboard?.writeText?.(text).then(()=>toast?.('공유 문구를 복사했습니다.'));
  }

  function bind(){
    document.addEventListener('click',e=>{
      const share=e.target.closest('[data-v30-share]');if(share){shareStory(share.dataset.v30Share);return}
      const term=e.target.closest('[data-v30-term]');if(term){
        const idx=termPool().findIndex(x=>x.term===term.dataset.v30Term);if(idx>=0){renderTerm(idx);E('#v30Dictionary')?.scrollIntoView({behavior:'smooth',block:'center'})}return;
      }
      if(e.target.closest('#v30NextMusic')){nextMusic();return}
      if(e.target.closest('#v38TodayMusic')){resetMusic();return}
      if(e.target.closest('#v30NextMaster')){renderMaster((V30.masterIndex+1)%masterPool().length);return}
      if(e.target.closest('#v30NextTerm')){renderTerm((V30.termIndex+1)%termPool().length);return}
      if(e.target.closest('#v30ToggleDict')){const list=E('#v30TermList');if(list){list.hidden=!list.hidden;E('#v38TermSearchWrap').hidden=list.hidden;E('#v30ToggleDict').textContent=list.hidden?'사전 전체 보기':'사전 닫기';E('#v30ToggleDict').setAttribute('aria-expanded',String(!list.hidden));if(!list.hidden)renderTermList()}return}
      const dict=e.target.closest('#v30TermList button');if(dict){renderTerm(Number(dict.dataset.index));E('#v30TermBody')?.scrollIntoView({behavior:'smooth',block:'center'});return}
      const tab=e.target.closest('#v30PhcfTabs [data-tab]');if(tab){V30.tab=tab.dataset.tab;EA('#v30PhcfTabs button').forEach(x=>x.classList.toggle('on',x===tab));renderPhcf();return}
      if(e.target.closest('#v30RefreshPhcf')){refreshPhcf();return}
    },true);
  }

  async function init(){
    ensureSection();bind();refreshPhcf();
    E('#v38MusicLibrary')?.addEventListener('toggle',e=>{if(e.currentTarget.open)renderMusicLibrary()});
    E('#v38MusicSearch')?.addEventListener('input',renderMusicLibrary);
    E('#v38TermSearch')?.addEventListener('input',renderTermList);
    await loadCultureYear();renderTermList();renderOpenReadings();refreshCultureDay();
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshCultureDay()});
    setInterval(()=>{if(!document.hidden)refreshCultureDay()},60000);
    V30.ready=true;
  }
  V30.programmeIndexFor=(now)=>dayIndex(365,0,now);
  V30.musicItems=musicItems;V30.nextMusic=nextMusic;V30.resetMusic=resetMusic;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();