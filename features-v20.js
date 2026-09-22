// INDI+P v20 — desktop UX, community-first layout, newsroom refresh,
// magazine/card studio presets, and large-target accessibility.
(() => {
  const V20 = window.INDIP_V20 = window.INDIP_V20 || {};
  V20.version = '20.0.0';
  V20.brand = 'INDI+P';

  const MAG_PRESETS = {
    journal:{name:'Film Journal',bg:'#f2eee5',text:'#151515',muted:'#68635c',accent:'#a62520',serif:true,base:'journal'},
    critic:{name:"Critic's Note",bg:'#0d0e10',text:'#f5f4ef',muted:'#8c939b',accent:'#d8ff43',serif:false,base:'critic'},
    festival:{name:'Festival Program',bg:'#f7f3e8',text:'#161616',muted:'#746f65',accent:'#1d4b78',serif:true,base:'festival'},
    zine:{name:'Indie Zine',bg:'#f1e35d',text:'#111111',muted:'#4d4a2f',accent:'#d12d24',serif:false,base:'zine'},
    newspaper:{name:'Cinema Daily',bg:'#ece9df',text:'#171717',muted:'#605d55',accent:'#171717',serif:true,base:'newspaper'},
    archive:{name:'Archive No.',bg:'#18221e',text:'#edf0e9',muted:'#95a099',accent:'#f0b866',serif:true,base:'archive'},
    noir:{name:'Noir File',bg:'#050505',text:'#f0eee7',muted:'#777777',accent:'#e6e6e6',serif:true,base:'noir'},
    postcard:{name:'Movie Postcard',bg:'#e8ded0',text:'#1d1a17',muted:'#71685f',accent:'#9c372f',serif:true,base:'postcard'},
    swiss:{name:'Swiss Grid',bg:'#f4f2ea',text:'#111111',muted:'#6d6b64',accent:'#ed3b2f',serif:false,base:'festival'},
    brutal:{name:'Brutalist Type',bg:'#0a0a0a',text:'#ffffff',muted:'#a8a8a8',accent:'#ff3b30',serif:false,base:'critic'},
    museum:{name:'Museum Label',bg:'#faf9f5',text:'#202020',muted:'#77736e',accent:'#2e5e4e',serif:true,base:'postcard'},
    cobalt:{name:'Cobalt Festival',bg:'#0f2f68',text:'#fffdf4',muted:'#b9c7e2',accent:'#ffb703',serif:false,base:'festival'},
    vermilion:{name:'Vermilion Press',bg:'#f0e9de',text:'#1a1713',muted:'#6c6258',accent:'#c73124',serif:true,base:'newspaper'},
    mint:{name:'Mint Cinema',bg:'#dcefe6',text:'#10251d',muted:'#607a70',accent:'#0b8f68',serif:false,base:'journal'},
    lavender:{name:'Lavender Note',bg:'#eee7f7',text:'#20192b',muted:'#756b82',accent:'#7057d9',serif:true,base:'postcard'},
    mono:{name:'Monochrome Index',bg:'#f5f5f2',text:'#101010',muted:'#6e6e6a',accent:'#101010',serif:false,base:'archive'},
    cream:{name:'Cream Editorial',bg:'#f4ead8',text:'#261d16',muted:'#7d6c5f',accent:'#7d3528',serif:true,base:'journal'},
    midnight:{name:'Midnight Screening',bg:'#08111e',text:'#edf3ff',muted:'#8a9ab5',accent:'#55d6ff',serif:false,base:'critic'},
    dossier:{name:'Festival Dossier',bg:'#e8e6df',text:'#171717',muted:'#6e6b63',accent:'#c54830',serif:false,base:'archive'},
    screenplay:{name:'Screenplay Page',bg:'#f7f3e9',text:'#171717',muted:'#777064',accent:'#111111',serif:true,base:'newspaper'},
    marquee:{name:'Marquee Night',bg:'#140d0d',text:'#fff4db',muted:'#c1aa82',accent:'#f4b73f',serif:true,base:'festival'},
    analogue:{name:'Analog Contact',bg:'#161616',text:'#f4efe6',muted:'#96918a',accent:'#f05a36',serif:false,base:'noir'},
    gallery:{name:'Gallery Review',bg:'#fcfbf7',text:'#171717',muted:'#7b7771',accent:'#6d64a8',serif:true,base:'postcard'},
    signal:{name:'Signal Red',bg:'#e53b2c',text:'#fffaf2',muted:'#ffd2cc',accent:'#161616',serif:false,base:'zine'},
    bluebook:{name:'Blue Book',bg:'#dce5f3',text:'#10233f',muted:'#66788f',accent:'#2557a7',serif:true,base:'journal'},
    forest:{name:'Forest Archive',bg:'#132019',text:'#eff3ed',muted:'#98a69e',accent:'#d6a44c',serif:true,base:'archive'},
    rose:{name:'Rose Cinema',bg:'#f4e2df',text:'#291916',muted:'#8d6f69',accent:'#b73745',serif:true,base:'postcard'},
    lime:{name:'Lime Statement',bg:'#111310',text:'#f7f7f2',muted:'#92998b',accent:'#d8ff43',serif:false,base:'critic'}
  };

  const SHARE_PRESETS = {
    editorial:{name:'Editorial Cover',bg:'#f0ede5',text:'#171717',muted:'#67625b',accent:'#a21d16',base:'editorial'},
    cinema:{name:'Still + Quote',bg:'#090a0b',text:'#f7f7f2',muted:'#a2a8b0',accent:'#d8ff43',base:'cinema'},
    split:{name:'Split Review',bg:'#0c1520',text:'#f3f6f8',muted:'#8796a6',accent:'#55d6ff',base:'split'},
    gallery:{name:'Gallery Label',bg:'#fbfaf6',text:'#171717',muted:'#77736e',accent:'#7670a8',base:'gallery'},
    noir:{name:'B&W Note',bg:'#050505',text:'#f0eee7',muted:'#777777',accent:'#e6e6e6',base:'noir'},
    classic:{name:'Archive Print',bg:'#ece3d2',text:'#241d17',muted:'#766b5f',accent:'#7e2f27',base:'classic'},
    festival:{name:'Festival Program',bg:'#f7f3e8',text:'#161616',muted:'#746f65',accent:'#1d4b78',base:'festival'},
    postcard:{name:'Movie Postcard',bg:'#e8ded0',text:'#1d1a17',muted:'#71685f',accent:'#9c372f',base:'postcard'},
    contact:{name:'Contact Sheet',bg:'#0a0a0a',text:'#f4f0e6',muted:'#99958b',accent:'#f0c14b',base:'contact'},
    neon:{name:'Neon Cinema',bg:'#100a19',text:'#fff6ff',muted:'#b69bc2',accent:'#ff49c8',base:'neon'},
    swiss:{name:'Swiss Film Grid',bg:'#f6f4ec',text:'#111111',muted:'#6a6861',accent:'#e03d2f',base:'festival'},
    brutal:{name:'Brutalist Type',bg:'#090909',text:'#ffffff',muted:'#a5a5a5',accent:'#ff3b30',base:'noir'},
    museum:{name:'Museum Caption',bg:'#faf9f5',text:'#202020',muted:'#78736c',accent:'#295a4c',base:'postcard'},
    cobalt:{name:'Cobalt Festival',bg:'#12366f',text:'#fffdf5',muted:'#b8c6df',accent:'#ffb703',base:'festival'},
    vermilion:{name:'Vermilion Press',bg:'#f0e7d9',text:'#1c1712',muted:'#6e6157',accent:'#c83326',base:'editorial'},
    mint:{name:'Mint Review',bg:'#dbeee5',text:'#10241d',muted:'#63796f',accent:'#0b8c67',base:'gallery'},
    lavender:{name:'Lavender Note',bg:'#eee8f7',text:'#241c2d',muted:'#7b7087',accent:'#7358d8',base:'postcard'},
    newspaper:{name:'Cinema Daily',bg:'#ece9df',text:'#171717',muted:'#605d55',accent:'#171717',base:'classic'},
    dossier:{name:'Film Dossier',bg:'#e8e6df',text:'#171717',muted:'#6f6b63',accent:'#bf4c32',base:'contact'},
    screenplay:{name:'Screenplay',bg:'#f8f3e8',text:'#181818',muted:'#777067',accent:'#151515',base:'classic'},
    marquee:{name:'Marquee Night',bg:'#150e0e',text:'#fff4d7',muted:'#c2aa82',accent:'#f4b73f',base:'cinema'},
    analogue:{name:'Analog Strip',bg:'#151515',text:'#f5efe4',muted:'#9a948b',accent:'#f05a36',base:'filmstrip'},
    rose:{name:'Rose Cinema',bg:'#f3e2df',text:'#2c1916',muted:'#8b6c68',accent:'#b73947',base:'postcard'},
    lime:{name:'Lime Statement',bg:'#10120f',text:'#f7f7f2',muted:'#93998c',accent:'#d8ff43',base:'cinema'},
    bluebook:{name:'Blue Book',bg:'#dce5f2',text:'#11243f',muted:'#66798f',accent:'#2558a7',base:'gallery'},
    signal:{name:'Signal Red',bg:'#e63c2d',text:'#fffaf2',muted:'#ffd5cf',accent:'#141414',base:'editorial'}
  };

  V20.magPresets = MAG_PRESETS;
  V20.sharePresets = SHARE_PRESETS;
  V20.localPhotos = V20.localPhotos || {};

  function applyBrand() {
    const brand = document.getElementById('brandName');
    if (brand) {
      const small = brand.querySelector('small');
      if (brand.firstChild) brand.firstChild.nodeValue = 'INDI+P';
      if (small) small.textContent = 'CINEMA · CRITICISM · COMMUNITY';
    }
    const mark = document.getElementById('brandMark'); if (mark) mark.textContent = 'I+P';
    const footer = document.getElementById('brandFooter'); if (footer) footer.textContent = 'INDI+P';
    document.title = 'INDI+P — cinema, criticism & community';
  }

  function removeSocialLogin() {
    document.getElementById('accountPanel')?.remove();
    document.querySelectorAll('.social-login-row,.oauth-divider,.oauth-buttons').forEach(el => el.remove());
    const btn = document.getElementById('profileBtnV05');
    if (btn) btn.textContent = '관객 프로필';
    const profilePanel = document.getElementById('profilePanelV05');
    if (profilePanel) {
      profilePanel.querySelector('.oauth-divider')?.remove();
      profilePanel.querySelector('.oauth-buttons')?.remove();
      const k = profilePanel.querySelector('.kicker'); if (k) k.textContent = 'LOCAL PROFILE';
      const small = profilePanel.querySelector('.share-sheet>small');
      if (small) small.textContent = '로그인 없이 이 기기에 닉네임·관람기록·비평을 저장합니다.';
    }
  }

  function promoteCommunity() {
    const studio = document.getElementById('communityStudio');
    if (!studio) return false;
    let legacy = document.getElementById('community');
    if (legacy && !legacy.classList.contains('v20-community-hub')) {
      legacy.id = 'communityManifesto';
      legacy.classList.add('v20-community-manifesto');
    }
    let hub = document.getElementById('community');
    if (!hub) {
      hub = document.createElement('section');
      hub.id = 'community';
      hub.className = 'wrap section v20-community-hub';
      const anchor = document.getElementById('newsroom') || document.getElementById('criticism') || document.getElementById('discover');
      anchor?.insertAdjacentElement('afterend', hub);
      hub.innerHTML = '<div class="v20-community-hero"><div><div class="kicker">COMMUNITY</div><h2>영화 본 뒤, 바로 이야기하는 곳</h2><p>한줄평·긴 비평·GV 후기·추천·질문을 하나의 피드에서 이어갑니다.</p></div><div class="v20-community-stats" id="v20CommunityStats"></div></div><div class="v20-community-quick" id="v20CommunityQuick"></div>';
      const quick = hub.querySelector('#v20CommunityQuick');
      ['한줄평','긴 비평','GV 후기','추천','질문'].forEach(type => {
        const b = document.createElement('button'); b.className='ghostbtn'; b.textContent = '+ '+type;
        b.onclick = () => {
          if (typeof openPostComposer === 'function') openPostComposer();
          setTimeout(() => { const sel=document.getElementById('postType'); if(sel) sel.value=type; }, 0);
        };
        quick.appendChild(b);
      });
    }
    if (studio.parentElement !== hub) hub.appendChild(studio);
    if (legacy && legacy !== hub && !legacy.classList.contains('v20-community-hub')) legacy.classList.add('v20-hide-legacy');
    hub.classList.remove('v20-hide-legacy');
    renderCommunityStats();
    return true;
  }

  function renderCommunityStats() {
    const root = document.getElementById('v20CommunityStats'); if (!root) return;
    let posts=[]; try { posts = typeof communityPosts === 'function' ? communityPosts() : []; } catch(_) {}
    const comments = posts.reduce((n,p)=>n+(p.comments?.length||0),0);
    const likes = posts.reduce((n,p)=>n+(p.likes||0),0);
    root.innerHTML = `<span>글 <b>${posts.length}</b></span><span>댓글 <b>${comments}</b></span><span>좋아요 <b>${likes}</b></span>`;
  }

  function patchCommunityHooks() {
    if (typeof createPost === 'function' && !V20.createPostPatched) {
      V20.createPostPatched = true;
      const old = createPost;
      createPost = function(data){ const out=old(data); setTimeout(renderCommunityStats,0); return out; };
    }
    if (typeof addPostComment === 'function' && !V20.commentPatched) {
      V20.commentPatched = true;
      const old = addPostComment;
      addPostComment = function(id,text){ const out=old(id,text); setTimeout(renderCommunityStats,0); return out; };
    }
    if (typeof togglePostLike === 'function' && !V20.likePatched) {
      V20.likePatched = true;
      const old = togglePostLike;
      togglePostLike = function(id){ const out=old(id); setTimeout(renderCommunityStats,0); return out; };
    }
  }

  function framesForLayout(name,count) {
    count = Math.max(1, Math.min(5, count||1));
    if (count===1) return [{x:0,y:0,w:1,h:1}];
    const preset = {
      split65:[{x:0,y:0,w:.65,h:1},{x:.65,y:0,w:.35,h:1}],
      split50:[{x:0,y:0,w:.5,h:1},{x:.5,y:0,w:.5,h:1}],
      topbottom:[{x:0,y:0,w:1,h:.58},{x:0,y:.58,w:1,h:.42}],
      triptych:[{x:0,y:0,w:.34,h:1},{x:.34,y:0,w:.33,h:1},{x:.67,y:0,w:.33,h:1}],
      magazine:[{x:0,y:0,w:.62,h:1},{x:.62,y:0,w:.38,h:.5},{x:.62,y:.5,w:.38,h:.5}],
      grid4:[{x:0,y:0,w:.5,h:.5},{x:.5,y:0,w:.5,h:.5},{x:0,y:.5,w:.5,h:.5},{x:.5,y:.5,w:.5,h:.5}],
      filmstrip:[{x:0,y:0,w:1,h:.25},{x:0,y:.25,w:1,h:.25},{x:0,y:.5,w:1,h:.25},{x:0,y:.75,w:1,h:.25}],
      mosaic5:[{x:0,y:0,w:.58,h:1},{x:.58,y:0,w:.42,h:.25},{x:.58,y:.25,w:.42,h:.25},{x:.58,y:.5,w:.42,h:.25},{x:.58,y:.75,w:.42,h:.25}]
    }[name] || [];
    if (!preset.length) return typeof shareDefaultFramesV05==='function' ? shareDefaultFramesV05(count) : [];
    if (preset.length >= count) return preset.slice(0,count);
    return typeof shareDefaultFramesV05==='function' ? shareDefaultFramesV05(count) : preset;
  }

  function installSharePresetButtons(panel) {
    const row = panel.querySelector('#presetRow'); if (!row) return;
    row.classList.add('v20-preset-row');
    row.innerHTML = Object.entries(SHARE_PRESETS).map(([k,p]) => `<button data-preset="${k}" title="${p.name}">${p.name}</button>`).join('');
    row.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => {
      v05Share.preset = b.dataset.preset;
      v05Share.customColors = null;
      row.querySelectorAll('[data-preset]').forEach(x=>x.classList.toggle('on',x===b));
      document.querySelectorAll('#v20ColorPanel input[type=color]').forEach(i=>i.value = SHARE_PRESETS[b.dataset.preset]?.[i.dataset.key] || i.value);
      refreshV05Preview();
    });
    row.querySelector(`[data-preset="${v05Share?.preset||'editorial'}"]`)?.classList.add('on');
  }

  function upgradeSharePanel() {
    const panel = document.getElementById('sharePanelV05'); if (!panel) return;
    const sheet = panel.querySelector('.share-sheet.v05'); if (!sheet) return;
    installSharePresetButtons(panel);

    if (!panel.querySelector('#v20LocalPhoto')) {
      const photoTitle = panel.querySelector('.share-photo-title');
      const wrap = document.createElement('div'); wrap.className='v20-local-upload';
      wrap.innerHTML = '<label class="ghostbtn">+ 내 사진 추가<input id="v20LocalPhoto" type="file" accept="image/*" multiple hidden></label><small>선택한 사진은 현재 편집 세션에서만 사용합니다.</small>';
      photoTitle?.insertAdjacentElement('beforebegin', wrap);
      wrap.querySelector('input').onchange = e => {
        const files=[...(e.target.files||[])].slice(0,8); if(!files.length)return;
        Promise.all(files.map(f=>new Promise(res=>{const rd=new FileReader();rd.onload=()=>res(rd.result);rd.readAsDataURL(f)}))).then(arr=>{
          V20.localPhotos[activeMovieCode]=[...(V20.localPhotos[activeMovieCode]||[]),...arr].slice(-12);
          renderStillPicker(activeMovieCode); toast('내 사진을 편집기에 추가했습니다.');
        });
      };
    }

    if (!panel.querySelector('#v20LayoutPresets')) {
      const row = document.createElement('div'); row.id='v20LayoutPresets'; row.className='v20-layout-presets';
      row.innerHTML = [['auto','자동'],['split65','65/35'],['split50','반반'],['topbottom','위/아래'],['triptych','3분할'],['magazine','매거진'],['grid4','4컷'],['filmstrip','필름스트립'],['mosaic5','5컷 모자이크']].map(([k,n])=>`<button data-v20-layout="${k}">${n}</button>`).join('');
      panel.querySelector('.share-layout-row')?.insertAdjacentElement('afterend',row);
      row.querySelectorAll('button').forEach(b=>b.onclick=()=>{
        const key=b.dataset.v20Layout; const count=(v05Share.stillIndices||[0]).length;
        if(key==='auto'){v05Share.layout='auto';v05Share.frames=shareDefaultFramesV05(count)}
        else{v05Share.layout='free';v05Share.frames=framesForLayout(key,count)}
        v05Share.activePhoto=0;
        panel.querySelectorAll('[data-share-layout]').forEach(x=>x.classList.toggle('on',x.dataset.shareLayout===(key==='auto'?'auto':'free')));
        row.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
        syncFreeEditorV05();renderGestureStageV05();refreshV05Preview();
      });
    }

    if (!panel.querySelector('#v20ColorPanel')) {
      const box=document.createElement('div');box.id='v20ColorPanel';box.className='v20-color-panel';
      box.innerHTML='<label>배경<input type="color" data-key="bg" value="#f0ede5"></label><label>본문<input type="color" data-key="text" value="#171717"></label><label>포인트<input type="color" data-key="accent" value="#a21d16"></label><button class="ghostbtn" id="v20ColorReset">프리셋 색으로</button>';
      panel.querySelector('.share-options')?.insertAdjacentElement('afterend',box);
      box.querySelectorAll('input[type=color]').forEach(inp=>inp.oninput=()=>{
        v05Share.customColors=v05Share.customColors||{};v05Share.customColors[inp.dataset.key]=inp.value;refreshV05Preview();
      });
      box.querySelector('#v20ColorReset').onclick=()=>{v05Share.customColors=null;refreshV05Preview()};
    }

    if (!sheet.querySelector('.v20-share-grid')) {
      const close=sheet.querySelector('.close');
      const grid=document.createElement('div');grid.className='v20-share-grid';
      const left=document.createElement('div');left.className='v20-share-controls';
      const right=document.createElement('aside');right.className='v20-share-preview-pane';
      [...sheet.children].filter(n=>n!==close).forEach(n=>{
        if(n.classList.contains('share-preview')||n.classList.contains('share-actions')||(n.tagName==='SMALL'&&n.parentElement===sheet)) right.appendChild(n); else left.appendChild(n);
      });
      grid.append(left,right);sheet.appendChild(grid);
    }
  }

  function patchShareFunctions() {
    if (typeof presetStyle === 'function' && !V20.presetStylePatched) {
      V20.presetStylePatched=true; const old=presetStyle;
      presetStyle=function(name){
        const alias=window.__v20PresetAlias||name;
        const base=SHARE_PRESETS[alias] ? {...SHARE_PRESETS[alias]} : {...old(name)};
        const custom=(typeof v05Share!=='undefined'&&v05Share?.customColors)||null;
        if(custom){if(custom.bg)base.bg=custom.bg;if(custom.text)base.text=custom.text;if(custom.accent)base.accent=custom.accent}
        return base;
      };
    }
    if (typeof shareMediaV05 === 'function' && !V20.shareMediaPatched) {
      V20.shareMediaPatched=true; const old=shareMediaV05;
      shareMediaV05=function(code){return [...(V20.localPhotos[code]||[]),...old(code)].filter((x,i,a)=>x&&a.indexOf(x)===i).slice(0,24)};
    }
    if (typeof makeShareBlobV05 === 'function' && !V20.makeSharePatched) {
      V20.makeSharePatched=true; const old=makeShareBlobV05;
      makeShareBlobV05=async function(code,opts={}){
        const alias=opts.preset||'editorial',spec=SHARE_PRESETS[alias];
        if(spec&&spec.base&&spec.base!==alias){window.__v20PresetAlias=alias;try{return await old(code,{...opts,preset:spec.base})}finally{window.__v20PresetAlias=null}}
        return old(code,opts);
      };
    }
    if (typeof openSharePanelV05 === 'function' && !V20.openSharePatched) {
      V20.openSharePatched=true; const old=openSharePanelV05;
      openSharePanelV05=function(...args){const out=old(...args);setTimeout(upgradeSharePanel,0);return out};
    }
  }

  function upgradeMagazinePresetRow(panel) {
    const row=panel.querySelector('#magPresetRow');if(!row)return;
    row.classList.add('v20-mag-preset-row');
    row.innerHTML=Object.entries(MAG_PRESETS).map(([k,p])=>`<button data-magpreset="${k}">${p.name}</button>`).join('');
    row.querySelectorAll('[data-magpreset]').forEach(b=>b.onclick=()=>{
      MAG_STUDIO.preset=b.dataset.magpreset;
      row.querySelectorAll('[data-magpreset]').forEach(x=>x.classList.toggle('on',x===b));
      renderMagazinePreviewV2();renderCardNewsV2();
    });
    row.querySelector(`[data-magpreset="${MAG_STUDIO?.preset||'journal'}"]`)?.classList.add('on');
  }

  function injectCardCountControl() {
    const root=document.getElementById('cardNewsStudioV2'); if(!root||root.querySelector('#v20CardCount'))return;
    const head=root.querySelector('.card-format-row');if(!head)return;
    const label=document.createElement('label');label.className='v20-card-count';
    const count=Math.max(2,Math.min(10,Number(MAG_STUDIO.cardCount||5)));MAG_STUDIO.cardCount=count;
    label.innerHTML=`카드 수 <input id="v20CardCount" type="range" min="2" max="10" step="1" value="${count}"><b>${count}</b>`;
    head.appendChild(label);
    label.querySelector('input').oninput=e=>{MAG_STUDIO.cardCount=Number(e.target.value);label.querySelector('b').textContent=e.target.value;setTimeout(()=>renderCardNewsV2(),20)};
  }

  function patchMagazineFunctions() {
    if (typeof magPreset==='function'&&!V20.magPresetPatched) {
      V20.magPresetPatched=true; const old=magPreset;
      magPreset=function(name){return MAG_PRESETS[name]?{...MAG_PRESETS[name]}:old(name)};
    }
    if (typeof drawCardPresetPhotoV2==='function'&&!V20.cardDrawPatched) {
      V20.cardDrawPatched=true; const old=drawCardPresetPhotoV2;
      drawCardPresetPhotoV2=function(ctx,img,preset,w,imageH,pad,p){const base=MAG_PRESETS[preset]?.base||preset;return old(ctx,img,base,w,imageH,pad,p)};
    }
    if (typeof cardPresetOptionsV2==='function'&&!V20.cardPresetPatched) {
      V20.cardPresetPatched=true;
      cardPresetOptionsV2=function(selected){return Object.entries(MAG_PRESETS).map(([k,p])=>`<option value="${k}" ${selected===k?'selected':''}>${p.name}</option>`).join('')};
    }
    if (typeof cardAutoSlidesV2==='function'&&!V20.cardAutoPatched) {
      V20.cardAutoPatched=true;
      cardAutoSlidesV2=function(item){
        const total=Math.max(2,Math.min(10,Number(MAG_STUDIO.cardCount||5))),bodyCount=Math.max(1,total-1);
        const chunks=splitReviewForCards(item.text,bodyCount).slice(0,bodyCount).map(x=>clipCardTextV2(x,148)),slides=[];
        slides.push({kind:'cover',role:'cover',title:item.headline,body:clipCardTextV2(item.deck||item.lead||'',104),index:0});
        chunks.forEach((body,i)=>slides.push({kind:'body',role:'body',title:i===0?'비평의 시작':'핵심 문장 '+String(i+1).padStart(2,'0'),body,index:i+1}));
        const trimmed=slides.slice(0,total);if(trimmed.length>1)trimmed[trimmed.length-1].role='end';return trimmed;
      };
    }
    if (typeof cardSlideDataV2==='function'&&!V20.cardDataPatched) {
      V20.cardDataPatched=true;
      cardSlideDataV2=function(item){const max=Math.max(2,Math.min(10,Number(MAG_STUDIO.cardCount||5)));if(MAG_STUDIO.cardManual&&MAG_STUDIO.cardEdits?.length)return MAG_STUDIO.cardEdits.slice(0,max).map((s,i)=>({...s,index:i}));return cardAutoSlidesV2(item)};
    }
    if (typeof renderCardNewsV2==='function'&&!V20.renderCardPatched) {
      V20.renderCardPatched=true;const old=renderCardNewsV2;
      renderCardNewsV2=function(){const out=old();setTimeout(injectCardCountControl,0);return out};
    }
    if (typeof openMagazineStudioV2==='function'&&!V20.openMagPatched) {
      V20.openMagPatched=true;const old=openMagazineStudioV2;
      openMagazineStudioV2=function(...args){const out=old(...args);setTimeout(()=>{const p=document.getElementById('magStudioV2');if(p)upgradeMagazinePresetRow(p)},0);return out};
    }
  }

  async function loadLatestNews() {
    let data=null;
    if (typeof window.fetchIndiePublicData==='function') {
      for (const name of ['news-weekly','news']) {
        try { const d=await window.fetchIndiePublicData(name,'./data/news-weekly.json',false); if(d?.items?.length){data=d;break} } catch(_) {}
      }
    }
    if (!data) {
      try { const r=await fetch('./data/news-weekly.json?v='+Date.now(),{cache:'no-store'});if(r.ok)data=await r.json() } catch(_) {}
    }
    if (data?.items?.length) {
      NEWS_WEEKLY=data;renderNewsCards();updateNewsMetaV20();return true;
    }
    return false;
  }

  function updateNewsMetaV20() {
    const root=document.getElementById('newsroom');if(!root||!NEWS_WEEKLY)return;
    const items=NEWS_WEEKLY.items||[],done=items.filter(x=>x.translationStatus==='translated-reviewed'&&x.titleKo).length;
    let meta=root.querySelector('#v20NewsMeta');if(!meta){meta=document.createElement('div');meta.id='v20NewsMeta';meta.className='v20-news-meta';root.querySelector('.section-head')?.appendChild(meta)}
    meta.innerHTML=`<span>최신 ${items.length}개</span><span>한글편집 ${done}개</span><span>${NEWS_WEEKLY.generatedAt?new Date(NEWS_WEEKLY.generatedAt).toLocaleString('ko-KR'):''}</span>`;
  }

  function patchNewsCardsRenderer() {
    if (typeof renderNewsCards!=='function' || V20.newsRendererPatched) return;
    V20.newsRendererPatched=true;
    renderNewsCards=function(){
      const root=document.getElementById('newsGrid');if(!root)return;
      const saved=newsSaved(),items=newsItems();
      root.innerHTML=items.length?items.map(x=>{
        const translated=x.translationStatus==='translated-reviewed'&&x.titleKo&&x.summaryKo;
        const title=x.titleKo||x.titleOriginal||'기사';
        const summary=x.summaryKo||x.descriptionOriginal||'한국어 요약 편집을 준비 중입니다. 원문 링크에서 먼저 확인할 수 있습니다.';
        const tags=(x.tags||[]).map(t=>'<span>#'+esc(t)+'</span>').join('');
        const status=translated?'한글 편집완료':'최신 원문 · 편집대기';
        return '<article class="news-card v20-news-card '+(translated?'translated':'pending')+'">'+
          '<div class="news-card-top"><span class="news-cat">'+esc(x.category||'영화')+'</span>'+(x.official?'<span class="news-official">OFFICIAL</span>':'')+'<span class="v20-news-status">'+status+'</span><button aria-label="기사 저장" onclick="toggleNewsSave(\''+x.id+'\')">'+(saved.includes(x.id)?'★':'☆')+'</button></div>'+
          '<small>'+esc(x.source||'')+' · '+esc(newsDate(x.publishedAt))+'</small><h3>'+esc(title)+'</h3><p class="news-summary-ko">'+esc(summary)+'</p>'+
          (x.whyItMatters?'<div class="news-why"><b>왜 주목할까</b><p>'+esc(x.whyItMatters)+'</p></div>':'')+
          ((x.keyPoints||[]).length?'<div class="news-keypoints">'+x.keyPoints.slice(0,3).map(v=>'<span>'+esc(v)+'</span>').join('')+'</div>':'')+
          '<div class="news-tags">'+tags+'</div><div class="news-actions"><span>'+status+'</span><a class="ghostbtn" href="'+esc(x.url||'#')+'" target="_blank" rel="noopener">원문 보기 ↗</a></div></article>';
      }).join(''):'<div class="empty">이 필터에 해당하는 소식이 없습니다.</div>';
    };
  }

  function patchNewsroom() {
    patchNewsCardsRenderer();
    if (typeof newsItems==='function'&&!V20.newsItemsPatched) {
      V20.newsItemsPatched=true;
      newsItems=function(){
        const all=(NEWS_WEEKLY?.items||[]).filter(x=>x.titleKo||x.titleOriginal);
        if(newsFilter==='all')return all;if(newsFilter==='saved')return all.filter(x=>newsSaved().includes(x.id));return all.filter(x=>x.category===newsFilter);
      };
    }
    const root=document.getElementById('newsroom');if(!root)return;
    if(!root.querySelector('#v20RefreshNews')){
      const b=document.createElement('button');b.id='v20RefreshNews';b.className='ghostbtn';b.textContent='↻ 최신 기사';
      b.onclick=async()=>{b.disabled=true;b.textContent='불러오는 중…';const ok=await loadLatestNews();b.disabled=false;b.textContent=ok?'✓ 업데이트됨':'↻ 다시 시도';setTimeout(()=>b.textContent='↻ 최신 기사',1800)};
      root.querySelector('.section-head')?.appendChild(b);
    }
    renderNewsCards();updateNewsMetaV20();
  }

  function patchProfileOpen() {
    if(typeof openProfilePanel==='function'&&!V20.profileOpenPatched){V20.profileOpenPatched=true;const old=openProfilePanel;openProfilePanel=function(...args){const out=old(...args);setTimeout(removeSocialLogin,0);return out}}
  }

  function init() {
    applyBrand();removeSocialLogin();patchCommunityHooks();patchShareFunctions();patchMagazineFunctions();patchProfileOpen();
    let ticks=0;
    const timer=setInterval(()=>{
      ticks++;applyBrand();removeSocialLogin();patchCommunityHooks();patchShareFunctions();patchMagazineFunctions();patchProfileOpen();promoteCommunity();patchNewsroom();
      if(ticks>120)clearInterval(timer);
    },250);
    setTimeout(()=>{promoteCommunity();patchNewsroom();upgradeSharePanel();const p=document.getElementById('magStudioV2');if(p)upgradeMagazinePresetRow(p)},1400);
    setInterval(()=>{loadLatestNews().catch(()=>{})},10*60*1000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
