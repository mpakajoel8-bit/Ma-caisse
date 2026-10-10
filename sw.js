/* Ma Caisse : fonctionnement hors ligne. Changez le numéro de VERSION à chaque mise à jour du site. */
const VERSION="v1";
const CACHE="ma-caisse-"+VERSION;
const FONTS="ma-caisse-polices";
const SHELL=["./","index.html","manifest.json","icon-192.png","icon-512.png","icon-maskable-512.png","apple-touch-icon.png"];

self.addEventListener("install",function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(SHELL)}).then(function(){return self.skipWaiting()}));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE&&k!==FONTS}).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});
self.addEventListener("fetch",function(e){
  var req=e.request;
  if(req.method!=="GET")return;
  var url=new URL(req.url);
  if(url.hostname==="fonts.googleapis.com"||url.hostname==="fonts.gstatic.com"){
    e.respondWith(caches.open(FONTS).then(function(c){
      return c.match(req).then(function(hit){
        var net=fetch(req).then(function(r){if(r&&(r.ok||r.type==="opaque"))c.put(req,r.clone());return r}).catch(function(){return hit});
        return hit||net;
      });
    }));
    return;
  }
  if(url.origin!==location.origin)return;
  if(req.mode==="navigate"){
    e.respondWith(caches.match("index.html").then(function(hit){
      var net=fetch(req).then(function(r){
        if(r&&r.ok){var copy=r.clone();caches.open(CACHE).then(function(c){c.put("index.html",copy)})}
        return r;
      }).catch(function(){return null});
      return hit||net.then(function(r){return r||new Response("Hors ligne",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}})});
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function(hit){
    return hit||fetch(req).then(function(r){
      if(r&&r.ok){var copy=r.clone();caches.open(CACHE).then(function(c){c.put(req,copy)})}
      return r;
    });
  }));
});
