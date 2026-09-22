// INDI+P v21 — authenticated Firestore community + 50 preset studios.
(() => {
  const V21 = window.INDIP_V21 = window.INDIP_V21 || {};
  V21.version = '21.0.0';
  V21.posts = [];
  V21.filter = 'all';
  V21.profile = null;
  V21.user = null;
  V21.firebase = null;

  const legacyCommunityPosts = typeof communityPosts === 'function' ? communityPosts : null;
  const legacyOpenPostComposer = typeof openPostComposer === 'function' ? openPostComposer : null;

  const SHARE_EXTRA = {
    nouvelle:{name:'Nouvelle Vague',bg:'#f2efe7',text:'#151515',muted:'#777067',accent:'#df4234',base:'editorial',fx:'redline',group:'Editorial'},
    nordic:{name:'Nordic Minimal',bg:'#eef1ec',text:'#15201b',muted:'#748078',accent:'#2f6453',base:'gallery',fx:'corners',group:'Minimal'},
    riso:{name:'Risograph Duo',bg:'#f5e8d7',text:'#24201b',muted:'#7d7167',accent:'#ff4b3e',base:'classic',fx:'riso',group:'Print'},
    polaroid:{name:'Polaroid Memo',bg:'#f3efe6',text:'#26211d',muted:'#7f756c',accent:'#245c74',base:'postcard',fx:'polaroid',group:'Retro'},
    ticketstub:{name:'Ticket Stub',bg:'#eadfca',text:'#1e1a15',muted:'#756b5d',accent:'#bb3d2b',base:'classic',fx:'ticket',group:'Retro'},
    darkroom:{name:'Darkroom Red',bg:'#080808',text:'#f8f2ec',muted:'#8a8580',accent:'#e3392c',base:'noir',fx:'scan',group:'Dark'},
    letterbox:{name:'Letterbox Frame',bg:'#070707',text:'#f4f4f0',muted:'#94948f',accent:'#d8ff43',base:'cinema',fx:'letterbox',group:'Cinema'},
    cineclub:{name:'Cinema Club',bg:'#f0e8d7',text:'#1d1813',muted:'#776a5d',accent:'#263e66',base:'festival',fx:'club',group:'Editorial'},
    acid:{name:'Acid Poster',bg:'#d8ff43',text:'#111111',muted:'#444b34',accent:'#ff3b8d',base:'brutal',fx:'acid',group:'Color'},
    concrete:{name:'Concrete Modern',bg:'#d9d7d1',text:'#171717',muted:'#676661',accent:'#214b7c',base:'swiss',fx:'grid',group:'Minimal'},
    midcentury:{name:'Mid-century Film',bg:'#f1d8b5',text:'#281b12',muted:'#806d5d',accent:'#b8482d',base:'postcard',fx:'midcentury',group:'Retro'},
    softgrain:{name:'Soft Grain',bg:'#efe6df',text:'#261c1a',muted:'#89736e',accent:'#a45e65',base:'gallery',fx:'grain',group:'Soft'},
    reelburn:{name:'Reel Burn',bg:'#1b0f0c',text:'#fff1db',muted:'#c09c86',accent:'#ff6a31',base:'analogue',fx:'burn',group:'Cinema'},
    cyanotype:{name:'Cyanotype',bg:'#0b3b63',text:'#f3f5ef',muted:'#b9c6cc',accent:'#dcebbd',base:'cobalt',fx:'frame',group:'Color'},
    sunset:{name:'Sunset Cinema',bg:'#f2c49c',text:'#301c1b',muted:'#8f675d',accent:'#d84653',base:'rose',fx:'sunset',group:'Color'},
    monochromeblue:{name:'Monochrome Blue',bg:'#dfe5ea',text:'#132232',muted:'#687887',accent:'#132232',base:'bluebook',fx:'index',group:'Minimal'},
    ivoryink:{name:'Ivory Ink',bg:'#f7f0e2',text:'#1f1a15',muted:'#756e64',accent:'#191919',base:'screenplay',fx:'ink',group:'Editorial'},
    yellowpress:{name:'Yellow Press',bg:'#f4da53',text:'#141414',muted:'#5e552c',accent:'#c22f27',base:'zine',fx:'press',group:'Print'},
    greenroom:{name:'Green Room',bg:'#12261d',text:'#f1f3ec',muted:'#9ba99d',accent:'#c7db59',base:'forest',fx:'frame',group:'Dark'},
    midnightblue:{name:'Midnight Blue',bg:'#071629',text:'#f2f5f8',muted:'#91a0b4',accent:'#62c4ff',base:'midnight',fx:'scan',group:'Dark'},
    peachzine:{name:'Peach Zine',bg:'#f5c9b7',text:'#2b1813',muted:'#8b6559',accent:'#9b3fff',base:'signal',fx:'riso',group:'Color'},
    graphite:{name:'Graphite Proof',bg:'#d8d7d2',text:'#161616',muted:'#6c6b67',accent:'#343434',base:'mono',fx:'proof',group:'Print'},
    redline:{name:'Editorial Redline',bg:'#f1ece4',text:'#171717',muted:'#716b63',accent:'#d33126',base:'vermilion',fx:'redline',group:'Editorial'},
    framenumber:{name:'Frame Number',bg:'#0b0c0d',text:'#f3f1eb',muted:'#8e8e87',accent:'#f0b84a',base:'contact',fx:'frameNo',group:'Cinema'}
  };

  const MAG_EXTRA = {
    nouvelle:{name:'Nouvelle Vague',bg:'#f2efe7',text:'#151515',muted:'#777067',accent:'#df4234',serif:true,base:'journal',fx:'redline',group:'Editorial'},
    nordic:{name:'Nordic Review',bg:'#eef1ec',text:'#15201b',muted:'#748078',accent:'#2f6453',serif:false,base:'journal',fx:'corners',group:'Minimal'},
    riso:{name:'Riso Cinema',bg:'#f5e8d7',text:'#24201b',muted:'#7d7167',accent:'#ff4b3e',serif:false,base:'zine',fx:'riso',group:'Print'},
    polaroid:{name:'Polaroid Essay',bg:'#f3efe6',text:'#26211d',muted:'#7f756c',accent:'#245c74',serif:true,base:'postcard',fx:'polaroid',group:'Retro'},
    darkroom:{name:'Darkroom Notes',bg:'#080808',text:'#f8f2ec',muted:'#8a8580',accent:'#e3392c',serif:true,base:'noir',fx:'scan',group:'Dark'},
    letterbox:{name:'Letterbox Journal',bg:'#070707',text:'#f4f4f0',muted:'#94948f',accent:'#d8ff43',serif:false,base:'critic',fx:'letterbox',group:'Cinema'},
    cineclub:{name:'Film Society',bg:'#f0e8d7',text:'#1d1813',muted:'#776a5d',accent:'#263e66',serif:true,base:'festival',fx:'club',group:'Editorial'},
    acid:{name:'Acid Critic',bg:'#d8ff43',text:'#111111',muted:'#444b34',accent:'#ff3b8d',serif:false,base:'zine',fx:'acid',group:'Color'},
    concrete:{name:'Concrete Review',bg:'#d9d7d1',text:'#171717',muted:'#676661',accent:'#214b7c',serif:false,base:'newspaper',fx:'grid',group:'Minimal'},
    midcentury:{name:'Mid-century Journal',bg:'#f1d8b5',text:'#281b12',muted:'#806d5d',accent:'#b8482d',serif:true,base:'postcard',fx:'midcentury',group:'Retro'},
    softgrain:{name:'Soft Grain Essay',bg:'#efe6df',text:'#261c1a',muted:'#89736e',accent:'#a45e65',serif:true,base:'journal',fx:'grain',group:'Soft'},
    reelburn:{name:'Reel Burn Notes',bg:'#1b0f0c',text:'#fff1db',muted:'#c09c86',accent:'#ff6a31',serif:false,base:'noir',fx:'burn',group:'Cinema'},
    cyanotype:{name:'Cyanotype Book',bg:'#0b3b63',text:'#f3f5ef',muted:'#b9c6cc',accent:'#dcebbd',serif:true,base:'archive',fx:'frame',group:'Color'},
    sunset:{name:'Sunset Essay',bg:'#f2c49c',text:'#301c1b',muted:'#8f675d',accent:'#d84653',serif:true,base:'postcard',fx:'sunset',group:'Color'},
    monochromeblue:{name:'Blue Index',bg:'#dfe5ea',text:'#132232',muted:'#687887',accent:'#132232',serif:false,base:'archive',fx:'index',group:'Minimal'},
    ivoryink:{name:'Ivory Essay',bg:'#f7f0e2',text:'#1f1a15',muted:'#756e64',accent:'#191919',serif:true,base:'newspaper',fx:'ink',group:'Editorial'},
    yellowpress:{name:'Yellow Cinema Press',bg:'#f4da53',text:'#141414',muted:'#5e552c',accent:'#c22f27',serif:false,base:'zine',fx:'press',group:'Print'},
    greenroom:{name:'Green Room Archive',bg:'#12261d',text:'#f1f3ec',muted:'#9ba99d',accent:'#c7db59',serif:true,base:'archive',fx:'frame',group:'Dark'},
    midnightblue:{name:'Midnight Review',bg:'#071629',text:'#f2f5f8',muted:'#91a0b4',accent:'#62c4ff',serif:false,base:'critic',fx:'scan',group:'Dark'},
    peachzine:{name:'Peach Film Zine',bg:'#f5c9b7',text:'#2b1813',muted:'#8b6559',accent:'#9b3fff',serif:false,base:'zine',fx:'riso',group:'Color'},
    graphite:{name:'Graphite Proof',bg:'#d8d7d2',text:'#161616',muted:'#6c6b67',accent:'#343434',serif:true,base:'newspaper',fx:'proof',group:'Print'},
    redline:{name:'Redline Review',bg:'#f1ece4',text:'#171717',muted:'#716b63',accent:'#d33126',serif:true,base:'newspaper',fx:'redline',group:'Editorial'}
  };

  V21.shareExtra = SHARE_EXTRA;
  V21.magExtra = MAG_EXTRA;

  function extendPresets(){
    const v20=window.INDIP_V20;
    if(v20?.sharePresets)Object.assign(v20.sharePresets,SHARE_EXTRA);
    if(v20?.magPresets)Object.assign(v20.magPresets,MAG_EXTRA);
  }

  function allSharePresets(){return window.INDIP_V20?.sharePresets||SHARE_EXTRA}
  function allMagPresets(){return window.INDIP_V20?.magPresets||MAG_EXTRA}

  async function blobImage(blob){
    if(window.createImageBitmap){try{return await createImageBitmap(blob)}catch(_){}}
    return await new Promise((resolve,reject)=>{const u=URL.createObjectURL(blob),img=new Image();img.onload=()=>{URL.revokeObjectURL(u);resolve(img)};img.onerror=e=>{URL.revokeObjectURL(u);reject(e)};img.src=u});
  }

  async function decorateBlob(blob,spec){
    if(!spec?.fx)return blob;
    const img=await blobImage(blob),w=img.width,h=img.height,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(img,0,0,w,h);x.save();
    const a=spec.accent||'#ffffff',dark='rgba(0,0,0,.72)',light='rgba(255,255,255,.72)',s=Math.max(2,Math.round(w*.004));x.lineWidth=s;x.strokeStyle=a;x.fillStyle=a;
    const label=()=>{x.font=`900 ${Math.round(w*.018)}px Pretendard, sans-serif`;x.textAlign='right';x.fillText('INDI+P / FRAME',w-w*.04,h-h*.025)};
    switch(spec.fx){
      case 'redline':x.fillRect(0,0,w,Math.max(10,w*.014));x.fillRect(w*.055,h*.09,w*.19,Math.max(5,w*.006));break;
      case 'corners':{const m=w*.035,l=w*.07;x.beginPath();[[m,m,1,1],[w-m,m,-1,1],[m,h-m,1,-1],[w-m,h-m,-1,-1]].forEach(([cx,cy,sx,sy])=>{x.moveTo(cx,cy+sy*l);x.lineTo(cx,cy);x.lineTo(cx+sx*l,cy)});x.stroke();break}
      case 'riso':x.globalAlpha=.2;for(let i=0;i<90;i++){x.beginPath();x.arc(Math.random()*w,Math.random()*h,Math.random()*3+1,0,Math.PI*2);x.fill()}x.globalAlpha=1;break;
      case 'polaroid':x.strokeStyle=light;x.lineWidth=Math.round(w*.025);x.strokeRect(w*.035,h*.025,w*.93,h*.90);x.fillStyle='rgba(255,255,255,.92)';x.fillRect(w*.035,h*.87,w*.93,h*.09);break;
      case 'ticket':x.setLineDash([10,10]);x.strokeRect(w*.035,h*.03,w*.93,h*.94);x.setLineDash([]);for(let yy=h*.08;yy<h*.94;yy+=h*.075){x.fillStyle=spec.bg;x.beginPath();x.arc(0,yy,w*.012,0,Math.PI*2);x.arc(w,yy,w*.012,0,Math.PI*2);x.fill()}break;
      case 'scan':x.globalAlpha=.11;x.fillStyle='#fff';for(let yy=0;yy<h;yy+=6)x.fillRect(0,yy,w,1);x.globalAlpha=1;break;
      case 'letterbox':x.fillStyle='#000';x.fillRect(0,0,w,h*.075);x.fillRect(0,h*.925,w,h*.075);label();break;
      case 'club':x.strokeRect(w*.025,h*.02,w*.95,h*.96);x.fillRect(w*.05,h*.05,w*.18,w*.012);label();break;
      case 'acid':x.fillStyle=a;x.fillRect(w*.77,0,w*.23,h*.045);x.fillStyle=dark;x.fillRect(0,h*.72,w*.06,h*.28);break;
      case 'grid':x.globalAlpha=.16;x.strokeStyle=a;for(let xx=0;xx<w;xx+=w/6){x.beginPath();x.moveTo(xx,0);x.lineTo(xx,h);x.stroke()}for(let yy=0;yy<h;yy+=h/8){x.beginPath();x.moveTo(0,yy);x.lineTo(w,yy);x.stroke()}x.globalAlpha=1;break;
      case 'midcentury':x.beginPath();x.arc(w*.88,h*.10,w*.07,0,Math.PI*2);x.fill();x.fillRect(w*.04,h*.88,w*.22,h*.025);break;
      case 'grain':x.globalAlpha=.12;x.fillStyle='#000';for(let i=0;i<700;i++)x.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2);x.globalAlpha=1;break;
      case 'burn':{const g=x.createRadialGradient(w*.95,h*.06,0,w*.95,h*.06,w*.45);g.addColorStop(0,'rgba(255,86,35,.62)');g.addColorStop(1,'rgba(255,86,35,0)');x.fillStyle=g;x.fillRect(0,0,w,h);break}
      case 'frame':x.strokeRect(w*.025,h*.02,w*.95,h*.96);x.strokeRect(w*.04,h*.035,w*.92,h*.93);break;
      case 'sunset':{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'rgba(255,183,77,.22)');g.addColorStop(1,'rgba(222,60,91,.16)');x.fillStyle=g;x.fillRect(0,0,w,h);break}
      case 'index':x.fillRect(w*.04,h*.04,w*.012,h*.12);x.fillRect(w*.04,h*.04,w*.16,h*.012);label();break;
      case 'ink':x.strokeStyle=dark;x.strokeRect(w*.03,h*.025,w*.94,h*.95);x.fillStyle=dark;label();break;
      case 'press':x.fillRect(0,h*.965,w,h*.035);x.fillStyle=dark;x.fillRect(w*.03,h*.04,w*.30,h*.03);break;
      case 'proof':x.strokeStyle='rgba(0,0,0,.55)';x.setLineDash([4,6]);x.strokeRect(w*.025,h*.02,w*.95,h*.96);x.setLineDash([]);break;
      case 'frameNo':label();x.font=`900 ${Math.round(w*.045)}px monospace`;x.textAlign='left';x.fillText(String(new Date().getDate()).padStart(2,'0'),w*.04,h*.08);break;
    }
    x.restore();return await new Promise(r=>c.toBlob(r,'image/png',.96));
  }

  function installPresetSearch(row,specs,id){
    if(!row||document.getElementById(id))return;
    const box=document.createElement('div');box.id=id;box.className='v21-preset-search';
    box.innerHTML='<input type="search" placeholder="프리셋 검색"><div class="v21-preset-groups"></div>';
    row.insertAdjacentElement('beforebegin',box);const input=box.querySelector('input'),groups=box.querySelector('.v21-preset-groups');
    const values=Object.entries(specs),cats=['전체',...new Set(values.map(([,p])=>p.group||'기본'))];
    groups.innerHTML=cats.map((g,i)=>`<button data-pgroup="${g}" class="${i?'':'on'}">${g}</button>`).join('');
    let group='전체';const apply=()=>{const q=input.value.trim().toLowerCase();row.querySelectorAll('button').forEach(b=>{const p=specs[b.dataset.preset||b.dataset.magpreset]||{},txt=(p.name+' '+(p.group||'')).toLowerCase();b.hidden=!!((q&&!txt.includes(q))||(group!=='전체'&&(p.group||'기본')!==group))})};
    input.oninput=apply;groups.querySelectorAll('button').forEach(b=>b.onclick=()=>{group=b.dataset.pgroup;groups.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));apply()});
  }

  function refreshSharePresetRow(){
    const row=document.getElementById('presetRow');if(!row||typeof v05Share==='undefined')return;const specs=allSharePresets();
    row.innerHTML=Object.entries(specs).map(([k,p])=>`<button data-preset="${k}" title="${p.name}">${p.name}</button>`).join('');
    row.querySelectorAll('[data-preset]').forEach(b=>b.onclick=()=>{v05Share.preset=b.dataset.preset;v05Share.customColors=null;row.querySelectorAll('[data-preset]').forEach(x=>x.classList.toggle('on',x===b));if(typeof refreshV05Preview==='function')refreshV05Preview()});
    row.querySelector(`[data-preset="${v05Share.preset||'editorial'}"]`)?.classList.add('on');installPresetSearch(row,specs,'v21SharePresetSearch');
  }

  function refreshMagPresetRow(){
    const row=document.getElementById('magPresetRow');if(!row||typeof MAG_STUDIO==='undefined')return;const specs=allMagPresets();
    row.innerHTML=Object.entries(specs).map(([k,p])=>`<button data-magpreset="${k}">${p.name}</button>`).join('');
    row.querySelectorAll('[data-magpreset]').forEach(b=>b.onclick=()=>{MAG_STUDIO.preset=b.dataset.magpreset;row.querySelectorAll('[data-magpreset]').forEach(x=>x.classList.toggle('on',x===b));renderMagazinePreviewV2();renderCardNewsV2()});
    row.querySelector(`[data-magpreset="${MAG_STUDIO.preset||'journal'}"]`)?.classList.add('on');installPresetSearch(row,specs,'v21MagPresetSearch');
  }

  function patchPresetRendering(){
    extendPresets();
    if(typeof makeShareBlobV05==='function'&&!V21.shareFxPatched){V21.shareFxPatched=true;const old=makeShareBlobV05;makeShareBlobV05=async function(code,opts={}){const b=await old(code,opts),spec=SHARE_EXTRA[opts.preset];return spec?decorateBlob(b,spec):b}}
    if(typeof makeCardSlideBlobV2==='function'&&!V21.cardFxPatched){V21.cardFxPatched=true;const old=makeCardSlideBlobV2;makeCardSlideBlobV2=async function(item,slide,index){const b=await old(item,slide,index),key=slide?.preset||item?.preset,spec=MAG_EXTRA[key];return spec?decorateBlob(b,spec):b}}
    if(typeof openSharePanelV05==='function'&&!V21.openSharePatched){V21.openSharePatched=true;const old=openSharePanelV05;openSharePanelV05=function(...a){const r=old(...a);setTimeout(refreshSharePresetRow,0);return r}}
    if(typeof openMagazineStudioV2==='function'&&!V21.openMagPatched){V21.openMagPatched=true;const old=openMagazineStudioV2;openMagazineStudioV2=function(...a){const r=old(...a);setTimeout(refreshMagPresetRow,0);return r}}
    refreshSharePresetRow();refreshMagPresetRow();
  }

  async function readFirebaseConfig(){
    for(const url of ['/__/firebase/init.json','./firebase-config.json']){try{const r=await fetch(url,{cache:'no-store'});if(r.ok){const c=await r.json();if(c?.projectId&&c?.apiKey)return c}}catch(_){}}
    return null;
  }

  async function initFirebaseCommunity(){
    const config=await readFirebaseConfig();if(!config)return false;
    const appmod=await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js');
    const authmod=await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js');
    const fs=await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');
    const app=appmod.getApps().length?appmod.getApp():appmod.initializeApp(config),auth=authmod.getAuth(app),db=fs.getFirestore(app);
    await authmod.setPersistence(auth,authmod.browserLocalPersistence).catch(()=>{});
    V21.firebase={app,auth,db,authmod,fs};
    try{await authmod.getRedirectResult(auth)}catch(e){setTimeout(()=>authMessage(authErrorMessage(e)),0);}
    authmod.onAuthStateChanged(auth,async user=>{V21.user=user;V21.profile=await loadProfile(user);updateAuthUI();renderRemoteBoard();});
    fs.onSnapshot(fs.query(fs.collection(db,'posts'),fs.orderBy('createdAt','desc'),fs.limit(80)),snap=>{V21.posts=snap.docs.map(d=>({id:d.id,...d.data()}));renderRemoteBoard();renderV21Stats();},err=>{console.warn('community snapshot',err);showCommunityNotice('커뮤니티 서버 연결을 확인 중입니다.')});
    return true;
  }

  async function loadProfile(user){
    if(!user||!V21.firebase)return null;const {db,fs}=V21.firebase,ref=fs.doc(db,'profiles',user.uid);try{const s=await fs.getDoc(ref);if(s.exists())return {uid:user.uid,...s.data()}}catch(_){}
    const nickname=user.displayName||(!user.isAnonymous&&user.email?user.email.split('@')[0]:`게스트-${user.uid.slice(0,5)}`),p={uid:user.uid,nickname,bio:'영화를 보고 문장을 남깁니다.',createdAt:fs.serverTimestamp()};
    try{await fs.setDoc(ref,p,{merge:true})}catch(_){}return {...p,createdAt:new Date()};
  }

  function currentNickname(){return V21.profile?.nickname||V21.user?.displayName||V21.user?.email?.split('@')[0]||'관객'}
  function stampDate(v){try{return (v?.toDate?v.toDate():new Date(v||Date.now())).toLocaleDateString('ko-KR')}catch(_){return ''}}
  function showCommunityNotice(text){const host=document.getElementById('communityBoard');if(host&&!V21.posts.length)host.innerHTML=`<div class="empty">${esc(text)}</div>`}

  function ensureAuthButton(){
    document.getElementById('profileBtnV05')?.classList.add('v21-hide-profile-button');const nav=document.querySelector('.nav-actions');if(!nav||document.getElementById('communityAuthBtnV21'))return;
    const b=document.createElement('button');b.id='communityAuthBtnV21';b.className='chipbtn v21-auth-top';b.onclick=openCommunityAuthV21;nav.prepend(b);updateAuthUI();
  }

  function authErrorMessage(e){const c=e?.code||'';if(c.includes('operation-not-allowed'))return 'Firebase Authentication에서 선택한 로그인 제공자를 활성화해야 합니다.';if(c.includes('unauthorized-domain'))return '현재 공개 도메인(indip.web.app)을 Firebase Authentication 승인 도메인에 등록해야 합니다.';if(c.includes('popup-blocked'))return '브라우저가 Google 로그인 팝업을 차단했습니다. 리디렉션 로그인을 시도합니다.';if(c.includes('invalid-credential'))return '이메일 또는 비밀번호를 확인해주세요.';if(c.includes('email-already-in-use'))return '이미 가입된 이메일입니다.';if(c.includes('weak-password'))return '비밀번호는 6자 이상으로 입력해주세요.';return e?.message||'로그인 처리 중 오류가 발생했습니다.'}

  function ensureAuthPanel(){
    let p=document.getElementById('communityAuthPanelV21');if(p)return p;p=document.createElement('div');p.id='communityAuthPanelV21';p.className='share-panel';
    p.innerHTML='<div class="share-sheet v21-auth-sheet"><button class="close" id="closeAuthV21">×</button><div class="kicker">COMMUNITY ACCOUNT</div><h2>INDI+P 커뮤니티 로그인</h2><p>글쓰기·댓글·좋아요는 로그인 후 여러 기기에서 이어집니다. Google 로그인과 이메일·게스트 로그인을 지원합니다.</p><div id="v21AuthSignedOut"><button class="v21-google-login" id="v21Google" type="button"><span aria-hidden="true">G</span>Google로 계속하기</button><div class="v21-auth-divider"><span>또는</span></div><label>닉네임<input id="v21AuthNickname" maxlength="24" placeholder="커뮤니티에서 보일 이름"></label><label>이메일<input id="v21AuthEmail" type="email" autocomplete="email" placeholder="name@example.com"></label><label>비밀번호<input id="v21AuthPassword" type="password" minlength="6" autocomplete="current-password" placeholder="6자 이상"></label><div class="v21-auth-actions"><button class="primary" id="v21Login">로그인</button><button class="ghostbtn" id="v21Signup">회원가입</button><button class="ghostbtn" id="v21Guest">게스트로 시작</button><button class="text-button" id="v21Reset">비밀번호 재설정</button></div></div><div id="v21AuthSignedIn" hidden><div class="v21-account-card"><b id="v21AccountIdentity"></b><small id="v21AccountMode"></small></div><label>커뮤니티 닉네임<input id="v21ProfileNickname" maxlength="24"></label><label>한줄소개<input id="v21ProfileBio" maxlength="100"></label><div class="v21-auth-actions"><button class="primary" id="v21SaveProfile">프로필 저장</button><button class="ghostbtn" id="v21ImportLocal">이 기기의 기존 글 가져오기</button><button class="ghostbtn danger" id="v21Logout">로그아웃</button></div></div><div class="v21-auth-message" id="v21AuthMessage"></div></div>';
    document.body.appendChild(p);p.querySelector('#closeAuthV21').onclick=()=>p.classList.remove('open');p.onclick=e=>{if(e.target===p)p.classList.remove('open')};
    p.querySelector('#v21Google').onclick=googleV21;p.querySelector('#v21Login').onclick=loginV21;p.querySelector('#v21Signup').onclick=signupV21;p.querySelector('#v21Guest').onclick=guestV21;p.querySelector('#v21Reset').onclick=resetPasswordV21;p.querySelector('#v21Logout').onclick=logoutV21;p.querySelector('#v21SaveProfile').onclick=saveProfileV21;p.querySelector('#v21ImportLocal').onclick=importLocalPostsV21;return p;
  }

  function updateAuthUI(){
    ensureAuthButton();const b=document.getElementById('communityAuthBtnV21');if(b)b.textContent=V21.user?currentNickname():'커뮤니티 로그인';const p=document.getElementById('communityAuthPanelV21');if(!p)return;
    p.querySelector('#v21AuthSignedOut').hidden=!!V21.user;p.querySelector('#v21AuthSignedIn').hidden=!V21.user;
    if(V21.user){p.querySelector('#v21AccountIdentity').textContent=V21.user.isAnonymous?'게스트 계정':(V21.user.email||'커뮤니티 계정');p.querySelector('#v21AccountMode').textContent=V21.user.isAnonymous?'이 브라우저에 유지되는 게스트 로그인':'Firebase 계정 로그인';p.querySelector('#v21ProfileNickname').value=currentNickname();p.querySelector('#v21ProfileBio').value=V21.profile?.bio||'';const n=legacyCommunityPosts?legacyCommunityPosts().length:0;p.querySelector('#v21ImportLocal').hidden=!n||localStorage.getItem('indipV21Imported:'+V21.user.uid)==='1'}
  }

  function openCommunityAuthV21(){const p=ensureAuthPanel();updateAuthUI();p.classList.add('open')}
  window.openCommunityAuthV21=openCommunityAuthV21;
  function authMessage(t,ok=false){const e=document.getElementById('v21AuthMessage');if(e){e.textContent=t;e.classList.toggle('ok',ok)}}
  async function googleV21(){
    if(!V21.firebase)return authMessage('Firebase 연결을 확인 중입니다.');
    const {auth,authmod}=V21.firebase;
    const provider=new authmod.GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});
    try{
      authMessage('Google 로그인 창을 여는 중입니다.');
      await authmod.signInWithPopup(auth,provider);
      authMessage('Google로 로그인되었습니다.',true);
    }catch(e){
      const code=e?.code||'';
      const mobile=globalThis.matchMedia?.('(max-width: 760px)')?.matches||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'');
      const redirectable=code.includes('popup-blocked')||code.includes('operation-not-supported-in-this-environment')||code.includes('web-storage-unsupported')||code.includes('cancelled-popup-request')||(mobile&&!code.includes('popup-closed-by-user')&&!code.includes('operation-not-allowed')&&!code.includes('unauthorized-domain'));
      if(redirectable){
        authMessage('Google 로그인 화면으로 이동합니다.');
        try{await authmod.signInWithRedirect(auth,provider)}catch(re){authMessage(authErrorMessage(re))}
        return;
      }
      authMessage(authErrorMessage(e));
    }
  }
  async function loginV21(){if(!V21.firebase)return authMessage('Firebase 연결을 확인 중입니다.');const p=ensureAuthPanel(),email=p.querySelector('#v21AuthEmail').value.trim(),pw=p.querySelector('#v21AuthPassword').value;try{await V21.firebase.authmod.signInWithEmailAndPassword(V21.firebase.auth,email,pw);authMessage('로그인되었습니다.',true)}catch(e){authMessage(authErrorMessage(e))}}
  async function signupV21(){if(!V21.firebase)return authMessage('Firebase 연결을 확인 중입니다.');const p=ensureAuthPanel(),email=p.querySelector('#v21AuthEmail').value.trim(),pw=p.querySelector('#v21AuthPassword').value,nick=p.querySelector('#v21AuthNickname').value.trim()||email.split('@')[0];try{const c=await V21.firebase.authmod.createUserWithEmailAndPassword(V21.firebase.auth,email,pw);await V21.firebase.authmod.updateProfile(c.user,{displayName:nick});await V21.firebase.fs.setDoc(V21.firebase.fs.doc(V21.firebase.db,'profiles',c.user.uid),{uid:c.user.uid,nickname:nick,bio:'영화를 보고 문장을 남깁니다.',createdAt:V21.firebase.fs.serverTimestamp()},{merge:true});authMessage('회원가입이 완료되었습니다.',true)}catch(e){authMessage(authErrorMessage(e))}}
  async function guestV21(){try{await V21.firebase.authmod.signInAnonymously(V21.firebase.auth);authMessage('게스트로 로그인되었습니다.',true)}catch(e){authMessage(authErrorMessage(e))}}
  async function resetPasswordV21(){const email=ensureAuthPanel().querySelector('#v21AuthEmail').value.trim();if(!email)return authMessage('이메일을 입력해주세요.');try{await V21.firebase.authmod.sendPasswordResetEmail(V21.firebase.auth,email);authMessage('비밀번호 재설정 메일을 보냈습니다.',true)}catch(e){authMessage(authErrorMessage(e))}}
  async function logoutV21(){await V21.firebase?.authmod.signOut(V21.firebase.auth);ensureAuthPanel().classList.remove('open')}
  async function saveProfileV21(){if(!V21.user)return;const p=ensureAuthPanel(),nickname=p.querySelector('#v21ProfileNickname').value.trim().slice(0,24)||'관객',bio=p.querySelector('#v21ProfileBio').value.trim().slice(0,100);await V21.firebase.fs.setDoc(V21.firebase.fs.doc(V21.firebase.db,'profiles',V21.user.uid),{uid:V21.user.uid,nickname,bio,updatedAt:V21.firebase.fs.serverTimestamp()},{merge:true});if(!V21.user.isAnonymous)await V21.firebase.authmod.updateProfile(V21.user,{displayName:nickname}).catch(()=>{});V21.profile={...(V21.profile||{}),nickname,bio};updateAuthUI();renderRemoteBoard();authMessage('프로필을 저장했습니다.',true)}

  async function importLocalPostsV21(){if(!V21.user||!legacyCommunityPosts)return;const list=legacyCommunityPosts().slice(-200);if(!list.length)return authMessage('가져올 기존 글이 없습니다.');const {db,fs}=V21.firebase;for(const p of list){await fs.addDoc(fs.collection(db,'posts'),{uid:V21.user.uid,authorName:currentNickname(),type:p.type||'한줄평',code:p.code||'',title:p.title||'',body:String(p.body||'').slice(0,5000),rating:Number(p.rating||0),tags:(p.tags||[]).slice(0,12),spoiler:!!p.spoiler,createdAt:p.createdAt?fs.Timestamp.fromDate(new Date(p.createdAt)):fs.serverTimestamp(),updatedAt:fs.serverTimestamp()})}localStorage.setItem('indipV21Imported:'+V21.user.uid,'1');updateAuthUI();authMessage(`${list.length}개의 기존 글을 가져왔습니다.`,true)}

  function requireAuth(){if(V21.user)return true;openCommunityAuthV21();authMessage('글쓰기·댓글·좋아요는 로그인 후 사용할 수 있습니다.');return false}

  async function createRemotePost(data){if(!V21.user)return null;const {db,fs}=V21.firebase,payload={uid:V21.user.uid,authorName:currentNickname(),type:data.type||'한줄평',code:data.code||'',title:String(data.title||'').slice(0,80),body:String(data.body||'').slice(0,5000),rating:Math.max(0,Math.min(5,Number(data.rating||0))),tags:(data.tags||[]).slice(0,12),spoiler:!!data.spoiler,createdAt:fs.serverTimestamp(),updatedAt:fs.serverTimestamp()};const ref=await fs.addDoc(fs.collection(db,'posts'),payload);return {id:ref.id,...payload,createdAt:new Date()}}

  function patchCommunityFunctions(){
    if(V21.communityPatched)return;V21.communityPatched=true;
    window.createPost=createRemotePost;
    window.postById=id=>V21.posts.find(x=>x.id===id);
    window.openPostComposer=function(){if(!requireAuth())return;const r=legacyOpenPostComposer?.();setTimeout(()=>{const s=document.querySelector('#postComposer .share-sheet>small');if(s)s.textContent='Firebase 커뮤니티에 게시되며 로그인한 기기에서 이어집니다.'},0);return r};
    window.submitPost=async function(makeMagazine){if(!requireAuth())return;const body=document.getElementById('postBody')?.value.trim();if(!body)return toast('본문을 입력해주세요.');const post=await createRemotePost({code:document.getElementById('postMovie')?.value||'',type:document.getElementById('postType')?.value||'한줄평',title:document.getElementById('postTitle')?.value.trim()||'',body,rating:Number(document.getElementById('postRating')?.value||0),tags:(document.getElementById('postTags')?.value||'').split(/[\s,]+/).map(x=>x.replace(/^#/,'')).filter(Boolean),spoiler:!!document.getElementById('postSpoiler')?.checked});document.getElementById('postComposer')?.classList.remove('open');if(makeMagazine&&post&&typeof magazineFromPost==='function'){const item=magazineFromPost(post);openMagazineStudioV2(item.id)}toast('커뮤니티에 게시했습니다.')};
    window.togglePostLike=toggleLikeV21;window.addPostComment=async(id,text)=>{if(!requireAuth())return;return addCommentV21(id,text)};window.openCommentPrompt=id=>openCommentsV21(id);window.renderCommunityBoard=()=>renderRemoteBoard();window.renderCommunityBoardFiltered=type=>{V21.filter=type;renderRemoteBoard()};
  }

  function renderV21Stats(){
    let old=document.getElementById('v20CommunityStats');if(old)old.style.display='none';let r=document.getElementById('v21CommunityStats');if(!r){r=document.createElement('div');r.id='v21CommunityStats';r.className='v20-community-stats';document.querySelector('.v20-community-hero')?.appendChild(r)}
    if(r){const authors=new Set(V21.posts.map(p=>p.uid).filter(Boolean));r.innerHTML=`<span><b>${V21.posts.length}</b>글</span><span><b>${authors.size}</b>관객</span><span><b>LIVE</b>Firestore</span>`}
  }

  function postCardHtml(p){const m=(typeof MOVIES!=='undefined'&&MOVIES[p.code])||{},mine=V21.user&&p.uid===V21.user.uid,tags=(p.tags||[]).map(t=>`<span>#${esc(t)}</span>`).join('');return `<article class="board-post v21-board-post" data-post-id="${p.id}"><div class="board-author"><b>${esc(p.authorName||'관객')}</b><small>${esc(stampDate(p.createdAt))}</small></div><div class="board-movie">${m.poster?`<img src="${m.poster}" alt="">`:''}<div><small>${esc(p.type||'비평')}</small><h3>${esc(m.title||p.title||'영화 이야기')}</h3><div class="rating-line">${p.rating?stars(Number(p.rating))+' '+Number(p.rating).toFixed(1):'별점 없음'}</div></div></div><h4>${esc(p.title||'')}</h4><p class="${p.spoiler?'v21-spoiler':''}">${esc(p.body||'')}</p><div class="board-tags">${tags}</div><div class="board-actions"><button data-like-post="${p.id}">♡ <span data-like-count="${p.id}">좋아요</span></button><button data-comment-post="${p.id}">댓글 <span data-comment-count="${p.id}">…</span></button><button data-share-post="${p.id}">카드/잡지</button>${mine?`<button data-delete-post="${p.id}" class="danger">삭제</button>`:''}</div></article>`}

  function renderRemoteBoard(){
    const root=document.getElementById('communityBoard');if(!root)return;const arr=(V21.filter==='all'?V21.posts:V21.posts.filter(p=>p.type===V21.filter));root.innerHTML=arr.length?arr.map(postCardHtml).join(''):'<div class="empty">아직 글이 없습니다. 첫 영화 이야기를 남겨보세요.</div>';
    root.querySelectorAll('[data-like-post]').forEach(b=>b.onclick=()=>toggleLikeV21(b.dataset.likePost));root.querySelectorAll('[data-comment-post]').forEach(b=>b.onclick=()=>openCommentsV21(b.dataset.commentPost));root.querySelectorAll('[data-share-post]').forEach(b=>b.onclick=()=>{const p=V21.posts.find(x=>x.id===b.dataset.sharePost);if(p&&typeof openMagazineStudioV2==='function')openMagazineStudioV2(null,p)});root.querySelectorAll('[data-delete-post]').forEach(b=>b.onclick=()=>deletePostV21(b.dataset.deletePost));hydrateCountsV21(arr.slice(0,18));renderV21Stats();
  }

  async function hydrateCountsV21(posts){if(!V21.firebase)return;const {db,fs}=V21.firebase;await Promise.all(posts.map(async p=>{try{const pr=fs.doc(db,'posts',p.id),[lc,cc]=await Promise.all([fs.getCountFromServer(fs.collection(pr,'likes')),fs.getCountFromServer(fs.collection(pr,'comments'))]);const le=document.querySelector(`[data-like-count="${p.id}"]`),ce=document.querySelector(`[data-comment-count="${p.id}"]`);if(le)le.textContent=String(lc.data().count);if(ce)ce.textContent=String(cc.data().count);if(V21.user){const liked=await fs.getDoc(fs.doc(pr,'likes',V21.user.uid));const btn=document.querySelector(`[data-like-post="${p.id}"]`);if(btn)btn.classList.toggle('on',liked.exists())}}catch(_){}}))}

  async function toggleLikeV21(id){if(!requireAuth())return;const {db,fs}=V21.firebase,ref=fs.doc(db,'posts',id,'likes',V21.user.uid),s=await fs.getDoc(ref);if(s.exists())await fs.deleteDoc(ref);else await fs.setDoc(ref,{uid:V21.user.uid,createdAt:fs.serverTimestamp()});const p=V21.posts.find(x=>x.id===id);if(p)hydrateCountsV21([p])}
  async function deletePostV21(id){const p=V21.posts.find(x=>x.id===id);if(!p||p.uid!==V21.user?.uid)return;if(!confirm('이 글을 삭제할까요?'))return;await V21.firebase.fs.deleteDoc(V21.firebase.fs.doc(V21.firebase.db,'posts',id));toast('글을 삭제했습니다.')}

  function ensureCommentsPanel(){let p=document.getElementById('v21CommentsPanel');if(p)return p;p=document.createElement('div');p.id='v21CommentsPanel';p.className='share-panel';p.innerHTML='<div class="share-sheet v21-comments-sheet"><button class="close">×</button><div class="kicker">COMMENTS</div><h2>댓글</h2><div id="v21CommentsList" class="v21-comments-list"></div><div class="v21-comment-compose"><input id="v21CommentInput" maxlength="1000" placeholder="댓글을 입력하세요"><button class="primary" id="v21CommentSend">등록</button></div></div>';document.body.appendChild(p);p.querySelector('.close').onclick=()=>p.classList.remove('open');p.onclick=e=>{if(e.target===p)p.classList.remove('open')};return p}
  async function openCommentsV21(id){const p=ensureCommentsPanel();p.dataset.postId=id;p.classList.add('open');await renderCommentsV21(id);p.querySelector('#v21CommentSend').onclick=async()=>{const input=p.querySelector('#v21CommentInput'),t=input.value.trim();if(!t)return;if(!requireAuth())return;await addCommentV21(id,t);input.value='';await renderCommentsV21(id);const post=V21.posts.find(x=>x.id===id);if(post)hydrateCountsV21([post])}}
  window.openCommentsV21=openCommentsV21;
  async function renderCommentsV21(id){const root=document.getElementById('v21CommentsList');if(!root||!V21.firebase)return;root.innerHTML='<div class="empty">불러오는 중…</div>';const {db,fs}=V21.firebase,q=fs.query(fs.collection(db,'posts',id,'comments'),fs.orderBy('createdAt','asc'),fs.limit(100)),s=await fs.getDocs(q);root.innerHTML=s.empty?'<div class="empty">첫 댓글을 남겨보세요.</div>':s.docs.map(d=>{const c=d.data(),mine=V21.user&&c.uid===V21.user.uid;return `<article><div><b>${esc(c.authorName||'관객')}</b><small>${esc(stampDate(c.createdAt))}</small></div><p>${esc(c.text||'')}</p>${mine?`<button data-del-comment="${d.id}">삭제</button>`:''}</article>`}).join('');root.querySelectorAll('[data-del-comment]').forEach(b=>b.onclick=async()=>{await fs.deleteDoc(fs.doc(db,'posts',id,'comments',b.dataset.delComment));renderCommentsV21(id)})}
  async function addCommentV21(id,text){const {db,fs}=V21.firebase;await fs.addDoc(fs.collection(db,'posts',id,'comments'),{uid:V21.user.uid,authorName:currentNickname(),text:String(text).slice(0,1000),createdAt:fs.serverTimestamp()});toast('댓글을 등록했습니다.')}

  function patchCommunityUI(){ensureAuthButton();const btn=document.getElementById('newPostBtn');if(btn)btn.onclick=()=>openPostComposer();document.querySelectorAll('#boardFilter [data-type]').forEach(b=>b.onclick=()=>{V21.filter=b.dataset.type;document.querySelectorAll('#boardFilter [data-type]').forEach(x=>x.classList.toggle('on',x===b));renderRemoteBoard()});document.querySelectorAll('#v20CommunityQuick button').forEach(b=>{const type=b.textContent.replace(/^\+\s*/,'');b.onclick=()=>{if(!requireAuth())return;openPostComposer();setTimeout(()=>{const s=document.getElementById('postType');if(s)s.value=type},0)}})}

  async function init(){extendPresets();patchPresetRendering();patchCommunityFunctions();let ticks=0;const t=setInterval(()=>{ticks++;extendPresets();patchPresetRendering();patchCommunityUI();ensureAuthButton();if(ticks>80)clearInterval(t)},300);try{const ok=await initFirebaseCommunity();if(!ok)showCommunityNotice('Firebase 커뮤니티 연결 정보를 찾지 못했습니다.')}catch(e){console.warn('v21 firebase',e);showCommunityNotice('Firebase 커뮤니티 연결에 실패했습니다. 기존 기기 데이터는 그대로 보존됩니다.')}setTimeout(()=>{refreshSharePresetRow();refreshMagPresetRow();patchCommunityUI()},1800)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
