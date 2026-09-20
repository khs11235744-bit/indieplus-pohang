const targets=await (await fetch("http://127.0.0.1:9224/json")).json();
const page=targets.find(x=>x.type==="page"&&x.url.includes("127.0.0.1:8902"));
if(!page)throw new Error("page target not found");
const ws=new WebSocket(page.webSocketDebuggerUrl);let seq=0;const pending=new Map(),exceptions=[];
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==="Runtime.exceptionThrown")exceptions.push(m.params.exceptionDetails.text)};
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})}
async function ev(expression){const r=await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value}
await call("Runtime.enable");await new Promise(r=>setTimeout(r,2600));
const out={};
out.newsroom=await ev("!!document.getElementById('newsroom')");
out.newsCards=await ev("document.querySelectorAll('.news-card').length");
out.translated=await ev("NEWS_WEEKLY.items.filter(x=>x.translationStatus==='translated-reviewed').length");
out.festivals=await ev("document.querySelectorAll('#festivalTracker a').length");
await ev("newsFilter='영화제';renderNewsCards();true");
out.festivalCards=await ev("document.querySelectorAll('.news-card').length");
await ev("newsFilter='all';renderNewsCards();toggleNewsSave(NEWS_WEEKLY.items[0].id);true");
out.savedCount=await ev("newsSaved().length");
out.digest=await ev("document.getElementById('newsDigestSummary')?.textContent.length");
out.exceptions=exceptions;
console.log(JSON.stringify(out,null,2));ws.close();
