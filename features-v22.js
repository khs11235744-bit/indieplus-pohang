// INDI+P v22 — social community, movie discussion, notifications, reports,
// spoiler controls, following feed, and curated Top 20 design presets.
(() => {
  const V22 = window.INDIP_V22 = window.INDIP_V22 || {};
  V22.version = '22.0.0';
  V22.following = new Set();
  V22.noticeUnsub = null;
  V22.boundUid = '';

  const TOP_SHARE = [
    'editorial','swiss','brutal','noir','newspaper','cobalt','vermilion','mint','lavender','analogue',
    'nouvelle','riso','polaroid','darkroom','letterbox','cineclub','concrete','framenumber','postcard','gallery'
  ];
  const TOP_MAG = [
    'journal','critic','newspaper','archive','noir','postcard','swiss','brutal','museum','cobalt',
    'vermilion','mint','lavender','analogue','nouvelle','riso','polaroid','darkroom','letterbox','cineclub'
  ];
  V22.topShare = TOP_SHARE;
  V22.topMag = TOP_MAG;

  const E = s => document.querySelector(s);
  const EA = s => [...document.querySelectorAll(s)];
  const v21 = () => window.INDIP_V21 || {};
  const fb = () => v21().firebase || null;
  const user = () => v21().user || null;
  const posts = () => v21().posts || [];
  const nick = () => v21().profile?.nickname || user()?.displayName || user()?.email?.split('@')[0] || '관객';
  const movie = code => (typeof MOVIES !== 'undefined' && MOVIES[code]) || {};
  const post = id => posts().find(p => p.id === id);
  const safe = s => typeof esc === 'function' ? esc(String(s ?? '')) : String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const when = v => { try { const d=v?.toDate?v.toDate():new Date(v||Date.now()); return d.toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}); } catch(_) { return ''; } };

  function requireLogin(message='이 기능은 커뮤니티 로그인 후 사용할 수 있습니다.'){
    if(user()) return true;
    window.openCommunityAuthV21?.();
    setTimeout(()=>{const e=E('#v21AuthMessage'); if(e)e.textContent=message;},0);
    return false;
  }

  // ---------- Curated Top 20 ----------
  function addCuratedSwitch(row, keys, id){
    if(!row || E('#'+id)) return;
    const box=document.createElement('div'); box.id=id; box.className='v22-curated-switch';
    box.innerHTML='<div><b>EDITOR\'S TOP 20</b><small>가독성·영화성·SNS 활용도를 기준으로 추린 추천 프리셋</small></div><div><button class="on" data-v22-view="top">추천 20</button><button data-v22-view="all">전체 50</button></div>';
    row.insertAdjacentElement('beforebegin',box);
    const apply=mode=>{
      box.querySelectorAll('[data-v22-view]').forEach(b=>b.classList.toggle('on',b.dataset.v22View===mode));
      const btns=[...row.querySelectorAll('button')];
      btns.sort((a,b)=>{
        const ka=a.dataset.preset||a.dataset.magpreset, kb=b.dataset.preset||b.dataset.magpreset;
        const ia=keys.indexOf(ka), ib=keys.indexOf(kb);
        return (ia<0?999:ia)-(ib<0?999:ib);
      }).forEach(b=>row.appendChild(b));
      btns.forEach(b=>{const k=b.dataset.preset||b.dataset.magpreset; b.classList.toggle('v22-top-preset',keys.includes(k)); b.hidden=mode==='top'&&!keys.includes(k);});
    };
    box.querySelector('[data-v22-view="top"]').onclick=()=>apply('top');
    box.querySelector('[data-v22-view="all"]').onclick=()=>apply('all');
    apply('top');
  }
  function curatePresetUI(){ addCuratedSwitch(E('#presetRow'),TOP_SHARE,'v22ShareTop20'); addCuratedSwitch(E('#magPresetRow'),TOP_MAG,'v22MagTop20'); }

  // ---------- Follow graph ----------
  const followId=(from,to)=>`${from}_${to}`;
  async function loadFollowing(){
    const f=fb(),u=user(); V22.following.clear(); if(!f||!u)return V22.following;
    try{
      const q=f.fs.query(f.fs.collection(f.db,'follows'),f.fs.where('followerUid','==',u.uid),f.fs.limit(500));
      const s=await f.fs.getDocs(q); s.forEach(d=>V22.following.add(d.data().targetUid));
    }catch(e){console.warn('following',e)}
    return V22.following;
  }
  async function sendNotification(targetUid,type,data={}){
    const f=fb(),u=user(); if(!f||!u||!targetUid||targetUid===u.uid)return;
    const payload={targetUid,actorUid:u.uid,actorName:nick(),type,postId:data.postId||'',movieCode:data.movieCode||'',message:String(data.message||'').slice(0,180),read:false,createdAt:f.fs.serverTimestamp()};
    try{
      if(data.id) await f.fs.setDoc(f.fs.doc(f.db,'users',targetUid,'notifications',data.id),payload,{merge:true});
      else await f.fs.addDoc(f.fs.collection(f.db,'users',targetUid,'notifications'),payload);
    }catch(e){console.warn('notify',e)}
  }
  async function toggleFollow(targetUid){
    if(!requireLogin('팔로우는 로그인 후 사용할 수 있습니다.'))return;
    const f=fb(),u=user(); if(!f||!u||targetUid===u.uid)return;
    const ref=f.fs.doc(f.db,'follows',followId(u.uid,targetUid));
    const s=await f.fs.getDoc(ref);
    if(s.exists()){ await f.fs.deleteDoc(ref); V22.following.delete(targetUid); }
    else { await f.fs.setDoc(ref,{followerUid:u.uid,targetUid,createdAt:f.fs.serverTimestamp()}); V22.following.add(targetUid); await sendNotification(targetUid,'follow',{id:`follow_${u.uid}`,message:`${nick()}님이 팔로우했습니다.`}); }
    decorateBoard(); refreshProfileSocialStats();
  }
  async function refreshProfileSocialStats(){
    const f=fb(),u=user(); if(!f||!u)return;
    try{
      const [a,b]=await Promise.all([
        f.fs.getCountFromServer(f.fs.query(f.fs.collection(f.db,'follows'),f.fs.where('followerUid','==',u.uid))),
        f.fs.getCountFromServer(f.fs.query(f.fs.collection(f.db,'follows'),f.fs.where('targetUid','==',u.uid)))
      ]);
      let host=E('#v22SocialStats'); if(!host){host=document.createElement('div');host.id='v22SocialStats';host.className='v22-social-stats';E('#v21AuthSignedIn .v21-account-card')?.insertAdjacentElement('afterend',host)}
      if(host)host.innerHTML=`<span>팔로잉 <b>${a.data().count}</b></span><span>팔로워 <b>${b.data().count}</b></span>`;
    }catch(_){ }
  }

  // ---------- Notifications ----------
  function ensureNoticeButton(){
    const nav=E('.nav-actions'); if(!nav||E('#v22NoticeBtn'))return;
    const b=document.createElement('button');b.id='v22NoticeBtn';b.className='chipbtn v22-notice-btn';b.innerHTML='알림 <span>0</span>';b.onclick=openNotifications;nav.prepend(b);
  }
  function ensureNoticePanel(){
    let p=E('#v22NoticePanel'); if(p)return p;
    p=document.createElement('div');p.id='v22NoticePanel';p.className='share-panel';
    p.innerHTML='<div class="share-sheet v22-notice-sheet"><button class="close">×</button><div class="v22-panel-head"><div><div class="kicker">COMMUNITY</div><h2>알림</h2></div><button class="ghostbtn" id="v22ReadAll">모두 읽음</button></div><div id="v22NoticeList" class="v22-notice-list"></div></div>';
    document.body.appendChild(p);p.querySelector('.close').onclick=()=>p.classList.remove('open');p.onclick=e=>{if(e.target===p)p.classList.remove('open')};p.querySelector('#v22ReadAll').onclick=markAllRead;return p;
  }
  function noticeText(n){
    const label={follow:'팔로우',like:'좋아요',comment:'댓글'}[n.type]||'알림';
    return n.message||`${n.actorName||'관객'}님의 ${label} 알림`;
  }
  function renderNotices(items){
    const root=E('#v22NoticeList'); if(!root)return;
    root.innerHTML=items.length?items.map(n=>`<button class="${n.read?'':'unread'}" data-notice-post="${safe(n.postId||'')}"><span>${n.type==='follow'?'◎':n.type==='comment'?'▤':'♥'}</span><div><b>${safe(noticeText(n))}</b><small>${safe(when(n.createdAt))}</small></div></button>`).join(''):'<div class="empty">새 알림이 없습니다.</div>';
    root.querySelectorAll('[data-notice-post]').forEach(b=>b.onclick=()=>{const id=b.dataset.noticePost;if(id){E('#community')?.scrollIntoView({behavior:'smooth'});setTimeout(()=>document.querySelector(`[data-post-id="${CSS.escape(id)}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),450)}ensureNoticePanel().classList.remove('open')});
  }
  function bindNotifications(){
    const f=fb(),u=user(); ensureNoticeButton();
    if(V22.boundUid===u?.uid)return;
    V22.noticeUnsub?.();V22.noticeUnsub=null;V22.boundUid=u?.uid||'';
    const b=E('#v22NoticeBtn'); if(!u){if(b){b.hidden=true;b.querySelector('span').textContent='0'}return;} if(b)b.hidden=false;
    const q=f.fs.query(f.fs.collection(f.db,'users',u.uid,'notifications'),f.fs.orderBy('createdAt','desc'),f.fs.limit(60));
    V22.noticeUnsub=f.fs.onSnapshot(q,s=>{V22.notices=s.docs.map(d=>({id:d.id,...d.data()}));const unread=V22.notices.filter(x=>!x.read).length;if(b)b.querySelector('span').textContent=String(unread);renderNotices(V22.notices);},e=>console.warn('notifications',e));
  }
  function openNotifications(){if(!requireLogin('알림은 로그인 후 확인할 수 있습니다.'))return;const p=ensureNoticePanel();renderNotices(V22.notices||[]);p.classList.add('open')}
  async function markAllRead(){const f=fb(),u=user();if(!f||!u)return;const unread=(V22.notices||[]).filter(x=>!x.read);if(!unread.length)return;const batch=f.fs.writeBatch(f.db);unread.forEach(n=>batch.update(f.fs.doc(f.db,'users',u.uid,'notifications',n.id),{read:true}));await batch.commit()}

  // ---------- Reports ----------
  function ensureReportPanel(){
    let p=E('#v22ReportPanel');if(p)return p;
    p=document.createElement('div');p.id='v22ReportPanel';p.className='share-panel';
    p.innerHTML='<div class="share-sheet v22-report-sheet"><button class="close">×</button><div class="kicker">COMMUNITY SAFETY</div><h2>게시글 신고</h2><label>사유<select id="v22ReportReason"><option>스팸·광고</option><option>욕설·비방</option><option>스포일러 미표기</option><option>괴롭힘·혐오</option><option>저작권·도용</option><option>기타</option></select></label><label>설명<textarea id="v22ReportMemo" maxlength="500" placeholder="필요한 경우 추가 설명을 적어주세요."></textarea></label><button class="primary" id="v22ReportSend">신고 제출</button><small>신고는 신고자 계정과 함께 기록되며 일반 사용자에게 공개되지 않습니다.</small></div>';
    document.body.appendChild(p);p.querySelector('.close').onclick=()=>p.classList.remove('open');p.onclick=e=>{if(e.target===p)p.classList.remove('open')};return p;
  }
  function openReport(postId){if(!requireLogin('신고는 로그인 후 제출할 수 있습니다.'))return;const p=ensureReportPanel();p.dataset.postId=postId;p.querySelector('#v22ReportMemo').value='';p.classList.add('open');p.querySelector('#v22ReportSend').onclick=()=>submitReport(postId)}
  async function submitReport(postId){const f=fb(),u=user(),p=post(postId);if(!f||!u||!p)return;const panel=ensureReportPanel(),reason=panel.querySelector('#v22ReportReason').value,memo=panel.querySelector('#v22ReportMemo').value.trim();await f.fs.addDoc(f.fs.collection(f.db,'reports'),{reporterUid:u.uid,targetType:'post',targetId:postId,targetUid:p.uid||'',reason,memo:memo.slice(0,500),status:'open',createdAt:f.fs.serverTimestamp()});panel.classList.remove('open');toast('신고를 접수했습니다.')}

  // ---------- Movie discussion ----------
  function ensureDiscussionButton(){
    const a=E('.detail-actions'); if(!a||E('#detailDiscussionV22'))return;
    const b=document.createElement('button');b.id='detailDiscussionV22';b.className='ghostbtn';b.textContent='영화 토론';b.onclick=()=>window.activeMovieCode&&openMovieDiscussion(window.activeMovieCode);a.appendChild(b);
  }
  function ensureDiscussionPanel(){
    let p=E('#v22DiscussionPanel');if(p)return p;
    p=document.createElement('div');p.id='v22DiscussionPanel';p.className='share-panel';
    p.innerHTML='<div class="share-sheet v22-discussion-sheet"><button class="close">×</button><div class="v22-panel-head"><div><div class="kicker">MOVIE DISCUSSION</div><h2 id="v22DiscussionTitle">영화 토론</h2></div><button class="primary" id="v22NewDiscussion">+ 토론 글쓰기</button></div><div id="v22DiscussionList" class="v22-discussion-list"></div></div>';
    document.body.appendChild(p);p.querySelector('.close').onclick=()=>p.classList.remove('open');p.onclick=e=>{if(e.target===p)p.classList.remove('open')};p.querySelector('#v22NewDiscussion').onclick=()=>startDiscussion(p.dataset.code);return p;
  }
  function openMovieDiscussion(code){const p=ensureDiscussionPanel(),m=movie(code);p.dataset.code=code;p.querySelector('#v22DiscussionTitle').textContent=(m.title||'영화')+' 토론';const arr=posts().filter(x=>x.code===code);const root=p.querySelector('#v22DiscussionList');root.innerHTML=arr.length?arr.map(x=>`<article><div><b>${safe(x.authorName||'관객')}</b><small>${safe(x.type||'이야기')} · ${safe(when(x.createdAt))}</small></div><h3>${safe(x.title||m.title||'')}</h3><p class="${x.spoiler?'v22-discussion-spoiler':''}">${safe(x.body||'')}</p><button data-v22-open-comments="${x.id}">댓글 보기</button></article>`).join(''):'<div class="empty">아직 이 영화의 이야기가 없습니다. 첫 토론을 시작해보세요.</div>';root.querySelectorAll('[data-v22-open-comments]').forEach(b=>b.onclick=()=>window.openCommentsV21?.(b.dataset.v22OpenComments));p.classList.add('open')}
  function startDiscussion(code){if(!requireLogin())return;window.openPostComposer?.();setTimeout(()=>{const t=E('#postType');if(t&&!['토론'].includes(t.value)){if(![...t.options].some(o=>o.value==='토론'))t.add(new Option('토론','토론'));t.value='토론'}const m=E('#postMovie');if(m&&code)m.value=code;const title=E('#postTitle');if(title&&!title.value)title.placeholder='토론 주제';},40)}

  // ---------- Board decoration ----------
  async function hydrateFollowButtons(){const u=user();if(!u)return;await loadFollowing();EA('[data-v22-follow]').forEach(b=>{const on=V22.following.has(b.dataset.v22Follow);b.textContent=on?'팔로잉':'팔로우';b.classList.toggle('on',on)})}
  function spoilerControl(card,p){if(!p.spoiler||card.querySelector('.v22-spoiler-toggle'))return;const body=card.querySelector('.v21-spoiler');if(!body)return;const b=document.createElement('button');b.className='v22-spoiler-toggle';b.textContent='⚠ 스포일러 · 눌러서 보기';b.onclick=()=>{const open=body.classList.toggle('revealed');b.textContent=open?'스포일러 다시 가리기':'⚠ 스포일러 · 눌러서 보기'};body.insertAdjacentElement('beforebegin',b)}
  function decorateBoard(){
    const u=user();
    EA('#communityBoard .v21-board-post').forEach(card=>{const id=card.dataset.postId,p=post(id);if(!p)return;const author=card.querySelector('.board-author');if(author&&!author.querySelector('[data-v22-follow]')&&u&&p.uid&&p.uid!==u.uid){const b=document.createElement('button');b.className='v22-follow';b.dataset.v22Follow=p.uid;b.textContent=V22.following.has(p.uid)?'팔로잉':'팔로우';b.onclick=()=>toggleFollow(p.uid);author.appendChild(b)}const acts=card.querySelector('.board-actions');if(acts&&!acts.querySelector('[data-v22-report]')&&(!u||p.uid!==u.uid)){const r=document.createElement('button');r.dataset.v22Report=id;r.textContent='신고';r.onclick=()=>openReport(id);acts.appendChild(r)}spoilerControl(card,p)});
    hydrateFollowButtons();
  }
  async function renderFollowingFeed(){
    if(!requireLogin('팔로잉 피드는 로그인 후 사용할 수 있습니다.'))return;
    await loadFollowing();window.INDIP_V21.filter='all';window.renderCommunityBoard?.();setTimeout(()=>{EA('#communityBoard .v21-board-post').forEach(card=>{const p=post(card.dataset.postId);card.hidden=!!(p&&!V22.following.has(p.uid))});decorateBoard()},30)
  }
  function addCommunityControls(){
    const filter=E('#boardFilter'); if(filter&&!E('#v22FollowingFilter')){const f=document.createElement('button');f.id='v22FollowingFilter';f.textContent='팔로잉';f.onclick=()=>{EA('#boardFilter button').forEach(x=>x.classList.toggle('on',x===f));renderFollowingFeed()};filter.appendChild(f)}
    if(filter&&!filter.querySelector('[data-type="토론"]')){const t=document.createElement('button');t.dataset.type='토론';t.textContent='토론';filter.appendChild(t)}
  }

  // Notification hooks for v21 native like/comment UI.
  document.addEventListener('click',e=>{
    const like=e.target.closest('[data-like-post]');if(like&&user()){const id=like.dataset.likePost,p=post(id);if(p&&p.uid!==user().uid)setTimeout(async()=>{try{const f=fb(),ref=f.fs.doc(f.db,'posts',id,'likes',user().uid),s=await f.fs.getDoc(ref);if(s.exists())await sendNotification(p.uid,'like',{id:`like_${id}_${user().uid}`,postId:id,movieCode:p.code,message:`${nick()}님이 글을 좋아합니다.`})}catch(_){}},700)}
    const send=e.target.closest('#v21CommentSend');if(send&&user()){const panel=E('#v21CommentsPanel'),id=panel?.dataset.postId,p=post(id),text=E('#v21CommentInput')?.value.trim();if(p&&text&&p.uid!==user().uid)setTimeout(()=>sendNotification(p.uid,'comment',{postId:id,movieCode:p.code,message:`${nick()}님이 댓글을 남겼습니다: ${text.slice(0,60)}`}),650)}
  },true);

  let lastUid='';
  function tick(){
    curatePresetUI();addCommunityControls();ensureNoticeButton();ensureDiscussionButton();decorateBoard();
    const uid=user()?.uid||''; if(uid!==lastUid){lastUid=uid;loadFollowing().then(decorateBoard);bindNotifications();refreshProfileSocialStats()}
  }
  const observer=new MutationObserver(()=>{clearTimeout(V22._mut);V22._mut=setTimeout(tick,80)});
  function init(){observer.observe(document.body,{childList:true,subtree:true});setInterval(tick,1200);setTimeout(tick,300);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
