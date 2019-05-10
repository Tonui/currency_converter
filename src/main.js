var SERVER_API = '1dc818f1b1ac04792da2'

// registering service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/currency_converter/service_worker.js')
}

// IndexedDB - opening idb
let dbPromise = idb.open('Currencies', 1, upgradeDB => {
    upgradeDB.createObjectStore('currency_rates') // for storing rates
    upgradeDB.createObjectStore('currency_names', {keyPath: 'currencyId'}) // for storing names and ids objects
})

// Request JSON list of all currencies and store in idb, saved request to cache in SW
fetch(`https://free.currconv.com/api/v7/countries?apiKey=${SERVER_API}`)
.then( data => {
    var from_currency_select = document.getElementById('from_currency')
    var to_currency_select = document.getElementById('to_currency')
    var parsedData = data.json()
    var currencies = parsedData.results

    // Save currencies to idb
    dbPromise.then(db => {
        let tx = db.transaction('currency_names', 'readwrite')
        let currency_namesStore = tx.objectStore('currency_names');
        for (var currency in currencies) {
            var the_currency_obj = currencies[currency]
            var currency_id = currencies[currency].currencyId
            var currency_name = currencies[currency].currencyName
            currency_namesStore.put(the_currency_obj);
            from_currency_select.innerHTML += `<option value="${currency_id}">${currency_name}</option>`
            to_currency_select.innerHTML += `<option value="${currency_id}">${currency_name}</option>`
        }
        return tx.complete
    })
})

// currency converter
let currencyChange = () => {
    let from = document.getElementById('from_currency').value;
    let to = document.getElementById('to_currency').value;
    let query = `${from}_${to}`;

    // If person is online
    if ( navigator.onLine ) {
        fetch(`https://free.currencyconverterapi.com/api/v5/convert?q=${query}&compact=ultra&apiKey=${SERVER_API}`)
        .then( data => {
            var jsResult = data.json()
            var ans = jsResult[query]
            var amt_from = document.getElementById('from_amount').value
            document.getElementById('to_amount').value = ans * amt_from

            // Put rates into idb
            dbPromise.then(db => {
                let tx = db.transaction('currency_rates', 'readwrite');
                let currenciesStore = tx.objectStore('currency_rates');
                currenciesStore.put(ans, query);
                return tx.complete;
            })
        })
    } else {

        // If person is offline
        dbPromise.then(db => {
            let currenciesStore = db.transaction('currency_rates').objectStore('currency_rates')
            return currenciesStore.get(query).then(val => {
                let amt_frm = document.getElementById('from_amount').value;
                document.getElementById('to_amount').value = val * amt_frm;
            })
        })
    }
}