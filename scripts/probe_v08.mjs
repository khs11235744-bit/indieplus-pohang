const targets=await (await fetch("http://127.0.0.1:9226/json")).json();
const page=targets.find(x=>x.type==="page"&&x.url.includes("127.0.0.1:8904"));
if(!page)throw new Error("page target not found");
const ws=new WebSocket(page.webSocketDebuggerUrl);let seq=0;const pending=new Map(),exceptions=[];
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==="Runtime.exceptionThrown")exceptions.push(m.params.exceptionDetails.text)};
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})}
async function ev(expression){const r=await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value}
await call("Runtime.enable");await call("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});await new Promise(r=>setTimeout(r,3000));
await ev("localStorage.removeItem('indiePortMagazineV2');location.reload();true");await new Promise(r=>setTimeout(r,3200));
const out={};out.sampleCount=await ev("magazineV2().filter(x=>x.sample).length");out.sampleId=await ev("magazineV2().find(x=>x.sample)?.id");
await ev("openMagazineStudioV2('sample-what-should-we-have-done');true");await new Promise(r=>setTimeout(r,500));
out.presetCount=await ev("document.querySelectorAll('[data-magpreset]').length");out.presetLabels=await ev("[...document.querySelectorAll('[data-magpreset]')].map(x=>x.textContent)");
out.issue=await ev("studioItemFromForm().issue");out.code=await ev("studioItemFromForm().code");out.previewImage=await ev("document.querySelector('#magPagePreview img')?.getAttribute('src')||''");
out.visualPaths=await ev("cardVisualsV2(studioItemFromForm())");out.cardThumbs=await ev("document.querySelectorAll('.cardnews-thumbs article').length");out.cardImages=await ev("[...document.querySelectorAll('.cardnews-thumbs img')].map(x=>({src:x.getAttribute('src'),loaded:x.complete&&x.naturalWidth>0}))");
out.mobileColumns=await ev("getComputedStyle(document.querySelector('.cardnews-thumbs')).gridTemplateColumns");out.singleSaveButtons=await ev("document.querySelectorAll('[data-card-save]').length");
out.blobSizes=await ev("(async()=>{const i=studioItemFromForm(),s=cardSlideDataV2(i),a=[];for(let n=0;n<s.length;n++){a.push((await makeCardSlideBlobV2(i,s[n],n)).size)}return a})()");
out.magazineBlob=await ev("(async()=>{return (await makeMagazinePageBlobV2(studioItemFromForm())).size})()");
out.shareSupport=await ev("(()=>{const f=new File([new Blob(['x'],{type:'image/png'})],'x.png',{type:'image/png'});return {share:!!navigator.share,canShare:!!navigator.canShare,files:!!navigator.canShare?.({files:[f]})}})()");
out.exceptions=exceptions;console.log(JSON.stringify(out,null,2));ws.close();
