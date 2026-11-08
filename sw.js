// Service worker: tiene da parte i file della pagina, così il metronomo si
// apre anche senza rete. web/build.sh mette al posto di 646192302dcd84ab un'impronta
// dei file compilati: ogni versione nuova cambia questo file, il browser la
// scarica in sottofondo e la usa dall'apertura successiva, senza avvisi.
const CACHE = "metronomo-646192302dcd84ab";

// Il mixer dell'AudioWorklet è incluso nel wasm e caricato da un Blob, quindi
// questi sono tutti i file che la pagina chiede.
const FILE = [
  "./",
  "index.html",
  "metronomo.js",
  "metronomo_bg.wasm",
  "manifest.webmanifest",
  "metronomo.svg",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      // "reload" scavalca la cache HTTP del browser: senza, la versione
      // nuova potrebbe finire salvata coi file di quella vecchia.
      .then((cache) => cache.addAll(FILE.map((f) => new Request(f, { cache: "reload" }))))
      // Subentra subito alla versione vecchia: la pagina già aperta ha caricato
      // tutto all'avvio e continua a funzionare.
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomi) =>
        Promise.all(
          nomi
            .filter((nome) => nome.startsWith("metronomo-") && nome !== CACHE)
            .map((nome) => caches.delete(nome)),
        ),
      ),
  );
});

// Prima la copia salvata, poi la rete per tutto il resto (le licenze).
self.addEventListener("fetch", (evento) => {
  if (evento.request.method !== "GET") return;
  evento.respondWith(
    caches
      .open(CACHE)
      .then((cache) => cache.match(evento.request, { ignoreSearch: true }))
      .then((copia) => copia || fetch(evento.request)),
  );
});
