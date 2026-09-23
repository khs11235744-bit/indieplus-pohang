(()=>{'use strict';
  const V40=window.INDIP_SHARE_V40={version:'40.0.0',lastFocus:null,ready:false};

  const q=(root,sel)=>root?.querySelector(sel)||null;
  const qa=(root,sel)=>[...(root?.querySelectorAll(sel)||[])];

  function sectionHead(number,title,note=''){
    const el=document.createElement('div');el.className='v40-section-head';
    el.innerHTML='<span>'+number+'</span><h4>'+title+'</h4>'+(note?'<small>'+note+'</small>':'');
    return el;
  }

  function wrapAdvanced(panel,id,label,nodes){
    if(panel.querySelector('#'+id))return panel.querySelector('#'+id);
    const valid=nodes.filter(Boolean);if(!valid.length)return null;
    const details=document.createElement('details');details.id=id;details.className='v40-advanced';
    const summary=document.createElement('summary');summary.textContent=label;
    const body=document.createElement('div');body.className='v40-advanced-body';
    valid[0].parentNode.insertBefore(details,valid[0]);
    details.append(summary,body);valid.forEach(n=>body.appendChild(n));
    return details;
  }

  function addCharacterCounter(input,max){
    const label=input?.closest('label');if(!label||label.querySelector('.v40-char-count'))return;
    const out=document.createElement('span');out.className='v40-char-count';
    const update=()=>out.textContent=(input.value||'').length+' / '+max;
    label.insertBefore(out,input);input.addEventListener('input',update);update();
  }

  function addRangeOutput(input){
    const label=input?.closest('label');if(!label||label.querySelector('.v40-range-value'))return;
    const out=document.createElement('span');out.className='v40-range-value';
    const update=()=>{
      const id=input.id||'';
      if(id==='shareCopyOffset')out.textContent=(Number(input.value)||0)+'%';
      else if(id==='shareRating')out.textContent=Number(input.value||0).toFixed(1);
      else out.textContent=(Number(input.value)||100)+'%';
    };
    label.insertBefore(out,input);input.addEventListener('input',update);update();
  }

  function updatePressed(panel){
    qa(panel,'[data-preset]').forEach(x=>x.setAttribute('aria-pressed',String(x.classList.contains('on'))));
    qa(panel,'[data-format]').forEach(x=>x.setAttribute('aria-pressed',String(x.classList.contains('on'))));
    qa(panel,'[data-share-layout],[data-v20-layout],[data-text-align]').forEach(x=>x.setAttribute('aria-pressed',String(x.classList.contains('on'))));
    const badge=q(panel,'.v40-format-badge');
    const active=q(panel,'[data-format].on');
    if(badge&&active)badge.textContent=active.textContent.trim();
  }

  function announce(panel,text){
    const live=q(panel,'.v40-live');if(live){live.textContent='';requestAnimationFrame(()=>live.textContent=text)}
  }

  function visibleFocusable(panel){
    return qa(panel,'button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),summary,a[href],[tabindex]:not([tabindex="-1"])')
      .filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'});
  }

  function syncOpenState(panel){
    const open=panel.classList.contains('open');
    document.documentElement.classList.toggle('v40-share-open',open);
    if(open){
      requestAnimationFrame(()=>q(panel,'.v40-share-quicknav button')?.focus({preventScroll:true}));
    }else if(V40.lastFocus?.focus){
      try{V40.lastFocus.focus({preventScroll:true})}catch{}
    }
  }

  function installKeyboard(panel){
    if(panel.dataset.v40Keys)return;panel.dataset.v40Keys='1';
    panel.addEventListener('keydown',e=>{
      if(!panel.classList.contains('open'))return;
      if(e.key==='Escape'){e.preventDefault();q(panel,'#closeShareV05')?.click();return}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){
        e.preventDefault();q(panel,'#saveShareV05')?.click();announce(panel,'공유카드 이미지 저장을 시작합니다.');return;
      }
      if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){
        e.preventDefault();q(panel,'#nativeShareV05')?.click();announce(panel,'공유 메뉴를 엽니다.');return;
      }
      if(e.key==='Tab'){
        const list=visibleFocusable(panel);if(!list.length)return;
        const first=list[0],last=list[list.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
      }
    });
    panel.addEventListener('click',e=>{
      if(e.target===panel&&matchMedia('(min-width:961px)').matches){
        e.preventDefault();e.stopImmediatePropagation();announce(panel,'데스크톱에서는 닫기 버튼 또는 Esc 키로 편집기를 닫습니다.');
      }
    },true);
  }

  function addQuickNav(left){
    if(q(left,'.v40-share-toolbar'))return;
    const toolbar=document.createElement('div');toolbar.className='v40-share-toolbar';
    toolbar.innerHTML='<div><h3>공유카드 편집</h3><p>디자인·사진·문구를 조정하면서 오른쪽 미리보기를 계속 확인할 수 있습니다.</p></div><nav class="v40-share-quicknav" aria-label="편집 단계 빠른 이동"><button data-v40-target="presetRow">1 디자인</button><button data-v40-target="sharePhotoCount">2 사진</button><button data-v40-target="shareTitleV05">3 문구</button><button data-v40-target="v40TextDetails">4 세부</button></nav>';
    left.insertBefore(toolbar,left.firstChild);
    toolbar.querySelectorAll('[data-v40-target]').forEach(btn=>btn.onclick=()=>{
      const target=document.getElementById(btn.dataset.v40Target);
      (target?.closest('.v40-advanced')||target)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    });
  }

  function addSectionHeads(left){
    const preset=q(left,'#presetRow');
    if(preset&&!q(left,'#v40DesignHead')){const h=sectionHead('01','디자인','프리셋 · 비율');h.id='v40DesignHead';preset.parentNode.insertBefore(h,preset)}
    const photo=q(left,'.share-photo-title');
    if(photo&&!q(left,'#v40PhotoHead')){const h=sectionHead('02','사진','최대 5장');h.id='v40PhotoHead';photo.parentNode.insertBefore(h,photo)}
    const copy=q(left,'.share-copy-editor');
    if(copy&&!q(left,'#v40CopyHead')){const h=sectionHead('03','문구','제목 · 부제 · 비평');h.id='v40CopyHead';copy.parentNode.insertBefore(h,copy)}
  }

  function enhanceAdvanced(panel,left){
    const gesture=q(left,'.share-gesture-wrap'),free=q(left,'#shareFreeEditor');
    const photoDetails=wrapAdvanced(panel,'v40PhotoDetails','사진 배치 정밀 조정',[gesture,free]);
    const textTools=q(left,'.share-text-tools'),options=q(left,'.share-options'),colors=q(left,'#v20ColorPanel');
    const textDetails=wrapAdvanced(panel,'v40TextDetails','글자 크기 · 정렬 · 별점 · 색상',[textTools,options,colors]);
    if(photoDetails){
      panel.addEventListener('click',e=>{
        const b=e.target.closest('[data-share-layout],[data-v20-layout]');if(!b)return;
        const key=b.dataset.shareLayout||b.dataset.v20Layout||'';
        if(key&&key!=='auto')photoDetails.open=true;
      });
    }
    return {photoDetails,textDetails};
  }

  function enhancePreview(panel,right){
    if(!q(right,'.v40-preview-head')){
      const head=document.createElement('div');head.className='v40-preview-head';
      head.innerHTML='<b>실시간 미리보기</b><span class="v40-format-badge">4:5 피드</span>';
      right.insertBefore(head,right.firstChild);
    }
    const preview=q(right,'.share-preview');if(preview){preview.setAttribute('aria-label','공유카드 실시간 미리보기')}
    const actions=q(right,'.share-actions');
    if(actions&&!q(right,'.v40-preview-help')){
      const help=document.createElement('p');help.className='v40-preview-help';help.textContent='Ctrl/⌘+S 이미지 저장 · Ctrl/⌘+Enter 공유 · Esc 닫기';
      actions.insertAdjacentElement('afterend',help);
    }
    qa(actions,'button').forEach(b=>b.setAttribute('title',b.textContent.trim()));
  }

  function enhanceFields(panel){
    addCharacterCounter(q(panel,'#shareTitleV05'),70);
    addCharacterCounter(q(panel,'#shareMidV05'),120);
    addCharacterCounter(q(panel,'#shareTextV05'),700);
    ['shareTitleScale','shareMidScale','shareReviewScale','shareCopyOffset','shareRating'].forEach(id=>addRangeOutput(q(panel,'#'+id)));
    q(panel,'#shareTextV05')?.setAttribute('aria-label','짧은 비평');
    q(panel,'#shareTags')?.setAttribute('aria-label','해시태그');
    q(panel,'#shareStamp')?.setAttribute('aria-label','도장 선택');
  }

  function enhancePhotoButtons(panel){
    qa(panel,'#stillPicker button').forEach((b,i)=>b.setAttribute('aria-label','사진 '+(i+1)+' 선택'));
    qa(panel,'#sharePhotoOrder article').forEach((a,i)=>{a.setAttribute('tabindex','0');a.setAttribute('aria-label','선택한 사진 '+(i+1))});
  }

  function upgradeShareStudio(retry=0){
    const panel=document.getElementById('sharePanelV05');if(!panel)return;
    const sheet=q(panel,'.share-sheet.v05'),grid=q(sheet,'.v20-share-grid'),left=q(sheet,'.v20-share-controls'),right=q(sheet,'.v20-share-preview-pane');
    if(!sheet||!grid||!left||!right){if(retry<8)setTimeout(()=>upgradeShareStudio(retry+1),40);return}

    panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','공유카드 편집기');
    sheet.classList.add('v40-share-sheet');
    const close=q(panel,'#closeShareV05');if(close){close.setAttribute('aria-label','공유카드 편집기 닫기');close.title='닫기 (Esc)'}
    if(!q(panel,'.v40-live')){const live=document.createElement('div');live.className='v40-live';live.setAttribute('aria-live','polite');panel.appendChild(live)}

    addQuickNav(left);addSectionHeads(left);enhanceAdvanced(panel,left);enhancePreview(panel,right);enhanceFields(panel);enhancePhotoButtons(panel);updatePressed(panel);installKeyboard(panel);

    if(!panel.dataset.v40Delegate){
      panel.dataset.v40Delegate='1';
      panel.addEventListener('click',e=>{
        if(e.target.closest('[data-preset],[data-format],[data-share-layout],[data-v20-layout],[data-text-align]')){
          requestAnimationFrame(()=>{updatePressed(panel);enhancePhotoButtons(panel)});
        }
      });
      panel.addEventListener('input',()=>requestAnimationFrame(()=>updatePressed(panel)));
      new MutationObserver(()=>syncOpenState(panel)).observe(panel,{attributes:true,attributeFilter:['class']});
    }

    panel.dataset.v40Ready='1';syncOpenState(panel);V40.ready=true;
  }

  function patchOpen(){
    if(typeof window.openSharePanelV05!=='function'||V40.patched)return;
    V40.patched=true;
    const old=window.openSharePanelV05;
    window.openSharePanelV05=function(...args){
      V40.lastFocus=document.activeElement;
      const out=old.apply(this,args);
      setTimeout(()=>upgradeShareStudio(),60);
      return out;
    };
  }

  function init(){patchOpen();if(document.getElementById('sharePanelV05'))upgradeShareStudio()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();