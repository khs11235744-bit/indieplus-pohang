const targets=await (await fetch("http://127.0.0.1:9222/json")).json();
const page=targets.find(x=>x.type==="page"&&x.url.includes("127.0.0.1:8900"));
if(!page)throw new Error("page target not found");
const ws=new WebSocket(page.webSocketDebuggerUrl);
let seq=0;const pending=new Map();const exceptions=[];
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
ws.onmessage=e=>{
  const msg=JSON.parse(e.data);
  if(msg.id&&pending.has(msg.id)){const {resolve,reject}=pending.get(msg.id);pending.delete(msg.id);msg.error?reject(msg.error):resolve(msg.result)}
  if(msg.method==="Runtime.exceptionThrown")exceptions.push(msg.params.exceptionDetails.text);
};
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})}
async function evalv(expression){
  const r=await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);
  return r.result.value;
}
await call("Runtime.enable");
await new Promise(r=>setTimeout(r,2200));
const result={};
result.posterCards=await evalv("document.querySelectorAll('.poster-card').length");
result.dailyTitle=await evalv("document.getElementById('dailyPickTitle')?.textContent");
result.diaryExists=await evalv("!!document.getElementById('cinemaDiary')");
result.shareFunction=await evalv("typeof shareMovieCard");
result.similarCount=await evalv("similarMovies('029552',3).length");
await evalv("openMovie('029552');true");
await new Promise(r=>setTimeout(r,200));
result.similarRendered=await evalv("document.querySelectorAll('#similarMovies button').length");
result.directorWorks=await evalv("document.querySelector('#directorWorks')?.textContent.includes('히치콕/트뤼포')");
result.shareBlobBytes=await evalv("(async()=>{const b=await makeShareBlob('029552','feed','테스트 영화 문장');return b.size})()");
await evalv("markWatched('029552','2026-09-20');true");
result.diaryCards=await evalv("document.querySelectorAll('.diary-card').length");
result.exceptions=exceptions;
console.log(JSON.stringify(result,null,2));
ws.close();
