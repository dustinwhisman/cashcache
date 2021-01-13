const staleWhileRevalidate = (event) => {
  event.respondWith(
    caches.open('dynamic').then((cache) => {
      return cache.match(event.request).then((response) => {
        var fetchPromise = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        return response || fetchPromise;
      });
    }),
  );
};

const networkUpdatingCache = (event) => {
  event.respondWith(
    caches.open('dynamic').then((cache) => {
      return fetch(event.request).then((response) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }),
  );
};

self.addEventListener('fetch', function(event) {
  if (event.request.method === 'POST') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (/^\/api\//.test(requestUrl.pathname)) {
    networkUpdatingCache(event);
    return;
  }

  staleWhileRevalidate(event);
});
