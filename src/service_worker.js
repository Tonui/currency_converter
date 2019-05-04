// cacheName
let currencyCache = 'v1'

// files to cache
let cacheFiles = [
    '/currency_converter/',
    '/currency_converter/index.html',
    '/currency_converter/main.js',
    '/currency_converter/manifest.json',
    '/currency_converter/idb.js',
    '/currency_converter/style.css',
    '/currency_converter/img/converter.jpg',
    '/currency_converter/img/x-512-512.png',
    '/currency_converter/img/x-192-192.png',
    '/currency_converter/bootstrap/bootstrap.min.css'
]

// install event
self.addEventListener('install', event => {
    // wait intil we open the cache and add the cache files
    event.waitUntil(
        caches.open(currencyCache).then( cache => {
            return cache.addAll(cacheFiles)
        })
    )
})

// activate event
self.addEventListener('activate', event => {
    // wait until we get all caches and delete; except the current cache
    event.waitUntil(
        caches.keys().then( currencyCaches => {
            return Promise.all( currencyCaches.map( olderCurrencyCaches => {
                if( olderCurrencyCaches !== currencyCache ){
                    return caches.delete(olderCurrencyCaches)
                }
            }))
        })
    )
})

// fetch event
self.addEventListener('fetch', event => {
    // respond with a matching request from the cache
    event.respondWith(
        caches.match(event.request).then( response => {
            if(response){
                return response;
            }
            // if we dont have the response in our cache, we cache the reponse from network
            else {
                var requestClone = event.request.clone()
                return fetch(requestClone).then( response => {
                        let responseClone = response.clone()
                        return caches.open(currencyCache).then( cache => {
                            cache.put(event.request, responseClone)
                            return response
                        })
                })
                // return fetch(event.request)
            }
            
        })
    )
})