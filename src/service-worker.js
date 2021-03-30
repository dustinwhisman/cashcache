const staleWhileRevalidate = (event) => {
  try {
    event.respondWith(
      caches.open('dynamic').then((cache) => {
        console.log(`cache opened: ${event.requestUrl}`);
        return cache.match(event.request).then((response) => {
          console.log(`cache matched: ${event.requestUrl}`);
          var fetchPromise = fetch(event.request).then((networkResponse) => {
            console.log(`network fetched: ${event.requestUrl}`);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise;
        });
      }),
    );
  } catch (error) {
    console.log(`error thrown: ${event.requestUrl}`);
    console.error(error);
  }
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
