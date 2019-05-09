'use strict';

// cacheName
var currencyCache = 'v1';

// files to cache
var cacheFiles = ['/currency_converter/', '/currency_converter/index.html', '/currency_converter/main.js', '/currency_converter/manifest.json', '/currency_converter/idb.js', '/currency_converter/style.css', '/currency_converter/img/converter.jpg', '/currency_converter/img/x-512-512.png', '/currency_converter/img/x-192-192.png', '/currency_converter/bootstrap/bootstrap.min.css'];

// install event
self.addEventListener('install', function (event) {
    // wait intil we open the cache and add the cache files
    event.waitUntil(caches.open(currencyCache).then(function (cache) {
        return cache.addAll(cacheFiles);
    }));
});

// activate event
self.addEventListener('activate', function (event) {
    // wait until we get all caches and delete; except the current cache
    event.waitUntil(caches.keys().then(function (currencyCaches) {
        return Promise.all(currencyCaches.map(function (olderCurrencyCaches) {
            if (olderCurrencyCaches !== currencyCache) {
                return caches.delete(olderCurrencyCaches);
            }
        }));
    }));
});

// fetch event
self.addEventListener('fetch', function (event) {
    // respond with a matching request from the cache
    event.respondWith(caches.match(event.request).then(function (response) {
        if (response) {
            return response;
        }
        // if we dont have the response in our cache, we cache the reponse from network
        else {
                var requestClone = event.request.clone();
                return fetch(requestClone).then(function (response) {
                    var responseClone = response.clone();
                    return caches.open(currencyCache).then(function (cache) {
                        cache.put(event.request, responseClone);
                        return response;
                    });
                });
                // return fetch(event.request)
            }
    }));
});