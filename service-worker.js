
const CACHE_NAME = "mova-v1";
const APP_FILES = [
  "/",
  "/index.html",
  "/manifest.json"
];

// 安装并缓存主要页面
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_FILES);
    })
  );
  self.skipWaiting();
});

// 清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 网页优先联网，断网时使用缓存
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put("/", copy);
          });
          return response;
        })
        .catch(async () => {
          return (await caches.match(request)) ||
                 (await caches.match("/")) ||
                 Response.error();
        })
    );
  }
});
