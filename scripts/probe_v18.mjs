const targets=await (await fetch("http://127.0.0.1:9233/json")).json();
const page=targets.find(x=>x.type==="page"&&x.url.includes("127.0.0.1:8910"));if(!page)throw new Error("page target not found");
const ws=new WebSocket(page.webSocketDebuggerUrl);let seq=0;const pending=new Map(),exceptions=[];
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==="Runtime.exceptionThrown")exceptions.push(m.params.exceptionDetails.text)};
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})}
async function ev(expression){const r=await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value}
await call("Runtime.enable");await call("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await new Promise(r=>setTimeout(r,4200));
const out={};
out.order=await ev("[...document.querySelectorAll('main > section')].map(x=>x.id).filter(Boolean)");
out.discoverIndex=out.order.indexOf("discover");out.criticismIndex=out.order.indexOf("criticism");out.newsIndex=out.order.indexOf("newsroom");
out.colors=await ev("({body:getComputedStyle(document.body).backgroundColor,crit:getComputedStyle(document.getElementById('criticism')).backgroundColor,news:getComputedStyle(document.getElementById('newsroom')).backgroundColor,accent:getComputedStyle(document.documentElement).getPropertyValue('--lime').trim()})");
out.posterDisplay=await ev("getComputedStyle(document.querySelector('.poster-card')).display");
out.posterCols=await ev("getComputedStyle(document.getElementById('posterGrid')).gridTemplateColumns");
out.mobileCrit=await ev("!!document.querySelector('.mobile-nav [data-scroll=criticism]')");
out.fullCrits=await ev("magazineV2().filter(isMagazineLongformV2).length");
await ev("openSharePanelV05(Object.keys(MOVIES)[0]);true");await new Promise(r=>setTimeout(r,300));
out.sharePresets=await ev("[...document.querySelectorAll('#presetRow [data-preset]')].map(x=>({k:x.dataset.preset,n:x.textContent,on:x.classList.contains('on')}))");
out.shareTitle=await ev("document.querySelector('#sharePanelV05 h2')?.textContent");
out.shareBlob=await ev("(async()=>{const b=await makeShareBlobV05(activeMovieCode,readV05Opts());return b.size})()");
out.exceptions=exceptions;console.log(JSON.stringify(out,null,2));ws.close();