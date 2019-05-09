var SERVER_API = '1dc818f1b1ac04792da2'

// registering service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/currency_converter/service_worker.js')
}

// IndexedDB - opening idb
let dbPromise = idb.open('Currencies', 2, upgradeDB => {
    upgradeDB.createObjectStore('currency_rates') // for storing rates
    upgradeDB.createObjectStore('currency_names', {keyPath: 'currencyId'}) // for storing names and ids objects
})

// Request JSON list of all currencies and store in idb
var xml_request = new XMLHttpRequest();
// open(method, url, async) - open connection
xml_request.open('GET', `https://free.currconv.com/api/v7/countries?apiKey=${SERVER_API}`, true);
xml_request.send() // Send the request
// On ready state change is property to be fired on every change of state
/**
 * readyState() - 0,1,2,3,4
 * status() -404, 403, 500
 */
xml_request.onreadystatechange = function () {
    // Currency selected
    var from_currency_select = document.getElementById('from_currency')
    var to_currency_select = document.getElementById('to_currency')
    if (xml_request.readyState == 4 && xml_request.status == 200) {
        var data = xml_request.responseText;
        var parsed_data = JSON.parse(data)
        var currencies = parsed_data.results
        // Save currencies to idb
        dbPromise.then(db => {
            let tx = db.transaction('currency_names', 'readwrite')
            let currency_namesStore = tx.objectStore('currency_names');
            for (var currency in currencies) {
                var the_currency_obj = currencies[currency]
                var currency_id = currencies[currency].id
                var currency_name = currencies[currency].currencyName
                currency_namesStore.put(the_currency_obj);
                // from_currency_select.innerHTML += `<option value="${currency_id}">${currency_name}</option>`
                // to_currency_select.innerHTML += `<option value="${currency_id}">${currency_name}</option>`
            }
            return tx.complete
        })
        dbPromise.then(db => {
            return db.transaction('currency_names').objectStore('currency_names').getAll().then((allCurrencies) => {
                for (var each in allCurrencies) {
                    from_currency_select.innerHTML += `<option value="${allCurrencies[each].currencyId}">${allCurrencies[each].currencyName}</option>`
                    to_currency_select.innerHTML += `<option value="${allCurrencies[each].currencyId}">${allCurrencies[each].currencyName}</option>`
                }
            })
        })
    }
    // Else if offline
    else if (xml_request.readyState !== 2 && xml_request.readyState !== 3) {
        dbPromise.then(db => {
            return db.transaction('currency_names').objectStore('currency_names').getAll().then((allCurrencies) => {
                for (var each in allCurrencies) {
                    from_currency_select.innerHTML += `<option value="${allCurrencies[each].currencyId}">${allCurrencies[each].currencyName}</option>`
                    to_currency_select.innerHTML += `<option value="${allCurrencies[each].currencyId}">${allCurrencies[each].currencyName}</option>`
                }
            })
        })
    }
}

// currency converter
let currencyChange = () => {
    let from = document.getElementById('from_currency').value;
    let to = document.getElementById('to_currency').value;
    let query = `${from}_${to}`;
    let xmlhttp = new XMLHttpRequest();
    let url = `https://free.currencyconverterapi.com/api/v5/convert?q=${query}&compact=ultra&apiKey=${SERVER_API}`;
    xmlhttp.open('GET', url, true);
    xmlhttp.send();
    xmlhttp.onreadystatechange = () => {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            let result = xmlhttp.responseText;
            let jsResult = JSON.parse(result);
            let ans = jsResult[query];
            let amt_from = document.getElementById('from_amount').value;
            document.getElementById('to_amount').value = ans * amt_from;

            dbPromise.then(db => {
                let tx = db.transaction('currency_rates', 'readwrite');
                let currenciesStore = tx.objectStore('currency_rates');
                currenciesStore.put(ans, query);
                return tx.complete;
            })
        } else if (xmlhttp.readyState !== 2 && xmlhttp.readyState !== 3) {
            dbPromise.then(db => {
                let currenciesStore = db.transaction('currency_rates').objectStore('currency_rates')
                return currenciesStore.get(query).then(val => {
                    let amt_frm = document.getElementById('from_amount').value;
                    document.getElementById('to_amount').value = val * amt_frm;
                })
            })
        }
    }
}