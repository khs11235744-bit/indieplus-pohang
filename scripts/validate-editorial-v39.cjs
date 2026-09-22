'use strict';
// Low-memory release gate: no browser, network, login, or Firestore writes.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'');
const json=p=>JSON.parse(read(p));
const checks={};
const jsFiles=fs.readdirSync(root).filter(f=>f.endsWith('.js'));
for(const file of jsFiles)new vm.Script(read(file),{filename:file});checks.jsParsed=jsFiles.length;
const jsonFiles=fs.readdirSync(path.join(root,'data')).filter(f=>f.endsWith('.json'));
for(const file of jsonFiles)json('data/'+file);checks.jsonParsed=jsonFiles.length;
const localPath=p=>path.join(root,p.split('?')[0].replace(/^\.\//,''));
const culture=json('data/culture-year.json');assert.equal(culture.days.length,365);
for(const key of ['ost','story','album','pair']){
 const pool=culture.soundPools[key];assert(pool.length>0);const indices=culture.days.map(d=>d.sound[key]);
 assert(indices.every(i=>Number.isInteger(i)&&i>=0&&i<pool.length));assert.equal(new Set(indices).size,pool.length);
 for(let i=0;i<indices.length;i+=pool.length){const chunk=indices.slice(i,i+pool.length);assert.equal(new Set(chunk).size,chunk.length)}
 for(const x of pool){if(x.image?.startsWith('./'))assert(fs.existsSync(localPath(x.image)),x.image)}
}
for(const key of ['master','term']){const pool=culture[key==='master'?'masters':'terms'];assert(culture.days.every(d=>Number.isInteger(d[key])&&d[key]>=0&&d[key]<pool.length));assert.equal(new Set(culture.days.map(d=>d[key])).size,pool.length)}
assert(culture.soundPools.ost.every(x=>x.image&&x.listenLinks.length>=2));checks.annual={days:365,ost:culture.soundPools.ost.length,stories:culture.soundPools.story.length,albumNotes:culture.soundPools.album.length,pairs:culture.soundPools.pair.length,masters:culture.masters.length,terms:culture.terms.length,fullCoverage:true};
const elements=new Map(['#v30MusicGrid','#v37MusicMeta'].map(k=>[k,{innerHTML:'',textContent:'',classList:{add(){}}}]));
const window={};const ctx=vm.createContext({window,document:{readyState:'loading',addEventListener(){},querySelector:s=>elements.get(s)||null,querySelectorAll:()=>[]},location:{href:'https://indip.web.app/',origin:'https://indip.web.app'},URL,console,Date,setTimeout,clearTimeout,setInterval(){},AbortController});
vm.runInContext(read('features-v30.js'),ctx);const v=window.INDIP_V30;assert.equal(v.version,'39.0.0');v.culture=culture;
assert.equal(v.programmeIndexFor(Date.parse('2026-09-22T15:00:00Z')),0);assert.equal(v.programmeIndexFor(Date.parse('2026-09-22T14:59:59Z')),364);assert.equal(v.programmeIndexFor(Date.parse('2027-09-22T15:00:00Z')),0);
v.resetMusic();const initial=JSON.stringify(v.musicItems().map(x=>x.id));const seen=[];
for(let i=0;i<culture.soundPools.ost.length;i++){seen.push(v.musicItems()[0].id);if(i<culture.soundPools.ost.length-1)v.nextMusic()}
assert.equal(new Set(seen).size,42);v.resetMusic();assert.equal(JSON.stringify(v.musicItems().map(x=>x.id)),initial);checks.rotation={KSTMidnight:true,yearWrap:true,randomUnique:new Set(seen).size,resetRestoresToday:true};
assert(elements.get('#v30MusicGrid').innerHTML.includes('v38-sound-cover'));assert(elements.get('#v30MusicGrid').innerHTML.includes('music.youtube.com'));checks.musicRender=true;
const critique=json('data/criticism-library.json');assert.equal(critique.items.length,13);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reader=vm.createContext({esc,magazineVisualsV2:x=>x.photos||[]});const src=read('features-v08.js');
for(const name of ['annualPhotoCreditHtmlV2','annualPhotoAltV2','annualPhotoMarksV2','annualHeroVisualV2','annualArticleBodyV2']){
 const start=src.indexOf('function '+name+'(');assert(start>=0,name);const end=src.indexOf('\nfunction ',start+10);assert(end>start);vm.runInContext(src.slice(start,end),reader);
}
const five=new Set(['괴물','아가씨','살인의 추억','올드보이','복수는 나의 것']);checks.critiques=[];
for(const x of critique.items){
 assert(x.body&&x.body.length>=800);assert(x.photos?.length>0,x.filmTitle);
 for(const p of x.photos){if(p.startsWith('./'))assert(fs.existsSync(localPath(p)),p)}
 const item={...x,text:x.body};const html=reader.annualArticleBodyV2(item);const paragraphs=x.body.split(/\n{2,}/).map(x=>x.trim()).filter(Boolean);
 const headings=paragraphs.filter(x=>/^#{2,3}\s/.test(x)).length;assert.equal((html.match(/class="annual-(?:subhead|minorhead)"/g)||[]).length,headings);
 if(five.has(x.filmTitle)){
  assert.equal(x.photos.length,4);assert(x.photos.every(p=>p.includes('/critique-film/')));assert(reader.annualHeroVisualV2(item,x.photos[0]).includes('annual-poster-hero'));
  const positions=[...html.matchAll(/data-reading-progress="([\d.]+)"/g)].map(m=>Number(m[1]));assert.equal(positions.length,3);
  assert(positions.every((p,i)=>p<.90&&(i===0||p>positions[i-1])));assert(positions[0]<.4&&positions[2]>.6);
  checks.critiques.push({film:x.filmTitle,photos:x.photos.length,headings,positions});
 }
}
const sw=read('sw.js');const core=JSON.parse(sw.match(/const CORE=(\[[\s\S]*?\]);/)[1]);for(const p of core){if(p==='./')continue;assert(fs.existsSync(localPath(p)),'SW missing '+p)}assert(sw.includes('v039'));assert(read('index.html').includes('./editorial-v38.css'));assert(read('index.html').includes('rev=39'));checks.swAssets=core.length;
const news=json('data/news-weekly.json');checks.news={total:news.items.length,korean:news.items.filter(x=>x.titleKo&&x.summaryKo).length};assert.equal(checks.news.total,checks.news.korean);
checks.openReadings=culture.openReadings.length;assert.equal(checks.openReadings,2);assert(culture.openReadings.every(x=>x.source.startsWith('https://')&&x.license==='CC BY'));
console.log(JSON.stringify({pass:true,checkedAt:new Date().toISOString(),checks},null,2));
