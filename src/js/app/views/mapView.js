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
            this.width = $(window).innerWidth();
            this.height = this.width*0.6;

            var svg = d3.select("#map").append("svg")
                .attr("width", this.width)
                .attr("height", this.height);

            var projection = d3.geo.mercator()
                .scale(this.width/6)
                .translate([this.width / 2, (this.height/2)+50]);

            var path = d3.geo.path()
                .projection(projection);

            svg.selectAll(".subUnit")
                .data(topojson.feature(world,world.objects.subunits).features)
                .enter().append("path")
                .attr("class",function(d){ return "subunit " + d.id})
                .attr("d",path)

            this.fillData(svg,projection);
        },

        fillData: function(svg,projection){
            var countryData = EbolaData.getSheet('cases by date');

            var nodes = d3.range(countryData.length)
                .map(function(d, i) { 
                    return {
                        radius: countryData[i].cases/20, 
                        lat: countryData[i].lat, 
                        lon: countryData[i].lon, 
                        x: projection([countryData[i].lon, countryData[i].lat])[0], 
                        y: projection([countryData[i].lon, countryData[i].lat])[1], 
                        initX: projection([countryData[i].lon, countryData[i].lat])[0], 
                        initY: projection([countryData[i].lon, countryData[i].lat])[1]
                    };
                }),
             
            color = d3.scale.category10();

            var circle = svg.selectAll("circle.node")
                .data(nodes)
                .enter().append("svg:circle")
                .attr("class", "node")
                .attr("r", function(d) { return d.radius; })
                .attr("cx", function(d) {
                    return projection([d.lon, d.lat])[0];
                })
                .attr("cy", function(d) {
                    return projection([d.lon, d.lat])[1];
                })
                .style("fill", function(d, i) { 
                    return "#005689"; 
                });


            var force = d3.layout.force()
                .gravity(0)
                .charge(function(d, i) { 
                    return -Math.pow(d.radius, 2.0) / 80000; 
                })
                .nodes(nodes)
                .friction(0.5)
                .size([this.width, this.height]);

            force.start();

            var link = svg.selectAll("line.link")
                .data(nodes);

            link.enter().insert("svg:line")
                .attr("class", "link")
                .attr("x1", function(d) { return d.initX; })
                .attr("y1", function(d) { return d.initY; })
                .attr("x2", function(d) {
                    var dx = d.x - d.initX;
                    var dy = d.y - d.initY;
                    var dist = getDistance(dx, dy);
                    var ratio = d.radius / dist;
                    return d.x;
                })
                .attr("y2", function(d) {
                    var dx = d.x - d.initX;
                    var dy = d.y - d.initY;
                    var dist = getDistance(dx, dy);
                    var ratio = d.radius / dist;
                    return d.y; 
                })
            link.exit().remove();

            svg.selectAll("circle.line-anchor")
                .data(nodes)
                .enter().append("svg:circle")
                .attr("class", "line-anchor")
                .attr("r", function(d) { return 2.2; })
                .attr("cx", function(d) {
                    return d.initX;
                })
                .attr("cy", function(d) {
                    return d.initY;
                })

            force.on("tick", function(e) {
                var q = d3.geom.quadtree(nodes),
                i = 0,
                n = nodes.length;

                while (++i < n) {
                    q.visit(collide(nodes[i]));
                }

                svg.selectAll("circle.node")
                    .attr("cx", function(d) { return d.x; })
                    .attr("cy", function(d) { return d.y; });

                link.attr("x1", function(d) { 
                    var dx = d.x - d.initX;
                       var dy = d.y - d.initY;
                       var dist = getDistance(dx, dy);
                       if (dist > d.radius) {
                         return d.initX; 
                       } else {
                         return -1;
                       }
                       })
                     .attr("y1", function(d) { 
                       var dx = d.x - d.initX;
                       var dy = d.y - d.initY;
                       var dist = getDistance(dx, dy);
                       if (dist > d.radius) {
                         return d.initY; 
                       } else {
                         return -1;
                       } })
                     .attr("x2", function(d) { 
                       var dx = d.x - d.initX;
                       var dy = d.y - d.initY;
                       var dist = getDistance(dx, dy);
                       if (dist > d.radius) {
                       var ratio = 1-(d.radius / dist);
                       return d.initX + (dx * ratio);
                       } else {
                         return -1;
                       }
                        })
                     .attr("y2", function(d) { 
                       var dx = d.x - d.initX;
                       var dy = d.y - d.initY;
                       var dist = getDistance(dx, dy);
                       if (dist > d.radius) {
                       var ratio = 1 - (d.radius / dist);
                       return d.initY + (dy * ratio); 
                       } else {
                         return -1;
                       }
                });

                svg.selectAll("circle.line-anchor")
                    .style("opacity", function(d, i) { 
                        var dx = d.x - d.initX;
                        var dy = d.y - d.initY;
                        var dist = getDistance(dx, dy);
                        if (dist > d.radius) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
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

