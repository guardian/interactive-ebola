#!/usr/bin/nodejs
'use strict';
var fs = require('fs');
var _ = require('underscore');
var moment = require('moment');
var csvParse = require('csv-parse');
var csvStringify = require('csv-stringify');

var newData = [];
var countryNames = [];

function transformData(row) {
    var date = row.Date;
    var countries = {};

    _.each(row, function(val, key) {
        var country;

        if(key.search(/cases?_/gi) > -1 && val !== '') {
            country = key.replace(/cases?_/gi, '');
            if (!countries.hasOwnProperty(country)) { countries[country] = {}; }
            countries[country].cases = val;
            countries[country].date = date;
        }
        
        if(key.search(/deaths?_/gi) > -1 && val !== '') {
            country = key.replace(/deaths?_/gi, '');
            if (!countries.hasOwnProperty(country)) { countries[country] = {}; }
            countries[country].deaths = val;
            countries[country].date = date;
        }
    });

    _.each(countries, function(val, key) {
        newData.push({
            country: key,
            deaths: val.deaths,
            cases: val.cases,
            date: val.date
        });
    });
}

function convertData(err, data) {
    if (err) {
        return console.log('Error parsing data', err);
    }
   

    _.each(data, transformData);
    _.each(data[0], function(val, key) {
        if (key.search(/cases?_/gi) > -1) {
            countryNames.push(key.replace(/cases?_/gi, ''));
        }
    });

    var sorted = _.sortBy(newData, function(row) {
        return moment(row.date, 'MM/DD/YYYY').unix();
    });

    csvStringify(sorted, {header: true}, function(err, output) {
        console.log(output);
    });
}

var parser = csvParse({delimeter: ',', columns: true, auto_parse: true},
                      convertData);
var stream = fs.createReadStream(__dirname+'/who_data.csv').pipe(parser);

