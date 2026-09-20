const targets=await (await fetch("http://127.0.0.1:9223/json")).json();
const page=targets.find(x=>x.type==="page"&&x.url.includes("127.0.0.1:8901"));
if(!page)throw new Error("page target not found");
const ws=new WebSocket(page.webSocketDebuggerUrl);let seq=0;const pending=new Map(),exceptions=[];
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==="Runtime.exceptionThrown")exceptions.push(m.params.exceptionDetails.text)};
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})}
async function ev(expression){const r=await call("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text);return r.result.value}
await call("Runtime.enable");await new Promise(r=>setTimeout(r,2500));
const out={};
out.boardExists=await ev("!!document.getElementById('communityBoard')");
out.profileButton=await ev("!!document.getElementById('profileBtnV05')");
out.stillCount=await ev("localStills('029552').length");
out.postId=await ev("createPost({code:'029552',type:'긴 비평',title:'테스트 비평',body:'한 영화에 대해 길게 생각한 기록입니다.',rating:4.5,tags:['포항','독립영화'],spoiler:false}).id");
out.posts=await ev("communityPosts().length");
await ev("togglePostLike(communityPosts()[0].id);true");
out.likes=await ev("communityPosts()[0].likes");
await ev("addPostComment(communityPosts()[0].id,'좋은 글입니다');true");
out.comments=await ev("communityPosts()[0].comments.length");
await ev("saveAsMagazine(communityPosts()[0].id);true");
out.magazines=await ev("magazineArchive().length");
out.presets=await ev("['cinema','magazine','ticket','filmstrip','minimal'].length");
out.cardBytes=await ev("(async()=>{const b=await makeShareBlobV05('029552',{preset:'magazine',format:'feed',rating:4.5,tags:['포항','독립영화'],stamp:'관람완료',stillIndex:1,text:'테스트 비평문'});return b.size})()");
out.exceptions=exceptions;
console.log(JSON.stringify(out,null,2));ws.close();
