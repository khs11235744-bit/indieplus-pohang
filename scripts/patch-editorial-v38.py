"""One-time, guarded v38 editorial repair. Preserves reader text and user drafts."""
import json
from pathlib import Path
import re
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
def read(name): return (ROOT/name).read_text(encoding='utf-8-sig')
def dump(value): return json.dumps(value, ensure_ascii=False, indent=2)+'\n'
def replace_once(text, old, new):
    if text.count(old)!=1: raise RuntimeError('Expected one anchor: '+old[:100])
    return text.replace(old,new,1)
def block(text, name, new):
    pattern=r'  (?:async )?function '+re.escape(name)+r'\([^\n]*\)\{[\s\S]*?\n  \}'
    text,n=re.subn(pattern,lambda m:new,text,count=1)
    if n!=1: raise RuntimeError('Function anchor missing: '+name)
    return text

changes={}
# CDN may return WebP even for a .jpg URL. Match bytes, not the URL suffix.
enr=read('scripts/enrich-culture-v38.py')
# Existing completed media handling retained during reconciliation.
changes['scripts/enrich-culture-v38.py']=enr

culture=json.loads(read('data/culture-year.json'))
for x in culture['soundPools']['story']:
    if x['id']=='story-10':
        x.update(title='〈파고〉의 장중한 선율은 어디에서 왔을까',body='카터 버웰은 촬영 전 스칸디나비아 민요를 조사하다 찬송가로 불리던 「The Lost Sheep」을 발견했다. 이 선율을 필름 누아르풍 관현악으로 확장해 영화의 도입부에 사용했다고 자신의 작업 노트에서 설명한다.',sourceUrl='https://www.carterburwell.com/projects/Fargo.shtml',sourceLabel='작곡가가 쓴 작업 노트',contentKind='source-based-paraphrase')
    if x['id']=='story-11':
        x.update(title='〈코야니스카시〉, 말 대신 이어지는 이미지와 음악',body='필립 글래스의 공식 작품 안내는 1982년의 이 작업을 자연과 도시의 풍경을 이미지·음악·생각으로 연결한 비언어적 영화로 소개한다. 음악을 따로 들은 뒤 영화를 다시 보면 반복과 편집의 호흡에 집중하기 좋다.',sourceUrl='https://philipglass.com/compositions/koyaanisqatsi/',sourceLabel='필립 글래스 공식 작품 안내',contentKind='source-based-paraphrase')
culture['openReadings']=[
 {'id':'ansani-2020-soundtracks','title':'음악이 달라지면, 같은 장면도 다르게 보일까','titleOriginal':'How Soundtracks Shape What We See: Analyzing the Influence of Music on Visual Scenes Through Self-Assessment, Eye Tracking, and Pupillometry','authors':'Alessandro Ansani · Marco Marini · Francesca D’Errico · Isabella Poggi','year':2020,'journal':'Frontiers in Psychology','body':'같은 영화 장면에 서로 다른 음악을 붙인 두 실험에서, 인물에 대한 공감과 장면 해석이 달라졌다. OST가 감상을 이끄는 방식을 살펴보는 연구다.','source':'https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.02242/full','doi':'10.3389/fpsyg.2020.02242','license':'CC BY','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','adaptation':'초록을 바탕으로 작성한 한국어 소개 · 본문 전체 번역 아님'},
 {'id':'eerola-2016-sad-music','title':'처음 듣는 슬픈 음악에도 감동하는 이유','titleOriginal':'Being Moved by Unfamiliar Sad Music Is Associated with High Empathy','authors':'Tuomas Eerola · Jonna K. Vuoskoski · Hannu Kautiainen','year':2016,'journal':'Frontiers in Psychology','body':'연구는 익숙하지 않은 슬픈 기악곡을 들을 때의 반응을 편안함·감동·불안으로 구분하고, 감동을 동반한 슬픔과 공감 성향의 관련성을 살핀다. 관련성이 곧 인과관계를 뜻하지는 않는다.','source':'https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2016.01176/full','doi':'10.3389/fpsyg.2016.01176','license':'CC BY','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','adaptation':'초록을 바탕으로 작성한 한국어 소개 · 본문 전체 번역 아님'}]
changes['data/culture-year.json']=dump(culture)

js=read('features-v30.js')
if 'V30.programmeIndexFor=' in js: raise RuntimeError('Already reconciled; inspect before repeating')
js=replace_once(js,"V30.version = '38.0.0';","V30.version = '39.0.0';\n  V30.musicOverride = null;\n  V30.musicDecks = {};\n  V30.currentDayKey = '';\n  const SOUND_KEYS=['ost','story','album','pair'];")
start=js.index('  const MUSIC_ROOMS = [')
end=js.index('\n  const MASTER_NOTES', start)
js=js[:start]+'  const MUSIC_ROOMS = '+json.dumps([culture['soundPools']['ost'][0],culture['soundPools']['ost'][5]],ensure_ascii=False)+';\n'+js[end:]
js=block(js,'dayIndex',r'''  function kstDateKey(now=Date.now()){
    const value=now instanceof Date?now.getTime():Number(now);
    return new Date(value+9*3600000).toISOString().slice(0,10);
  }
  function dayIndex(len,offset=0,now=Date.now()){
    if(!Number.isInteger(len)||len<1)return 0;
    const start=V30.culture?.programmeStartsOn||'2026-09-23';
    const day=Math.floor((Date.parse(kstDateKey(now)+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/86400000);
    return ((day+offset)%len+len)%len;
  }''')
js=block(js,'loadCultureYear',r'''  async function loadCultureYear(){
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
  }''')
js=block(js,'musicItems',r'''  function musicItems(offset=V30.musicOffset){
    const pools=V30.culture?.soundPools,day=cultureDay(offset);
    if(!pools||!day)return MUSIC_ROOMS;
    return SOUND_KEYS.map((key,i)=>pools[key][V30.musicOverride?.[i]??day.sound[key]]).filter(Boolean);
  }
  function safeLink(value){
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
    const items=(V30.culture?.soundPools?.ost||MUSIC_ROOMS).filter(x=>[x.filmTitleKo,x.film,x.composer].join(' ').toLocaleLowerCase().includes(needle));
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
  }''')
js=block(js,'renderMusic',r'''  function renderMusic(){
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
  }''')
js=block(js,'renderMaster',r'''  function renderMaster(i){
    const m=masterAt(Number.isInteger(i)?i:V30.masterIndex),root=E('#v30MasterBody');if(!root||!m)return;
    root.innerHTML='<span class="v30-master-tag">'+esc(m.tag)+'</span><p class="v38-master-note">'+esc(m.note)+'</p><div><b>'+esc(m.ko)+'</b><small>'+esc(m.name)+' · INDI+P 편집 해설</small><p class="v38-editorial-disclaimer">감독의 직접 인용이 아니라 작품을 읽는 편집 노트입니다.</p></div>';
  }''')
js=block(js,'renderTermList',r'''  function renderTermList(){
    const root=E('#v30TermList');if(!root)return;
    const needle=(E('#v38TermSearch')?.value||'').trim().toLocaleLowerCase();
    const terms=termPool().map((term,index)=>({term,index})).filter(x=>[x.term.term,x.term.eng,x.term.category].join(' ').toLocaleLowerCase().includes(needle));
    root.innerHTML=terms.map(({term:t,index:i})=>'<button data-index="'+i+'"><span>'+esc(t.category)+'</span><b>'+esc(t.term)+'</b><small>'+esc(t.eng)+'</small></button>').join('')||'<p>찾는 용어가 없습니다.</p>';
    E('#v38TermCount').textContent=terms.length+'개 용어';
  }''')
js=js.replace('<h3>거장의 한마디</h3>','<h3>감독의 작업 노트</h3>').replace("subtitle='거장의 한마디 · '+m.tag","subtitle='감독의 작업 노트 · '+m.tag").replace('다른 거장 보기 →','다른 감독 보기 →')
js=replace_once(js,'<button class="ghostbtn" id="v30NextMusic">다른 음악 보기</button>','<button class="ghostbtn" id="v30NextMusic">다른 음악 보기</button><button class="ghostbtn" id="v38TodayMusic">오늘의 음악</button>')
js=replace_once(js,'<div class="v37-music-meta" id="v37MusicMeta"></div></section>', '<div class="v37-music-meta" id="v37MusicMeta" role="status" aria-live="polite"></div><details class="v38-music-library" id="v38MusicLibrary"><summary>OST 전체 찾아보기</summary><label class="v38-search-label">영화·작곡가 검색<input type="search" id="v38MusicSearch" placeholder="예: 사카모토, Monster" autocomplete="off"></label><p id="v38MusicLibraryCount"></p><div id="v38MusicLibraryList"></div></details><details class="v38-open-reading"><summary>함께 읽는 오픈 리서치</summary><p class="v38-editorial-disclaimer">음반 리뷰와 구분한 공개 연구 소개입니다. 저자·라이선스를 확인한 글만 원문으로 연결합니다.</p><div id="v38OpenReadings"></div></details></section>')
js=replace_once(js,'<div class="v30-term-list" id="v30TermList" hidden></div>', '<div id="v38TermSearchWrap" hidden><label class="v38-search-label">영화 용어 검색<input id="v38TermSearch" type="search" placeholder="예: 몽타주, 편집" autocomplete="off"></label><small id="v38TermCount"></small></div><div class="v30-term-list" id="v30TermList" hidden></div>')
js=replace_once(js,"if(e.target.closest('#v30NextMusic')){V30.musicOffset=Math.floor(Math.random()*365);renderMusic();return}","if(e.target.closest('#v30NextMusic')){nextMusic();return}\n      if(e.target.closest('#v38TodayMusic')){resetMusic();return}")
js=replace_once(js,"list.hidden=!list.hidden;e.target.textContent=list.hidden?'사전 전체 보기':'사전 닫기'", "list.hidden=!list.hidden;E('#v38TermSearchWrap').hidden=list.hidden;E('#v30ToggleDict').textContent=list.hidden?'사전 전체 보기':'사전 닫기';E('#v30ToggleDict').setAttribute('aria-expanded',String(!list.hidden));if(!list.hidden)renderTermList()")
js=block(js,'init',r'''  async function init(){
    ensureSection();bind();refreshPhcf();
    E('#v38MusicLibrary')?.addEventListener('toggle',e=>{if(e.currentTarget.open)renderMusicLibrary()});
    E('#v38MusicSearch')?.addEventListener('input',renderMusicLibrary);
    E('#v38TermSearch')?.addEventListener('input',renderTermList);
    await loadCultureYear();renderTermList();renderOpenReadings();refreshCultureDay();
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshCultureDay()});
    setInterval(()=>{if(!document.hidden)refreshCultureDay()},60000);
    V30.ready=true;
  }''')
js=replace_once(js,"  if(document.readyState==='loading')", "  V30.programmeIndexFor=(now)=>dayIndex(365,0,now);\n  V30.musicItems=musicItems;V30.nextMusic=nextMusic;V30.resetMusic=resetMusic;\n  if(document.readyState==='loading')")
changes['features-v30.js']=js

reader=read('features-v08.js')
start=reader.index('function annualPhotoMarksV2('); end=reader.index('function ensureMagazineAnnualV2()',start)
reader=reader[:start]+r'''function annualPhotoMarksV2(paras,count){
  const prose=paras.map(p=>/^#{2,3}\s/.test(p)?0:p.length);
  const cumulative=[];prose.reduce((sum,n,i)=>(cumulative[i]=sum+n),0);
  const total=cumulative[cumulative.length-1]||1;
  const ratios=({1:[.48],2:[.3,.65],3:[.26,.50,.74],4:[.18,.40,.62,.82]})[Math.min(count,4)]||[];
  const valid=paras.map((p,i)=>i).filter(i=>i>0&&i<paras.length-1&&prose[i]>0&&cumulative[i]/total<.92);
  const used=[];
  for(const ratio of ratios){
    const candidates=valid.filter(i=>!used.includes(i)&&(used.length===0||i>used[used.length-1]));
    if(!candidates.length)break;
    candidates.sort((a,b)=>{
      const score=i=>Math.abs(cumulative[i]/total-ratio)-( /^#{2,3}\s/.test(paras[i+1]||'')?.025:0);
      return score(a)-score(b);
    });used.push(candidates[0]);
  }
  return used;
}
function annualHeroVisualV2(x,src){
  if(!src)return '';
  const poster=/poster/i.test(src+' '+((x.photoCredits||[])[0]?.label||''));
  return '<figure class="annual-article-hero'+(poster?' annual-poster-hero':'')+'"><img class="annual-article-image" src="'+esc(src)+'" alt="'+esc(annualPhotoAltV2(x,0))+'" decoding="async"><figcaption>'+annualPhotoCreditHtmlV2(x,0)+'</figcaption></figure>';
}
function annualArticleBodyV2(x){
  const paras=String(x?.text||'').split(/\n{2,}/).map(p=>p.trim()).filter(Boolean),visuals=magazineVisualsV2(x).slice(1,5);
  if(!paras.length)return '';
  const marks=annualPhotoMarksV2(paras,visuals.length);
  let out='';const total=paras.filter(p=>!/^#{2,3}\s/.test(p)).reduce((n,p)=>n+p.length,0)||1;let progress=0;
  paras.forEach((p,i)=>{
    const h3=p.match(/^##\s+(.+)$/s),h4=p.match(/^###\s+(.+)$/s);
    if(h3)out+='<h3 class="annual-subhead">'+esc(h3[1])+'</h3>';
    else if(h4)out+='<h4 class="annual-minorhead">'+esc(h4[1])+'</h4>';
    else{progress+=p.length;out+='<p>'+esc(p).replace(/\n/g,'<br>')+'</p>';}
    // Emphasis is editorial, not an arbitrary repeated quotation extracted from prose.
    if(i===1&&x.pullQuote)out+='<aside class="annual-pullquote">'+esc(x.pullQuote)+'</aside>';
    marks.forEach((m,j)=>{if(m===i&&visuals[j])out+='<figure class="annual-inline-photo photo-'+(j+1)+'" data-reading-progress="'+(progress/total).toFixed(3)+'"><img src="'+esc(visuals[j])+'" alt="'+esc(annualPhotoAltV2(x,j+1))+'" loading="lazy" decoding="async"><figcaption>'+annualPhotoCreditHtmlV2(x,j+1)+'</figcaption></figure>';});
  });return out;
}
''' +reader[end:]
changes['features-v08.js']=reader
mobile=read('mobile-edition.js').replace("const VERSION='mobile-38'","const VERSION='mobile-39'").replace('모바일판 34','모바일판 39').replace('모바일판 38','모바일판 39')
changes['mobile-edition.js']=mobile
idx=read('index.html').replace('mobile-edition.css?rev=38','mobile-edition.css?rev=39').replace('mobile-edition.js?rev=38','mobile-edition.js?rev=39')
idx=replace_once(idx,'<link rel="stylesheet" href="./mobile-edition.css?rev=39">','<link rel="stylesheet" href="./mobile-edition.css?rev=39">\n<link rel="stylesheet" href="./editorial-v38.css">')
changes['index.html']=idx
sw=re.sub(r'const CACHE="[^"]+";', 'const CACHE="indie-port-v039-music-reader";',read('sw.js')).replace('mobile-edition.css?rev=38','mobile-edition.css?rev=39').replace('mobile-edition.js?rev=38','mobile-edition.js?rev=39')
sw=replace_once(sw,'"./data/culture-year.json",','"./data/culture-year.json","./editorial-v38.css",')
changes['sw.js']=sw
changes['data/ui-release.json']=dump({'id':'mobile-39','builtAt':datetime.now(timezone.utc).isoformat(),'summary':'OST 전곡 순환·듣기 링크·작품 포스터·공개 연구 읽기·비평 이미지 원비율·한국시간 편성'})
# All guarded replacements completed before any existing file is written.
for name,text in changes.items():
    path=ROOT/name;tmp=path.with_name(path.name+'.tmp');tmp.write_text(text,encoding='utf-8');tmp.replace(path)
print('PATCHED',','.join(changes))
