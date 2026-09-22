/* INDI+P v24 — mobile navigation bridge and community activation polish. */
(() => {
  const V24 = window.INDIP_V24 = window.INDIP_V24 || {};
  V24.version = '24.0.0';

  const currentUser = () => window.INDIP_V21?.user || null;

  function updateCommunityCopy(){
    const manifesto = document.querySelector('#communityManifesto .feature.main p');
    if(manifesto && /다음 단계|연결합니다/.test(manifesto.textContent || '')){
      manifesto.textContent = '한줄평·긴 비평·GV 후기·추천·질문을 Firebase 커뮤니티에서 여러 기기에 이어 기록하고 토론할 수 있습니다.';
    }
    const hero = document.querySelector('.v20-community-hero p');
    if(hero) hero.textContent = '한줄평·긴 비평·GV 후기·추천·질문을 로그인한 여러 기기에서 이어 쓰고, 댓글·좋아요·팔로우·영화별 토론으로 연결합니다.';
  }

  function bindMobileAccountTab(){
    const btn = document.querySelector('.mobile-nav button[data-scroll="my"]');
    if(!btn) return;
    if(!btn.dataset.v24Bound){
      btn.dataset.v24Bound = '1';
      btn.addEventListener('click', e => {
        if(currentUser()) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        window.openCommunityAuthV21?.();
      }, true);
    }
    const label = currentUser() ? 'MY' : '로그인';
    if(btn.dataset.v24Label !== label){
      btn.dataset.v24Label = label;
      btn.innerHTML = '<span aria-hidden="true">◎</span>' + label;
      btn.setAttribute('aria-label', label);
    }
  }

  function markCommunityReady(){
    const hub = document.getElementById('community');
    if(hub) hub.dataset.communityState = window.INDIP_V21?.firebase ? 'live' : 'loading';
  }

  function tick(){
    updateCommunityCopy();
    bindMobileAccountTab();
    markCommunityReady();
  }

  const observer = new MutationObserver(() => {
    clearTimeout(V24.mutationTimer);
    V24.mutationTimer = setTimeout(tick, 80);
  });

  function init(){
    tick();
    observer.observe(document.body,{childList:true,subtree:true});
    V24.timer = setInterval(tick,1200);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();