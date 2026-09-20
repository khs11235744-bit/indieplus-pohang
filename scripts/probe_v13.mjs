const targets=await (await fetch("http://127.0.0.1:9227/json")).json();
const page=targets.find(x=>x.type==="page"&&x.url.includes("127.0.0.1:8905"));
if(!page)throw new Error("page target not found");
const ws=new WebSocket(page.webSocketDebuggerUrl);let seq=0;const pending=new Map(),exceptions=[];
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==="Runtime.exceptionThrown")exceptions.push(m.params.exceptionDetails.text)};
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})}
async function ev(expression){const r=await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value}
await call("Runtime.enable");await call("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await new Promise(r=>setTimeout(r,3200));
await ev("localStorage.removeItem('indiePortMagazineV2');localStorage.removeItem('indiePortMagazineSeedVersion');location.reload();true");await new Promise(r=>setTimeout(r,3800));
const out={};
out.longform=await ev("magazineV2().filter(x=>x.sample&&x.magazineEligible!==false&&String(x.text||'').length>=800).map(x=>({id:x.id,len:x.text.length,photos:(x.photos||[]).length}))");
await ev("openMagazineStudioV2('archive-mahjong-revised');true");await new Promise(r=>setTimeout(r,450));
out.exitText=await ev("document.getElementById('closeMagStudio')?.textContent");
out.previewPhotos=await ev("document.querySelectorAll('#magPagePreview img').length");
out.stillButtons=await ev("document.querySelectorAll('#magStillRow [data-magstill]').length");
out.cardPhotos=await ev("document.querySelectorAll('.cardnews-thumbs img').length");
await ev("document.getElementById('closeMagStudio').click();true");await new Promise(r=>setTimeout(r,100));
out.closed=await ev("!document.getElementById('magStudioV2').classList.contains('open')");
out.newsCards=await ev("document.querySelectorAll('.news-card').length");
out.newsWhy=await ev("document.querySelectorAll('.news-why').length");
out.newsTextLen=await ev("Math.min(...[...document.querySelectorAll('.news-summary-ko')].map(x=>x.textContent.length))");
out.cineCount=await ev("CINE_TIPS?.tips?.length||0");
out.cineSourceVisible=await ev("document.getElementById('cineTipSource')?.textContent");
out.tipBefore=await ev("document.getElementById('cineTipText')?.textContent");
await ev("randomCineTip();true");out.tipAfter=await ev("document.getElementById('cineTipText')?.textContent");
out.tipChanged=out.tipBefore!==out.tipAfter;
out.exceptions=exceptions;
console.log(JSON.stringify(out,null,2));ws.close();
