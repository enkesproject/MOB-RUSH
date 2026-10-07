const C='mobrush-v2';
const CORE=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil((async()=>{
    const c=await caches.open(C);
    // simpan satu per satu supaya kalau 1 file gagal, SW tetap terpasang
    for(const u of CORE){
      try{const r=await fetch(u);if(r&&r.ok)await c.put(u,r);}catch(err){}
    }
  })());
});

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
  // Halaman utama: selalu network-first agar update langsung terlihat
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
  // Aset lain: cache-first
  e.respondWith(
    caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{
      const cp=res.clone();
      caches.open(C).then(c=>c.put(e.request,cp)).catch(()=>{});
      return res;
    }))
  );
});
