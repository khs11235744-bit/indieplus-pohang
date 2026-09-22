// INDI+P v28 — dense community home: screening rooms, prompts, filters and reading density.
(() => {
  const V28 = window.INDIP_V28 = window.INDIP_V28 || {};
  V28.version = '28.0.0';
  V28.movieFilter = '';
  V28.longOnly = false;
  V28.limit = 12;
  V28.density = localStorage.getItem('indipCommunityDensity') || 'comfortable';
  V28.signature = '';

  const E = (s, r=document) => r.querySelector(s);
  const EA = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const prompts = [
    '이 영화에서 가장 오래 남은 장면은 무엇이었나요?',
    '주인공의 선택에 동의했나요? 이유도 궁금합니다.',
    '이 영화를 한 문장으로 친구에게 소개한다면?',
    '다시 본다면 가장 먼저 확인하고 싶은 장면은?',
    '이 영화의 사운드가 감정을 바꾼 순간이 있었나요?',
    '엔딩 직후 가장 먼저 든 생각은 무엇이었나요?',
    '가장 좋았던 연기 혹은 표정 하나를 꼽는다면?',
    '이 작품을 함께 묶어 보고 싶은 다른 영화는?',
    '별점 대신 단어 세 개로 이 영화를 남긴다면?',
    'GV에서 감독에게 딱 한 질문만 할 수 있다면?'
  ];

  function v21(){ return window.INDIP_V21 || {}; }
  function posts(){ return Array.isArray(v21().posts) ? v21().posts : []; }
  function user(){ return v21().user || null; }
  function movies(){ try { return typeof MOVIES !== 'undefined' ? MOVIES : {}; } catch(_) { return {}; } }
  function sessions(){ try { return typeof allSessions === 'function' ? allSessions() : []; } catch(_) { return []; } }

  function dateTimeOf(s){
    const date = s?.date || '';
    const time = s?.time || s?.start || '00:00';
    const d = new Date(date + 'T' + time + ':00+09:00');
    return Number.isNaN(+d) ? null : d;
  }

  function currentRooms(){
    const now = Date.now();
    let all = sessions().map(s => ({...s, _dt: dateTimeOf(s)}));
    let list = all.filter(s => s._dt && +s._dt >= now - 30 * 60 * 1000);
    if(!list.length) list = all;
    list.sort((a,b) => (+a._dt || 0) - (+b._dt || 0));
    const seen = new Set();
    const out = [];
    for(const s of list){
      if(!s.code || seen.has(s.code)) continue;
      seen.add(s.code);
      out.push(s);
      if(out.length >= 4) break;
    }
    return out;
  }

  function postCountFor(code){ return posts().filter(p => p.code === code).length; }
  function typeCount(type){ return type === 'all' ? posts().length : posts().filter(p => p.type === type).length; }
  function followingCount(){
    const set = window.INDIP_V22?.following;
    return set instanceof Set ? posts().filter(p => set.has(p.uid)).length : 0;
  }

  function fmtSession(s){
    const d = s._dt || dateTimeOf(s);
    if(!d) return s.time || s.start || '상영 예정';
    const md = new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric',weekday:'short'}).format(d);
    const t = s.time || s.start || new Intl.DateTimeFormat('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false}).format(d);
    return md + ' · ' + t;
  }

  function promptFor(code){
    const d = new Date();
    const seed = Math.floor((d - new Date(d.getFullYear(),0,0)) / 86400000);
    const m = movies()[code] || {};
    return {text: prompts[seed % prompts.length], title: m.title || '오늘의 영화'};
  }

  function openComposer(type='한줄평', code='', title=''){
    if(typeof window.openPostComposer === 'function') window.openPostComposer();
    setTimeout(() => {
      const t = E('#postType');
      if(t){
        if(type && ![...t.options].some(o => o.value === type)) t.add(new Option(type,type));
        if(type) t.value = type;
      }
      const m = E('#postMovie'); if(m && code) m.value = code;
      const h = E('#postTitle'); if(h && title && !h.value) h.value = title;
      const b = E('#postBody'); if(b) b.focus();
    }, 120);
  }

  function setMovieRoom(code){
    V28.movieFilter = code || '';
    V28.limit = 12;
    renderRooms();
    renderContext();
    applyBoardView();
    const board = E('#communityBoard');
    board?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function ensureShell(){
    const hub = E('#community');
    if(!hub) return null;
    hub.classList.remove('v20-hide-legacy');
    hub.dataset.v28Density = V28.density;

    const heroCopy = E('.v20-community-hero > div:first-child', hub);
    if(heroCopy && !E('#v28HeroActions', heroCopy)){
      const actions = document.createElement('div');
      actions.id = 'v28HeroActions';
      actions.className = 'v28-hero-actions';
      actions.innerHTML = '<button class="primary" id="v28HeroWrite">+ 영화 이야기</button><button class="ghostbtn" id="v28HeroAccount">로그인</button>';
      heroCopy.appendChild(actions);
    }

    let shell = E('#v28CommunityHome', hub);
    if(!shell){
      shell = document.createElement('div');
      shell.id = 'v28CommunityHome';
      shell.className = 'v28-community-home';
      shell.innerHTML =
        '<section class="v28-now">' +
          '<div class="v28-section-head"><div><span>NOW TALKING</span><h3>지금 상영작에서 시작하는 영화방</h3></div><small id="v28RoomSummary"></small></div>' +
          '<div class="v28-room-grid" id="v28MovieRooms"></div>' +
        '</section>' +
        '<section class="v28-question" id="v28Question">' +
          '<div><span class="v28-eyebrow">QUESTION OF THE DAY</span><h3 id="v28QuestionText">오늘의 질문</h3><p id="v28QuestionMovie"></p></div>' +
          '<div class="v28-question-actions"><button class="primary" id="v28AnswerQuestion">이 질문에 답하기</button><button class="ghostbtn" id="v28RandomQuestion">다른 질문</button></div>' +
        '</section>' +
        '<section class="v28-feed-tools" id="v28FeedTools">' +
          '<div class="v28-feed-modes"><button class="on" id="v28AllMode">최신 글</button><button id="v28LongMode">긴 글 200+</button></div>' +
          '<div class="v28-feed-meta"><span id="v28VisibleCount">0개 표시</span><button id="v28Density" aria-pressed="false">모아보기</button></div>' +
          '<div class="v28-context" id="v28Context" hidden></div>' +
        '</section>' +
        '<section class="v28-empty-guide" id="v28EmptyGuide" hidden></section>';

      const quick = E('#v20CommunityQuick', hub);
      if(quick) quick.insertAdjacentElement('afterend', shell);
      else E('.v20-community-hero', hub)?.insertAdjacentElement('afterend', shell);
    }

    const board = E('#communityBoard', hub);
    if(board && !E('#v28More', hub)){
      const more = document.createElement('button');
      more.id = 'v28More';
      more.className = 'v28-more ghostbtn';
      more.textContent = '글 더 보기';
      more.hidden = true;
      board.insertAdjacentElement('afterend', more);
    }

    if(!E('#v28ComposeFab')){
      const fab = document.createElement('button');
      fab.id = 'v28ComposeFab';
      fab.className = 'v28-compose-fab';
      fab.setAttribute('aria-label','커뮤니티 글쓰기');
      fab.innerHTML = '<span>＋</span><b>글쓰기</b>';
      document.body.appendChild(fab);
    }
    return shell;
  }

  function renderRooms(){
    const root = E('#v28MovieRooms');
    if(!root) return;
    const rooms = currentRooms();
    const summary = E('#v28RoomSummary');
    if(summary) summary.textContent = rooms.length ? rooms.length + '개 상영작 · 실제 상영표 기준' : '상영 정보를 확인 중';
    if(!rooms.length){
      root.innerHTML = '<div class="v28-room-empty">현재 상영 정보를 불러오는 중입니다.</div>';
      return;
    }
    const mm = movies();
    root.innerHTML = rooms.map((s,i) => {
      const m = mm[s.code] || {};
      const count = postCountFor(s.code);
      const selected = V28.movieFilter === s.code ? ' selected' : '';
      return '<article class="v28-room-card' + selected + '" data-v28-code="' + esc(s.code) + '">' +
        '<button class="v28-room-poster" data-v28-open-movie="' + esc(s.code) + '" aria-label="' + esc(m.title || s.title || '영화') + ' 영화정보">' +
          (m.poster ? '<img src="' + esc(m.poster) + '" alt="" loading="lazy">' : '<span class="v28-poster-fallback">FILM</span>') +
          '<em>' + (i===0 ? 'NEXT' : 'ROOM') + '</em>' +
        '</button>' +
        '<div class="v28-room-copy">' +
          '<small>' + esc(fmtSession(s)) + '</small>' +
          '<h4>' + esc(m.title || s.title || '상영작') + '</h4>' +
          '<p>' + count + '개의 이야기</p>' +
          '<div><button class="v28-room-enter" data-v28-room="' + esc(s.code) + '">영화방</button><button class="v28-room-write" data-v28-write="' + esc(s.code) + '">+ 쓰기</button></div>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function renderQuestion(forceIndex){
    const rooms = currentRooms();
    const code = V28.movieFilter || rooms[0]?.code || '';
    const m = movies()[code] || {};
    const d = new Date();
    const day = Math.floor((d - new Date(d.getFullYear(),0,0)) / 86400000);
    const idx = Number.isInteger(forceIndex) ? forceIndex : (V28.questionIndex ?? day % prompts.length);
    V28.questionIndex = idx % prompts.length;
    const q = prompts[V28.questionIndex];
    const text = E('#v28QuestionText');
    const mov = E('#v28QuestionMovie');
    if(text) text.textContent = q;
    if(mov) mov.textContent = m.title ? '오늘의 기준 영화 · ' + m.title : '상영작을 보고 떠오른 생각을 남겨보세요.';
    const box = E('#v28Question');
    if(box) box.dataset.code = code;
  }

  function renderContext(){
    const box = E('#v28Context');
    if(!box) return;
    if(!V28.movieFilter){
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    const m = movies()[V28.movieFilter] || {};
    box.hidden = false;
    box.innerHTML = '<span>영화방</span><b>' + esc(m.title || V28.movieFilter) + '</b><button id="v28ClearMovie">× 전체 글</button>';
  }

  function updateAccountUI(){
    const u = user();
    const account = E('#v28HeroAccount');
    if(account) account.textContent = u ? (u.isAnonymous ? '게스트 MY' : 'MY') : '로그인';
    const hub = E('#community');
    if(hub) hub.classList.toggle('v28-signed-in', !!u);
  }

  function updateFilterCounts(){
    EA('#boardFilter button').forEach(btn => {
      if(!btn.dataset.v28Label) btn.dataset.v28Label = btn.textContent.trim().replace(/\s+\d+$/,'');
      const label = btn.dataset.v28Label;
      let n = null;
      if(btn.dataset.type) n = typeCount(btn.dataset.type);
      else if(btn.id === 'v22FollowingFilter') n = followingCount();
      if(n === null) return;
      let count = E('.v28-filter-count', btn);
      if(!count){
        count = document.createElement('em');
        count.className = 'v28-filter-count';
        btn.appendChild(count);
      }
      count.textContent = String(n);
    });
  }

  function decorateCard(card,p){
    if(!p) return;
    card.dataset.v28Code = p.code || '';
    card.dataset.v28Type = p.type || '';
    card.classList.toggle('v28-long-post', String(p.body||'').length >= 200);
    card.classList.toggle('v28-question-post', p.type === '질문');
    card.classList.toggle('v28-discussion-post', p.type === '토론');
    card.classList.toggle('v28-gv-post', p.type === 'GV 후기');

    const movieSmall = E('.board-movie small', card);
    if(movieSmall) movieSmall.classList.add('v28-type-badge');

    const body = E(':scope > p', card);
    if(body && String(p.body||'').length > 260 && !E('[data-v28-expand]',card)){
      const b = document.createElement('button');
      b.className = 'v28-expand';
      b.dataset.v28Expand = p.id;
      b.textContent = '계속 읽기';
      body.insertAdjacentElement('afterend', b);
    }
  }

  function renderEmptyGuide(visibleQualified){
    const guide = E('#v28EmptyGuide');
    const board = E('#communityBoard');
    if(!guide || !board) return;
    const cards = EA('.v21-board-post',board);
    const nativeEmpty = E(':scope > .empty',board);
    const show = visibleQualified === 0;
    guide.hidden = !show;
    if(nativeEmpty) nativeEmpty.hidden = show;
    if(!show) return;

    const rooms = currentRooms().slice(0,3);
    const mm = movies();
    const roomHtml = rooms.map(s => {
      const m=mm[s.code]||{};
      return '<button data-v28-write="' + esc(s.code) + '">' +
        (m.poster?'<img src="' + esc(m.poster) + '" alt="" loading="lazy">':'') +
        '<span><small>' + esc(fmtSession(s)) + '</small><b>' + esc(m.title||s.title||'상영작') + '</b><em>첫 이야기 남기기 →</em></span>' +
      '</button>';
    }).join('');

    let title = '아직 이 조건의 글이 없습니다.';
    let copy = '빈 게시판 대신 지금 상영 중인 영화에서 첫 대화를 시작해보세요.';
    if(!posts().length){ title='첫 이야기를 기다리고 있어요.'; copy='현재 상영작과 오늘의 질문은 실제 데이터로 준비해뒀습니다. 가장 먼저 영화방을 열어보세요.'; }
    guide.innerHTML = '<div class="v28-empty-copy"><span>START HERE</span><h3>' + title + '</h3><p>' + copy + '</p></div><div class="v28-empty-rooms">' + roomHtml + '</div>';
  }

  function applyBoardView(){
    const board = E('#communityBoard');
    if(!board) return;
    const all = posts();
    const byId = new Map(all.map(p => [p.id,p]));
    const cards = EA('.v21-board-post', board);
    let qualified = 0;
    let shown = 0;

    cards.forEach(card => {
      const p = byId.get(card.dataset.postId);
      decorateCard(card,p);
      const movieOk = !V28.movieFilter || p?.code === V28.movieFilter;
      const longOk = !V28.longOnly || String(p?.body||'').length >= 200;
      const nativeOk = !card.hidden;
      const ok = !!p && movieOk && longOk && nativeOk;
      card.classList.toggle('v28-filter-hidden', !ok);
      if(ok){
        qualified++;
        const pageOk = qualified <= V28.limit;
        card.classList.toggle('v28-page-hidden', !pageOk);
        if(pageOk) shown++;
      }else{
        card.classList.remove('v28-page-hidden');
      }
    });

    const count = E('#v28VisibleCount');
    if(count) count.textContent = shown + '개 표시' + (qualified > shown ? ' · ' + qualified + '개 중' : '');
    const more = E('#v28More');
    if(more){
      more.hidden = qualified <= V28.limit;
      more.textContent = '글 더 보기 · ' + Math.min(12, qualified - V28.limit) + '개';
    }
    renderEmptyGuide(qualified);
    updateFilterCounts();
  }

  function syncDensity(){
    const hub = E('#community');
    if(hub) hub.dataset.v28Density = V28.density;
    const b = E('#v28Density');
    if(b){
      const compact = V28.density === 'compact';
      b.setAttribute('aria-pressed', String(compact));
      b.textContent = compact ? '읽기 보기' : '모아보기';
      b.classList.toggle('on', compact);
    }
  }

  function bindEvents(){
    if(V28.bound) return;
    V28.bound = true;

    document.addEventListener('click', e => {
      const open = e.target.closest('[data-v28-open-movie]');
      if(open){ e.preventDefault(); if(typeof window.openMovie === 'function') window.openMovie(open.dataset.v28OpenMovie); return; }

      const room = e.target.closest('[data-v28-room]');
      if(room){ e.preventDefault(); setMovieRoom(room.dataset.v28Room); return; }

      const write = e.target.closest('[data-v28-write]');
      if(write){
        e.preventDefault();
        const code=write.dataset.v28Write, m=movies()[code]||{};
        openComposer('한줄평',code,m.title ? m.title + ' 한줄평' : '');
        return;
      }

      if(e.target.closest('#v28ClearMovie')){ setMovieRoom(''); return; }
      if(e.target.closest('#v28HeroWrite') || e.target.closest('#v28ComposeFab')){ openComposer('한줄평',V28.movieFilter); return; }
      if(e.target.closest('#v28HeroAccount')){ window.openCommunityAuthV21?.(); return; }

      if(e.target.closest('#v28AnswerQuestion')){
        const box=E('#v28Question'),code=box?.dataset.code||'',q=E('#v28QuestionText')?.textContent||'오늘의 질문';
        openComposer('질문',code,q);
        return;
      }
      if(e.target.closest('#v28RandomQuestion')){
        V28.questionIndex = ((V28.questionIndex ?? 0) + 1) % prompts.length;
        renderQuestion(V28.questionIndex);
        return;
      }

      if(e.target.closest('#v28AllMode')){
        V28.longOnly=false;V28.limit=12;
        E('#v28AllMode')?.classList.add('on');E('#v28LongMode')?.classList.remove('on');applyBoardView();return;
      }
      if(e.target.closest('#v28LongMode')){
        V28.longOnly=true;V28.limit=12;
        E('#v28LongMode')?.classList.add('on');E('#v28AllMode')?.classList.remove('on');applyBoardView();return;
      }
      if(e.target.closest('#v28Density')){
        V28.density = V28.density === 'compact' ? 'comfortable' : 'compact';
        localStorage.setItem('indipCommunityDensity',V28.density);
        syncDensity();return;
      }
      if(e.target.closest('#v28More')){
        V28.limit += 12;applyBoardView();return;
      }

      const expand = e.target.closest('[data-v28-expand]');
      if(expand){
        const card=expand.closest('.v21-board-post');
        const on=card?.classList.toggle('v28-expanded');
        expand.textContent=on?'접기':'계속 읽기';
      }
    }, true);

    const board=E('#communityBoard');
    if(board){
      const mo=new MutationObserver(()=>{clearTimeout(V28.boardTimer);V28.boardTimer=setTimeout(applyBoardView,60)});
      mo.observe(board,{childList:true,subtree:true});
      V28.boardObserver=mo;
    }
  }

  function updateHeroCopy(){
    const hero=E('.v20-community-hero');
    if(!hero) return;
    const h2=E('h2',hero),p=E('p',hero);
    if(h2) h2.textContent='영화를 따라가다, 사람을 만나는 커뮤니티';
    if(p) p.textContent='현재 상영작의 영화방에서 시작해 한줄평·긴 비평·GV 후기·질문·토론으로 이어집니다. 글이 없어도 오늘의 상영과 질문은 비어 있지 않습니다.';
  }

  function tick(){
    const shell=ensureShell();
    if(!shell) return;
    updateHeroCopy();
    const sig=[
      posts().length,
      currentRooms().map(x=>x.code+':'+(x.time||x.start||'')).join(','),
      user()?.uid||'',
      V28.movieFilter,
      V28.longOnly,
      V28.density,
      window.INDIP_V22?.following?.size||0
    ].join('|');
    if(sig !== V28.signature){
      V28.signature=sig;
      renderRooms();
      renderQuestion();
      renderContext();
      updateAccountUI();
      updateFilterCounts();
      syncDensity();
      applyBoardView();
    }else{
      updateFilterCounts();
      applyBoardView();
    }
  }

  function init(){
    ensureShell();
    bindEvents();
    tick();
    let n=0;
    const fast=setInterval(()=>{tick();if(++n>40)clearInterval(fast)},300);
    setInterval(tick,2500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();