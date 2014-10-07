define([
    'jquery',
    'backbone',
    'underscore',
    'd3',
    'topojson',
    'text!templates/mapTemplate.html'
], function($,Backbone, _,d3, topojson, templateHTML) {
    'use strict';

    return Backbone.View.extend({

        className: 'mapView',

        template: _.template(templateHTML),
        
        events: {
            'click .clickContainer': 'testz'
        },

        testz: function(e){
            console.log('hey');
        },

        initialize: function(options) {
            this.date = options.date;
        },

        buildMap : function(world){
            _this = this;
            var width = $(window).innerWidth(),
                height = width*0.6;

            var svg = d3.select("#map").append("svg")
                .attr("width", width)
                .attr("height", height);

            var projection = d3.geo.mercator()
                .scale(width/6)
                .translate([width / 2, (height/2)+50]);

            var path = d3.geo.path()
                .projection(projection);

            svg.selectAll(".subUnit")
                .data(topojson.feature(world,world.objects.subunits).features)
                .enter().append("path")
                .attr("class",function(d){ return "subunit " + d.id})
                .attr("d",path)
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

