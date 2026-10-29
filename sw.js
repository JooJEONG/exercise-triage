/* Exercice de triage (EMR) – garde la page dans le navigateur pour l'ouvrir aussi sans internet.
   Page d'accueil : le réseau d'abord, mais seulement une page arrivée en entier. Sans réseau, ou si la page
   n'est pas arrivée en entier en 3 secondes, la copie gardée ; elle est remplacée dès qu'une page arrive en entier.
   Manifeste et icônes : la copie gardée d'abord. Si le manifeste ou les icônes changent : VERSION v1 → v2. */
var VERSION = 'v1';
var HOME = self.registration.scope;
var PREFIX = 'exercice-triage:' + new URL(HOME).pathname + ':';  // une copie par adresse : un essai à une autre adresse n'efface pas celle-ci
var CACHE = PREFIX + VERSION;
var OLD = ['exercice-triage-v1'];                                   // nom du premier envoi (29/10/2026)
var FILES = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
var WAIT_MS = 3000;

function pathOf(u){ var x = new URL(u); return x.origin + x.pathname; }
function isHome(u){ var p = pathOf(u); return p === HOME || p === HOME + 'index.html'; }
function good(r){ return !!r && r.ok && r.type === 'basic'; }
function saved(){ return caches.open(CACHE).then(function(c){ return c.match(HOME); }).catch(function(){ return undefined; }); }
function offlinePage(){
  return new Response('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Hors connexion</title></head>' +
    '<body style="font:16px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:24px;color:#3a4754">' +
    '<p><b>Pas de connexion internet.</b> L’exercice n’est pas encore gardé dans ce navigateur : ouvrez le lien une fois avec internet.</p>' +
    '<p><b>No internet connection.</b> The practice is not saved in this browser yet: open the link once with internet.</p></body></html>',
    {status: 503, headers: {'Content-Type': 'text/html; charset=utf-8'}});
}

self.addEventListener('install', function(e){
  // la page est indispensable ; le manifeste et les icônes non (un fichier manquant ne doit pas tout empêcher)
  e.waitUntil(caches.open(CACHE).then(function(c){
    var get = function(f){ return c.add(new Request(f, {cache: 'no-cache'})); };
    return Promise.all([get(FILES[0])].concat(FILES.slice(1).map(function(f){ return get(f).catch(function(){}); })));
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){
      if (k.indexOf(PREFIX) === 0 && k !== CACHE) return caches.delete(k);
      if (OLD.indexOf(k) < 0) return;
      // ancien nom sans adresse : l'effacer seulement s'il contient la page de cette adresse
      return caches.open(k).then(function(c){ return c.match(HOME); }).then(function(r){ if (r) return caches.delete(k); });
    }));
  }).then(function(){ return self.clients.claim(); }));
});

function home(e){
  var req = e.request;
  // la page en entier : une page coupée ne doit ni s'afficher ni remplacer la copie
  var net = fetch(new Request(HOME, {cache: 'no-cache', credentials: 'same-origin'})).then(function(r){
    if (r.redirected || !good(r)) return {r: r};
    var type = r.headers.get('Content-Type') || 'text/html; charset=utf-8';
    return r.arrayBuffer().then(function(buf){ return {buf: buf, type: type}; });
  });
  function page(x){ return new Response(x.buf, {status: 200, headers: {'Content-Type': x.type}}); }
  e.waitUntil(net.then(function(x){
    if (x.buf) return caches.open(CACHE).then(function(c){ return c.put(HOME, page(x)); });
    // le site a changé d'adresse (même si la réponse est arrivée après 3 s) : oublier la copie pour que la prochaine ouverture suive
    if (x.r.redirected) return caches.open(CACHE).then(function(c){ return c.delete(HOME); });
  }).catch(function(){}));
  return new Promise(function(resolve){
    var done = false;
    function finish(r){ if (!done && r){ done = true; resolve(r); } }
    var timer = setTimeout(function(){ saved().then(finish); }, WAIT_MS);
    net.then(function(x){
      if (x.buf){ clearTimeout(timer); finish(page(x)); return; }
      if (x.r.redirected){ clearTimeout(timer); finish(fetch(req)); return; }   // le site a changé d'adresse : suivre
      saved().then(function(s){ clearTimeout(timer); finish(s || x.r); });
    }, function(){
      saved().then(function(s){ clearTimeout(timer); finish(s || offlinePage()); });
    });
  });
}

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET' || req.url.indexOf(HOME) !== 0) return;
  if (req.mode === 'navigate'){
    if (isHome(req.url)) e.respondWith(home(e));
    return;
  }
  e.respondWith(caches.open(CACHE).then(function(c){ return c.match(req, {ignoreSearch: true}); }).then(function(r){
    if (r) return r;
    return fetch(req).then(function(resp){
      if (!good(resp)) return resp;
      var copy = resp.clone();
      return caches.open(CACHE).then(function(c){ return c.put(req, copy); }).then(function(){ return resp; }, function(){ return resp; });
    });
  }, function(){ return fetch(req); }));
});
