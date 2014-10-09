define([
    'jquery',
    'backbone',
    'underscore',
    'd3',
    'topojson',
    'data/ebolaData',
    'text!templates/mapTemplate.html',
    'text!templates/circleTemplate.html',
    'd3.projections'
], function(
    $,
    Backbone,
    _,
    d3,
    topojson,
    EbolaData,
    templateHTML,
    circleTemplateHTML
) {
    'use strict';

    return Backbone.View.extend({

        className: 'mapView',

        template: _.template(templateHTML),
        circleTemplate: _.template(circleTemplateHTML),
        
        events: {
            'mousemove #timeSlider': 'readSlider',
            'change #timeSlider': 'readSlider',
            'mouseover .countryContainer': 'activeCountry',
            'mouseleave .circlesContainer': 'hideTooltip',
            'click .caseToggle button': 'switchToggle'
        },

        toggle: "deaths",

        initialize: function(options) { 
            if(options.date){
                this.date = options.date;
                this.predefinedValue = true;
            }else{
                this.predefinedValue = false;
            }
        },
        switchToggle: function(e){
            var targetToggle = $(e.currentTarget).data('name');
            if(targetToggle != this.toggle){
                $('.caseToggle button').removeClass('active');
                $(e.currentTarget).addClass('active');
                this.toggle=targetToggle;
                this.drawCircles(this.allDays[this.date]);
                this.fillMapData();
            }
        },
        updateData:function(){
            _this = this;
            this.countryData = EbolaData.getSheet('cases by date');
            this.allDays = _.uniq(_.pluck(this.countryData,'date'));

            this.createCircleData();
            this.renderSlider();
        },


        fillMapData: function(){
            var i;
            var currentDay = this.allDays[this.date];
            var dataByDay = _.groupBy(this.countryData,function(i){
                return i.date;
            })
            var currentData = dataByDay[currentDay];
            var defaultMapColor = "#f0f0f0";
            var maxNum = this.countriesByDay["max"+this.toggle]+1;
            var heatmapColors = getHeatmapColors(this.toggle);

            var countryClass, numCases;

            if (currentData != undefined) {
               $(".subunit").css("fill", defaultMapColor); // Reset colors !!
                $.each(this.countriesByDay,function(i,country){
                    countryClass = country.countrycode.toUpperCase();
                    countryValue = country[currentDay][_this.toggle];
                    $(".subunit." + countryClass)
                    .css("fill", function(d, i) { 
                        if(countryValue === 0){
                            return defaultMapColor;
                        }else{
                            // console.log(maxNum);
                            return retrieveColor( countryValue, maxNum, heatmapColors ) 
                        }
                        
                    }); 
                });
            }

            function getHeatmapColors() {
                var arr = [];

                if (this.toggle == "cases") {
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
                    arr.push("rgb(255,249,245)");
                    arr.push("rgb(255,226,208)");
                    arr.push("rgb(255,204,172)");
                    arr.push("rgb(255,172,122)");
                    arr.push("rgb(255,129,52)");
                    arr.push("rgb(228,97,18)");
                    arr.push("rgb(183,70,1)");
                    arr.push("rgb(128,49,1)");
                    arr.push("rgb(80,31,1)");
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
        createCircleData: function(){
            _this = this;
            this.countriesByDay = [];
            var allCountries = _.uniq(_.pluck(this.countryData,'country'));
            var currentDay = this.allDays[this.date];
            var dataByDay = _.groupBy(this.countryData,function(i){
                return i.date;
            })
             _.each(allCountries,function(country){
                var countryCode = _.findWhere(_this.countryData, {country:country}).countrycode;
                var countryByDay = {
                    country: country,
                    countrycode: countryCode
                }
                var previousValue;
                _.each(dataByDay,function(resultsPerDay){
                    var date = resultsPerDay[0].date;
                    var occured = false;

                    //Loop through all days
                    $.each(resultsPerDay,function(i,countryData){
                        //Check if there was a result for this country on that date
                        if (countryData.country === country){
                            countryByDay[countryData.date] = {
                                deaths: countryData.deaths,
                                cases: countryData.cases
                            }
                            occured = true;
                            previousValue = {
                                deaths: countryData.deaths,
                                cases: countryData.cases
                            }
                            //if found, stop this loop
                            return false;
                        }
                    })
                    //if each has ended without result
                    if(!occured){
                        // if there was no previous result for this country
                        if(!previousValue){
                            countryByDay[date] = {
                                deaths: 0,
                                cases: 0
                            }
                        }else{
                            countryByDay[date] = previousValue;
                        }
                    }
                })
                
                countryByDay.maxdeaths = _.max(countryByDay, function(country){return country.deaths; }).deaths;
                countryByDay.maxcases = _.max(countryByDay, function(country){return country.cases; }).cases;
                _this.countriesByDay.push(countryByDay);  
            })
            this.countriesByDay.maxdeaths = _.max(this.countriesByDay, function(country){return country.maxdeaths; }).maxdeaths;
            this.countriesByDay.maxcases = _.max(this.countriesByDay, function(country){return country.maxcases; }).maxcases;
        },

        drawCircles: function(date){
            var maxValue = "max" + this.toggle;
            var initialWidth = $(this.el).width()/5;
            $('.circlesContainer').html('');

            _.each(this.countriesByDay,function(country){
                console.log(country);
                var circleValue = country[date][_this.toggle];
                var isEmpty = false;
                var maxCircleValue = country["max"+_this.toggle];
                var circleWidth = (circleValue/_this.countriesByDay["max" + _this.toggle])*initialWidth;
                var maxCircleWidth = (maxCircleValue/_this.countriesByDay["max" + _this.toggle])*initialWidth;
                
                if(circleWidth < 0.5){
                    circleWidth = 2;
                    if(circleValue === 0){
                        isEmpty = true;
                    }
                }
                var circleHTML = _this.circleTemplate({
                    country : country.country,
                    currentToggle : _this.toggle,
                    maxWidth : maxCircleWidth,
                    circleWidth : circleWidth,
                    circleValue : circleValue,
                    isEmpty: isEmpty,
                    maxHeight: initialWidth,
                    countryCode: country.countrycode
                });
                $('.circlesContainer').append(circleHTML);
            });
        },
        renderSlider: function(){
            this.$timeSlider = $('#timeSlider');
            this.$timeSlider.attr('max',this.allDays.length -1);
            var ticksAmount = this.allDays.length-1;
            for(i=1;i<ticksAmount;i++){
                var tick = $('<div class="tick">');
                tick.css('left',function(){
                    return (100/ticksAmount)*i + "%";
                })
                $('.rangeTicks').append(tick);
            }
            if(this.predefinedValue){
                this.$timeSlider.val(this.date);
            }else{
                this.date = this.allDays.length -1;
                this.$timeSlider.val(this.date);
            }
            this.drawCircles(this.allDays[this.date]);
            this.fillMapData();
            this.showSliderInput();
        },

        readSlider: function(){ 
            if(this.$timeSlider.val() !== this.date){
                this.date = this.$timeSlider.val();
                this.drawCircles(this.allDays[this.date]);
                this.fillMapData();
                this.showSliderInput();
            }
        },
        showSliderInput:function(){
            $('#currentSliderInput span').html(this.allDays[this.date]);
        },

        activeCountry: function(e){

            var id = e.target.className, element, rect, offset, x, y, w, h, map = $("#map"), name;

            if ($(e.target).hasClass("countryContainer")) {

                name = $(e.target).data().countryname;

                id = id.substring(id.length-3, id.length).toUpperCase();

                offset = map.offset();
                w = map.width();
                h = map.height;

                element = document.getElementsByClassName(id)[0];

                rect = element.getBoundingClientRect();
                //console.log(id + "   " + offset.top + "    " + offset.left);

                //console.log(rect)

                x = rect.x - offset.left + rect.width / 2;
                y = rect.y - offset.top + rect.height / 2;

                $("#map-tooltip").css({top: y, left: x}).show();
                $("#map-tooltip-inner").html("<p>" + name + "</p>");

            }

            


        },

         hideTooltip: function(e){
            $("#map-tooltip").hide();
        },

        render: function() {
            this.$el.html(this.template());
            Backbone.on('fetch:success', this.updateData, this);
            
            return this;
        }
    });
});

