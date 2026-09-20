const targets=await (await fetch("http://127.0.0.1:9230/json")).json();
const page=targets.find(x=>x.type==="page"&&x.url.includes("127.0.0.1:8907"));
if(!page)throw new Error("page target not found");
const ws=new WebSocket(page.webSocketDebuggerUrl);let seq=0;const pending=new Map(),exceptions=[];
await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==="Runtime.exceptionThrown")exceptions.push(m.params.exceptionDetails.text)};
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})}
async function ev(expression){const r=await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value}
await call("Runtime.enable");await call("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await new Promise(r=>setTimeout(r,3500));
const out={};
out.brand=await ev("document.getElementById('brandName')?.childNodes[0]?.nodeValue");
out.brandOrigin=await ev("document.getElementById('brandOrigin')?.textContent");
out.footer=await ev("document.getElementById('brandFooter')?.textContent");
out.filters=await ev("[...document.querySelectorAll('#newsFilter [data-news]')].map(x=>x.textContent)");
out.cinemaSources=await ev("document.querySelectorAll('#cinemaTracker a').length");
out.localSources=await ev("document.querySelectorAll('#localArtsTracker a').length");
out.allNews=await ev("newsItems().length");
await ev("newsFilter='국내 영화';renderNewsCards();true");out.domestic=await ev("document.querySelectorAll('#newsGrid .news-card').length");
await ev("newsFilter='예술영화관';renderNewsCards();true");out.cinemas=await ev("document.querySelectorAll('#newsGrid .news-card').length");
await ev("newsFilter='지역 예술';renderNewsCards();true");out.localArts=await ev("document.querySelectorAll('#newsGrid .news-card').length");
out.localTitles=await ev("[...document.querySelectorAll('#newsGrid .news-card h3')].map(x=>x.textContent)");
out.mobileNews=await ev("!!document.querySelector('.mobile-nav [data-scroll=newsroom]')");
out.exceptions=exceptions;
console.log(JSON.stringify(out,null,2));ws.close();