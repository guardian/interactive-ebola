define([
    'jquery',
    'backbone',
    'underscore',
    'd3',
    'topojson',
    'data/ebolaData',
    'text!templates/mapTemplate.html'
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

            var myCountries= [];

            myCountries.push({name: "Sudan", lat: 12.858645, lon: 30.217636, size: 50});
            myCountries.push({name: "Congo", lat: -0.228021, lon: 15.827659, size: 60});
            myCountries.push({name: "Gabon", lat: -0.803689, lon: 11.609444, size: 100});
            myCountries.push({name: "South Africa", lat: -30.559482, lon: 22.937506, size: 90});
            myCountries.push({name: "Uganda", lat: 1.373333, lon: 32.290275, size: 700});
            myCountries.push({name: "Guinea", lat: 9.945587, lon: -9.696645, size: 800});
            myCountries.push({name: "Liberia", lat: 6.428055, lon: -9.429499, size: 1000});
            myCountries.push({name: "Sierra Leone", lat: 8.460555, lon: -11.779889, size: 2000});
            myCountries.push({name: "Nigeria", lat: 9.081999, lon: 8.675277, size: 60});
            myCountries.push({name: "Senegal", lat: 14.497401, lon: -14.452362, size: 80});
            myCountries.push({name: "UK", lat: 55.378051, lon: -3.435973, size: 2});
            myCountries.push({name: "Spain", lat: 40.463667, lon: -3.749220, size: 5});

            var nodes = d3.range(myCountries.length)
                .map(function(d, i) { 
                    console.log(d); 
                    return {radius: myCountries[i].size / 50, lat: myCountries[i].lat, lon: myCountries[i].lon, x: projection([myCountries[i].lon, myCountries[i].lat])[0], y: projection([myCountries[i].lon, myCountries[i].lat])[1], initX: projection([myCountries[i].lon, myCountries[i].lat])[0], initY: projection([myCountries[i].lon, myCountries[i].lat])[1]}; }),
            
            color = d3.scale.category10();

            svg.selectAll("circle")
                .data(nodes.slice(1))
              .enter().append("svg:circle")
                .attr("r", function(d) { return d.radius - 2; })
                .attr("cx", function(d) {

                            return projection([d.lon, d.lat])[0];
                    })
                    .attr("cy", function(d) {
                            return projection([d.lon, d.lat])[1];
                    })
                .style("fill", function(d, i) { return "#ff0000"; });//color(i % 3); });

            var force = d3.layout.force()
                .gravity(0) // 0.05
                .charge(function(d, i) { console.log(d); return -Math.pow(d.radius, 2.0) / 80000; })//i ? 0 : -0.0000000000000000001; })
                .nodes(nodes)
                .friction(0.4)
                .size([width, height]);

            var root = nodes[0];
            root.radius = 0;
            root.fixed = true;

            force.start();

            var link = svg.selectAll("line.link")
                  .data(nodes.slice(1));

              //Enter any new links.
              link.enter().insert("svg:line")
                  .attr("class", "link")
                  .attr("x1", function(d) { return d.initX; })
                  .attr("y1", function(d) { return d.initY; })
                  .attr("x2", function(d) {
                    var dx = d.x - d.initX;
                    var dy = d.y - d.initY;
                    var dist = getDistance(dx, dy);
                    var ratio = d.radius / dist;
                    return d.x; })
                    //return d.initX + (dx * ratio); })
                  .attr("y2", function(d) {
                    var dx = d.x - d.initX;
                    var dy = d.y - d.initY;
                    var dist = getDistance(dx, dy);
                    var ratio = d.radius / dist;
                    //return d.initY + (dy * ratio); });
                    return d.y; })
              // Exit any old links.
              link.exit().remove();

            force.on("tick", function(e) {
              var q = d3.geom.quadtree(nodes),
                  i = 0,
                  n = nodes.length;

              while (++i < n) {
                q.visit(collide(nodes[i]));
              }

              svg.selectAll("circle")
                  .attr("cx", function(d) { return d.x; })
                  .attr("cy", function(d) { return d.y; });

                  // Update the links…  

              link.attr("x1", function(d) { return d.initX; })
                  .attr("y1", function(d) { return d.initY; })
                  .attr("x2", function(d) {  var dx = d.x - d.initX;
                    var dy = d.y - d.initY;
                    var dist = getDistance(dx, dy);
                    var ratio = d.radius / dist;
                    //return d.initX + (dx * ratio); })
                   return d.x; })
                  .attr("y2", function(d) { var dx = d.x - d.initX;
                    var dy = d.y - d.initY;
                    var dist = getDistance(dx, dy);
                    var ratio = d.radius / dist;
                    //return d.initY + (dy * ratio); });
                   return d.y; })


            });

                function getDistance(dx, dy) {
      return Math.sqrt ( dx * dx + dy * dy );
    }

    function collide(node) {
var r = node.radius + 16,
nx1 = node.x - r,
nx2 = node.x + r,
ny1 = node.y - r,
ny2 = node.y + r;
return function(quad, x1, y1, x2, y2) {
if (quad.point && (quad.point !== node)) {
var x = node.x - quad.point.x,
y = node.y - quad.point.y,
l = Math.sqrt(x * x + y * y),
r = node.radius + quad.point.radius;
if (l < r) {
l = (l - r) / l * .5;
node.x -= x *= l;
node.y -= y *= l;
quad.point.x += x;
quad.point.y += y;
}
}
return x1 > nx2
|| x2 < nx1
|| y1 > ny2
|| y2 < ny1;
};
}
        },

        fillData: function(){

            var myCountries= [];

            myCountries.push({name: "Sudan", lat: 12.858645, lon: 30.217636, size: 50});
            myCountries.push({name: "Congo", lat: -0.228021, lon: 15.827659, size: 60});
            myCountries.push({name: "Gabon", lat: -0.803689, lon: 11.609444, size: 100});
            myCountries.push({name: "South Africa", lat: -30.559482, lon: 22.937506, size: 90});
            myCountries.push({name: "Uganda", lat: 1.373333, lon: 32.290275, size: 700});
            myCountries.push({name: "Guinea", lat: 9.945587, lon: -9.696645, size: 800});
            myCountries.push({name: "Liberia", lat: 6.428055, lon: -9.429499, size: 1000});
            myCountries.push({name: "Sierra Leone", lat: 8.460555, lon: -11.779889, size: 2000});
            myCountries.push({name: "Nigeria", lat: 9.081999, lon: 8.675277, size: 60});
            myCountries.push({name: "Senegal", lat: 14.497401, lon: -14.452362, size: 80});
            myCountries.push({name: "UK", lat: 55.378051, lon: -3.435973, size: 2});
            myCountries.push({name: "Spain", lat: 40.463667, lon: -3.749220, size: 5});

            var nodes = d3.range(myCountries.length)
                .map(function(d, i) { 
                    console.log(d); 
                    return {radius: myCountries[i].size / 50, lat: myCountries[i].lat, lon: myCountries[i].lon, x: projection([myCountries[i].lon, myCountries[i].lat])[0], y: projection([myCountries[i].lon, myCountries[i].lat])[1], initX: projection([myCountries[i].lon, myCountries[i].lat])[0], initY: projection([myCountries[i].lon, myCountries[i].lat])[1]}; }),
            
            color = d3.scale.category10();

            svg.selectAll("circle")
                .data(nodes.slice(1))
              .enter().append("svg:circle")
                .attr("r", function(d) { return d.radius - 2; })
                .attr("cx", function(d) {

                            return projection([d.lon, d.lat])[0];
                    })
                    .attr("cy", function(d) {
                            return projection([d.lon, d.lat])[1];
                    })
                .style("fill", function(d, i) { return "#ff0000"; });//color(i % 3); });

            var force = d3.layout.force()
                .gravity(0) // 0.05
                .charge(function(d, i) { console.log(d); return -Math.pow(d.radius, 2.0) / 80000; })//i ? 0 : -0.0000000000000000001; })
                .nodes(nodes)
                .friction(0.4)
                .size([width, height]);

            var root = nodes[0];
            root.radius = 0;
            root.fixed = true;

            force.start();

            var link = svg.selectAll("line.link")
                  .data(nodes.slice(1));

              //Enter any new links.
              link.enter().insert("svg:line")
                  .attr("class", "link")
                  .attr("x1", function(d) { return d.initX; })
                  .attr("y1", function(d) { return d.initY; })
                  .attr("x2", function(d) {
                    var dx = d.x - d.initX;
                    var dy = d.y - d.initY;
                    var dist = getDistance(dx, dy);
                    var ratio = d.radius / dist;
                    return d.x; })
                    //return d.initX + (dx * ratio); })
                  .attr("y2", function(d) {
                    var dx = d.x - d.initX;
                    var dy = d.y - d.initY;
                    var dist = getDistance(dx, dy);
                    var ratio = d.radius / dist;
                    //return d.initY + (dy * ratio); });
                    return d.y; })
              // Exit any old links.
              link.exit().remove();

            force.on("tick", function(e) {
              var q = d3.geom.quadtree(nodes),
                  i = 0,
                  n = nodes.length;

              while (++i < n) {
                q.visit(collide(nodes[i]));
              }

              svg.selectAll("circle")
                  .attr("cx", function(d) { return d.x; })
                  .attr("cy", function(d) { return d.y; });

                  // Update the links…  

              link.attr("x1", function(d) { return d.initX; })
                  .attr("y1", function(d) { return d.initY; })
                  .attr("x2", function(d) {  var dx = d.x - d.initX;
                    var dy = d.y - d.initY;
                    var dist = getDistance(dx, dy);
                    var ratio = d.radius / dist;
                    //return d.initX + (dx * ratio); })
                   return d.x; })
                  .attr("y2", function(d) { var dx = d.x - d.initX;
                    var dy = d.y - d.initY;
                    var dist = getDistance(dx, dy);
                    var ratio = d.radius / dist;
                    //return d.initY + (dy * ratio); });
                   return d.y; })


            });


            
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

