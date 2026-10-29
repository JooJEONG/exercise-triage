/* Exercice de triage (EMR) – garde la page sur l'appareil pour l'ouvrir aussi sans internet.
   Page d'accueil : le réseau d'abord ; sans réseau, ou si rien n'arrive en 3 secondes, la copie gardée.
   La copie est remplacée dès que le réseau donne la page. Manifeste et icônes : la copie gardée d'abord.
   Si le manifeste ou les icônes changent, changer le nom CACHE (v1 → v2). */
var CACHE = 'exercice-triage-v1';
var HOME = self.registration.scope;
var FILES = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
var WAIT_MS = 3000;

function pathOf(u){ var x = new URL(u); return x.origin + x.pathname; }
function isHome(u){ var p = pathOf(u); return p === HOME || p === HOME + 'index.html'; }
function good(r){ return !!r && r.ok && r.type === 'basic' && !r.redirected; }
function saved(){ return caches.open(CACHE).then(function(c){ return c.match(HOME); }).catch(function(){ return undefined; }); }
function offlinePage(){
  return new Response('<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Hors connexion</title></head>' +
    '<body style="font:16px/1.5 -apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:24px;color:#3a4754">' +
    '<p><b>Pas de connexion internet.</b> L’exercice n’est pas encore gardé sur cet appareil : ouvrez le lien une fois avec internet.</p>' +
    '<p><b>No internet connection.</b> The practice is not saved on this device yet: open the link once with internet.</p></body></html>',
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
    return Promise.all(keys.filter(function(k){ return k.indexOf('exercice-triage-') === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

function home(e){
  var req = e.request;
  var net = fetch(new Request(HOME, {cache: 'no-cache', credentials: 'same-origin'}));
  // garder la copie à jour, même quand la copie gardée a déjà été montrée
  e.waitUntil(net.then(function(r){
    if (!good(r)) return;
    var copy = r.clone();
    return caches.open(CACHE).then(function(c){ return c.put(HOME, copy); });
  }).catch(function(){}));
  return new Promise(function(resolve){
    var done = false;
    function finish(r){ if (!done && r){ done = true; resolve(r); } }
    var timer = setTimeout(function(){ saved().then(finish); }, WAIT_MS);
    net.then(function(r){
      if (good(r)){ clearTimeout(timer); finish(r); return; }
      saved().then(function(s){ clearTimeout(timer); finish(s || (r.redirected ? fetch(req) : r)); });
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
  e.respondWith(caches.match(req, {ignoreSearch: true}).then(function(r){
    if (r) return r;
    return fetch(req).then(function(resp){
      if (!good(resp)) return resp;
      var copy = resp.clone();
      return caches.open(CACHE).then(function(c){ return c.put(req, copy); }).then(function(){ return resp; }, function(){ return resp; });
    });
  }, function(){ return fetch(req); }));
});
