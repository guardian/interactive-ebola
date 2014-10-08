define([
    'jquery',
    'backbone',
    'underscore',
    'd3',
    'topojson',
    'data/ebolaData',
    'text!templates/mapTemplate.html',
    'd3.projections'
], function(
    $,
    Backbone,
    _,
    d3,
    topojson,
    EbolaData,
    templateHTML
) {
    'use strict';

    return Backbone.View.extend({

        className: 'mapView',

        template: _.template(templateHTML),
        
        events: {
        },

        initialize: function(options) {
            this.date = options.date;
            Backbone.on('fetch:success', this.render, this);
        },

        buildMap : function(world){
            _this = this;

            this.fillData("cases"); // "cases" or "deaths"
        },

        fillData: function(key){



            var i;
            var countryData = EbolaData.getSheet('cases by date');
            var allDays = _.uniq(_.pluck(countryData,'date'));
            var currentDay = allDays[this.date];
            var dataByDay = _.groupBy(countryData,function(i){
                return i.date;
            })

            var currentData = dataByDay[currentDay];
            var maxNum = 5000;
            var heatmapColors = getHeatmapColors(key);

            var countryClass, numCases;
            console.log(currentData);
            if (currentData != undefined) {

               $(".subunit").css("fill", "#ccc"); // Reset colors !!

            for ( i = 0; i < currentData.length; i++ ) {

                countryClass = currentData[i].countrycode.toUpperCase();
                console.log(countryClass)
                num = currentData[i][key];
                $(".subunit." + countryClass)
                .css("fill", function(d, i) { return retrieveColor( num, maxNum, heatmapColors ) }); 

            }

        }

            function getHeatmapColors(key) {

                var arr = [];

                if (key == "cases") {

                    arr.push("rgb(247,251,255)");
                    arr.push("rgb(222,235,247)");
                    arr.push("rgb(198,219,239)");
                    arr.push("rgb(158,202,225)");
                    arr.push("rgb(107,174,214)");
                    arr.push("rgb(66,146,198)");
                    arr.push("rgb(33,113,181)");
                    arr.push("rgb(8,81,156)");
                    arr.push("rgb(8,48,107)");

                } else { // deaths

                    arr.push("rgb(255,248,247)");
                    arr.push("rgb(247,224,222)");
                    arr.push("rgb(239,202,198)");
                    arr.push("rgb(225,158,161)");
                    arr.push("rgb(214,107,108)");
                    arr.push("rgb(198,67,66)");
                    arr.push("rgb(181,44,33)");
                    arr.push("rgb(156,26,8)");
                    arr.push("rgb(107,29,8)");

                }

                return arr;
            }

            function retrieveColor( num, maxNum, colors ) {

                var colorsLength = colors.length;
                var bandSize = maxNum / colorsLength;
                var colorIndex = Math.floor(num / bandSize)

                return colors[colorIndex];

            }

        },
        updateMap: function(){

        },

        render: function() {
            this.$el.html(this.template());
            
            _this = this;
              _this.buildMap();
            
            return this;
        }
    });
});

