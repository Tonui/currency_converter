'use strict';

var SERVER_API = '1dc818f1b1ac04792da2';

// registering service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/currency_converter/service_worker.js');
}

// IndexedDB - opening idb
var dbPromise = idb.open('Currencies', 1, function (upgradeDB) {
    upgradeDB.createObjectStore('currency_rates'); // for storing rates
    upgradeDB.createObjectStore('currency_names', { keyPath: 'currencyId' }); // for storing names and ids objects
});

// Request JSON list of all currencies and store in idb, saved request to cache in SW
fetch('https://free.currconv.com/api/v7/countries?apiKey=' + SERVER_API).then(function (res) {
    return res.json();
}).then(function (data) {

    var currencies = data.results;

    // Save currencies to idb
    dbPromise.then(function (db) {
        var tx = db.transaction('currency_names', 'readwrite');
        var currency_namesStore = tx.objectStore('currency_names');
        console.log('Checkpoint: idbThen');
        for (var currency in currencies) {
            var the_currency_obj = currencies[currency];
            currency_namesStore.put(the_currency_obj);
        }
        return tx.complete;
    });
}).then(function () {
    // Retrieve from idb
    dbPromise.then(function (db) {
        var tx = db.transaction('currency_names');
        var currencyNamesRetrieve = tx.objectStore('currency_names');
        return currencyNamesRetrieve.getAll();
    }).then(function (theCurrencies) {
        var from_currency_select = document.getElementById('from_currency');
        var to_currency_select = document.getElementById('to_currency');
        for (var index in theCurrencies) {
            var itsID = theCurrencies[index].currencyId;
            var itsName = theCurrencies[index].currencyName;
            from_currency_select.innerHTML += '<option value="' + itsID + '">' + itsName + '</option>';
            to_currency_select.innerHTML += '<option value="' + itsID + '">' + itsName + '</option>';
        }
    });
});

// currency converter
var currencyChange = function currencyChange() {
    var from = document.getElementById('from_currency').value;
    var to = document.getElementById('to_currency').value;
    var query = from + '_' + to;

    // If person is online
    if (navigator.onLine) {
        fetch('https://free.currencyconverterapi.com/api/v5/convert?q=' + query + '&compact=ultra&apiKey=' + SERVER_API).then(function (res) {
            return res.json();
        }).then(function (data) {
            var jsResult = data;
            var ans = jsResult[query];
            var amt_from = document.getElementById('from_amount').value;
            document.getElementById('to_amount').value = ans * amt_from;

            // Put rates into idb
            dbPromise.then(function (db) {
                var tx = db.transaction('currency_rates', 'readwrite');
                var currenciesStore = tx.objectStore('currency_rates');
                currenciesStore.put(ans, query);
                return tx.complete;
            });
        });
    } else {
        // If person is offline
        dbPromise.then(function (db) {
            var currenciesStore = db.transaction('currency_rates').objectStore('currency_rates');
            return currenciesStore.get(query).then(function (val) {
                var amt_frm = document.getElementById('from_amount').value;
                document.getElementById('to_amount').value = val * amt_frm;
            });
        });
    }
};