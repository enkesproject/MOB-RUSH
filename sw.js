const C='mobrush-v3';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  // Always fetch the page itself from the network so updates arrive instantly
  if(e.request.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('index.html')){
    e.respondWith(
      fetch(e.request).then(res=>{
        const cp=res.clone();
        caches.open(C).then(c=>c.put(e.request,cp)).catch(()=>{});
        return res;
      }).catch(()=>caches.match(e.request).then(h=>h||caches.match('./')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{
      const cp=res.clone();
      caches.open(C).then(c=>c.put(e.request,cp)).catch(()=>{});
      return res;
    }))
  );
});
