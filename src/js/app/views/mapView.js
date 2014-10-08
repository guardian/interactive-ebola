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
            this.width = $(window).innerWidth();
            this.height = this.width*0.6;

            var svg = d3.select("#map").append("svg")
                .attr("width", this.width)
                .attr("height", this.height);

            //var projection = d3.geo.mercator()
                //.scale(this.width/6)
                //.translate([this.width / 2, (this.height/2)+50]);

            var projection = d3.geo.robinson()
                .scale(this.width/6)
                .translate([this.width / 2, (this.height/2)+50]);


            var path = d3.geo.path()
                .projection(projection);

            svg.selectAll(".subUnit")
                .data(topojson.feature(world,world.objects.subunits).features)
                .enter().append("path")
                .attr("class",function(d){ return "subunit " + d.id})
                .attr("d",path)

            this.fillData(svg,projection, "cases"); // "cases" or "deaths"
        },

        fillData: function(svg,projection,key){
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

            var quantize = d3.scale.quantize()
                .domain([0, maxNum])
                .range(d3.range(heatmapColors.length).map(function(i) { return heatmapColors[i]; }));

            var countryClass, numCases;

            if (currentData != undefined) {

                svg.selectAll(".subunit")
                .style("fill", "#ccc" ); // Reset colors !!

            for ( i = 0; i < currentData.length; i++ ) {

                countryClass = currentData[i].countrycode.toUpperCase();
                num = currentData[i][key];
                svg.select(".subunit." + countryClass)
                .style("fill", function(d, i) { return quantize(num) }); 

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

        },
        updateMap: function(){

        },

        render: function() {
            this.$el.html(this.template());
            
            _this = this;
            d3.json("assets/js/world.json", function(error, world) {
              if (error) return console.error(error);
              _this.buildMap(world);
            });
            
            return this;
        }
    });
});

