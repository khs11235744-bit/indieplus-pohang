const targets=await (await fetch("http://127.0.0.1:9226/json")).json();
const page=targets.find(x=>x.type==="page"&&x.url.includes("127.0.0.1:8904"));
if(!page)throw new Error("page target not found");
const ws=new WebSocket(page.webSocketDebuggerUrl);let seq=0;const pending=new Map(),exceptions=[];
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==="Runtime.exceptionThrown")exceptions.push(m.params.exceptionDetails.text)};
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})}
async function ev(expression){const r=await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value}
await call("Runtime.enable");await new Promise(r=>setTimeout(r,3200));
const out={};
out.sampleCount=await ev("magazineV2().filter(x=>x.sample).length");
out.shelfCards=await ev("document.querySelectorAll('.mag-v2-cover').length");
out.sampleHeadline=await ev("magazineV2().find(x=>x.sample)?.headline");
await ev("openMagazineStudioV2('sample-man-from-earth-kwon-hyeongseok');true");
await new Promise(r=>setTimeout(r,250));
out.previewHeadline=await ev("document.querySelector('#magPagePreview h2')?.textContent");
out.previewAuthor=await ev("document.querySelector('.mag-page-byline')?.textContent");
out.cardThumbs=await ev("document.querySelectorAll('.cardnews-thumbs article').length");
out.issue=await ev("studioItemFromForm().issue");
out.magazineBlob=await ev("(async()=>{const b=await makeMagazinePageBlobV2(studioItemFromForm());return b.size})()");
out.cardBlob=await ev("(async()=>{const i=studioItemFromForm(),s=cardSlideDataV2(i)[0],b=await makeCardSlideBlobV2(i,s,0);return b.size})()");
out.exceptions=exceptions;
console.log(JSON.stringify(out,null,2));ws.close();
