const targets=await (await fetch("http://127.0.0.1:9228/json")).json();
const page=targets.find(x=>x.type==="page"&&x.url.includes("127.0.0.1:8906"));
if(!page)throw new Error("page target not found");
const ws=new WebSocket(page.webSocketDebuggerUrl);let seq=0;const pending=new Map(),exceptions=[];
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==="Runtime.exceptionThrown")exceptions.push(m.params.exceptionDetails.text)};
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})}
async function ev(expression){const r=await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value}
await call("Runtime.enable");await call("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await new Promise(r=>setTimeout(r,3000));
await ev("localStorage.removeItem('indiePortMagazineV2');localStorage.removeItem('indiePortMagazineSeedVersion');location.reload();true");await new Promise(r=>setTimeout(r,3800));
const out={};
out.fullIds=await ev("magazineV2().filter(x=>x.sample&&x.magazineEligible!==false&&String(x.text||'').length>=800).map(x=>({id:x.id,len:x.text.length,photos:(x.photos||[]).length,author:x.author}))");
out.pendingIds=await ev("magazineV2().filter(x=>x.sample&&x.excerptOnly).map(x=>x.id)");
out.coverText=await ev("document.querySelector('#magazineShelfV2 .annual-cover-copy')?.textContent||''");
out.recoveryText=await ev("document.querySelector('.mag-recovery-index')?.textContent||''");
await ev("openMagazineStudioV2('archive-world-owner-2026');true");await new Promise(r=>setTimeout(r,450));
out.world={previewPhotos:await ev("document.querySelectorAll('#magPagePreview img').length"),cardPhotos:await ev("document.querySelectorAll('.cardnews-thumbs img').length"),bodyLen:await ev("studioItemFromForm().text.length"),author:await ev("studioItemFromForm().author")};
await ev("document.getElementById('closeMagStudio').click();true");
await ev("openMagazineStudioV2('archive-grand-budapest-2026');true");await new Promise(r=>setTimeout(r,450));
out.grand={previewPhotos:await ev("document.querySelectorAll('#magPagePreview img').length"),cardPhotos:await ev("document.querySelectorAll('.cardnews-thumbs img').length"),bodyLen:await ev("studioItemFromForm().text.length"),author:await ev("studioItemFromForm().author")};
await ev("document.getElementById('closeMagStudio').click();true");
out.exceptions=exceptions;console.log(JSON.stringify(out,null,2));ws.close();