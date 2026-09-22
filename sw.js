const CACHE="indie-port-v036-critique-editorial";
const CORE=["./","./index.html","./app.css","./editorial-v18.css","./v20.css","./v21.css","./v22.css","./mobile-v24.css","./community-v28.css","./culture-v30.css","./editorial-v32.css","./mobile-v33.css","./app.js","./firebase-client.js","./firebase-loader.js","./firebase-bridge.js","./features-v04.js","./features-v05.js","./features-v06.js","./features-v07.js","./features-v08.js","./features-v17.js","./features-v20.js","./features-v21.js","./features-v22.js","./features-v24.js","./features-v28.js","./features-v30.js","./data/live.json","./data/movies.json","./data/programs.json","./data/editorial.json","./data/share-assets.json","./data/providers.json","./data/api-status.json","./data/brand.json","./data/news-sources.json","./data/news-weekly.json","./data/phcf.json","./data/cinephile-tips.json","./data/sample-magazines.json","./data/criticism-library.json","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./assets/share/crit-sentimental-still1.jpg","./mobile-edition.css?rev=36","./mobile-edition.js?rev=36","./data/director-portraits.json"];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&(k.startsWith('indie-port-')||k.startsWith('indip-'))).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  // Firebase Auth redirects, third-party services and private endpoints are never cached here.
  if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/__/')||url.pathname==='/sw.js'||url.pathname==='/data/ui-release.json')return;
  const navigation=request.mode==='navigate';
  const staticAsset=/\.(?:css|js|json|png|jpg|jpeg|webp|svg|woff2|webmanifest)$/i.test(url.pathname);
  if(!navigation&&!staticAsset)return;
  const key=url.pathname.startsWith('/data/')?url.origin+url.pathname:request;
  event.respondWith(fetch(request).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(key,copy)).catch(()=>{}));}
    return response;
  }).catch(async()=>{
    const cached=await caches.match(key);
    if(cached)return cached;
    if(navigation)return (await caches.match('./index.html'))||Response.error();
    return Response.error();
  }));
});
