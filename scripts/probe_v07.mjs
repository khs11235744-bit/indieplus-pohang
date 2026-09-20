const targets=await (await fetch("http://127.0.0.1:9225/json")).json();
const page=targets.find(x=>x.type==="page"&&x.url.includes("127.0.0.1:8903"));
if(!page)throw new Error("page target not found");
const ws=new WebSocket(page.webSocketDebuggerUrl);let seq=0;const pending=new Map(),exceptions=[];
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==="Runtime.exceptionThrown")exceptions.push(m.params.exceptionDetails.text)};
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})}
async function ev(expression){const r=await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value}
await call("Runtime.enable");await new Promise(r=>setTimeout(r,3000));
const out={};
out.newsroom=await ev("!!document.getElementById('newsroom')");
out.publicNewsCards=await ev("document.querySelectorAll('.news-card').length");
out.koreanLabels=await ev("document.querySelectorAll('.news-korean-label').length");
out.originalCollapsed=await ev("[...document.querySelectorAll('.news-source-details')].every(x=>!x.open)");
out.pendingVisible=await ev("newsItems().filter(x=>x.translationStatus!=='translated-reviewed').length");
out.cineLens=await ev("!!document.getElementById('cinephileLens')");
out.tipCount=await ev("CINE_TIPS?.tips?.length");
out.tipTextLength=await ev("document.getElementById('cineTipText')?.textContent.length");
out.missionLength=await ev("document.getElementById('cineTipMission')?.textContent.length");
out.initialTip=await ev("currentCineTip().id");
await ev("cineTipCursor++;renderCineTip();true");
out.nextTip=await ev("currentCineTip().id");
await ev("toggleCineTipSave(currentCineTip().id);true");
out.savedTips=await ev("cineSaved().length");
await ev("openCineTipLibrary();true");
out.libraryCards=await ev("document.querySelectorAll('#cineLibraryList article').length");
out.exceptions=exceptions;
console.log(JSON.stringify(out,null,2));ws.close();
