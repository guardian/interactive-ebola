define([
    'backbone',
    'jquery'
], function(
    Backbone,
    $
) {
    'use strict';

    var URL = 'http://interactive.guim.co.uk/spreadsheetdata/1CZkiYvJHxF-zbk7MLYMTiepNMlJbsTwz_jbIiD14T3U.json';
    var sheets;

    function success(data) {
        sheets = data.sheets;
        Backbone.trigger('fetch:success', sheets);
    }

    function error(err) {
        console.err('Error fetching data', err);
        Backbone.trigger('fetch:error', err);
    }

    function getSheets() {
        return sheets;
    }

    function getSheet(sheetName) {
        if (!sheets || !sheetName || !sheets.hasOwnProperty(sheetName)) {
            return false;
        }

        return sheets[sheetName];
    }

    function fetch() {
        $.getJSON(URL, success, error);
    }

    return {
        fetch: fetch,
        getSheets: getSheets,
        getSheet: getSheet
    };
});

