define([
    'jquery',
    'backbone',
    'underscore',
    'nouislider',
    'numeral',
    'data/ebolaData',
    'text!templates/mapTemplate.html',
    'text!templates/circleTemplate.html',
], function(
    $,
    Backbone,
    _,
    noUiSlider,
    numeral,
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
            'mouseleave .circlesContainer': 'hideTooltip',
            'click .caseToggle button': 'switchToggle',
            'click .playButton': 'autoPlayData'
        },

        toggle: "deaths",

        colors:{
            "deaths": "#E3672A",
            "cases": "#52c6d8"
        },

        initialize: function(options) {
            if(options.date){
                this.date = options.date;
                this.predefinedValue = true;
            }else{
                this.predefinedValue = false;
            }
            
            Backbone.on('fetch:success', this.render, this);

            // Resize
            var limtedResize = _.debounce(this.render, 200);
            $(window).resize(_.bind(limtedResize, this));
        },

        switchToggle: function(e){
            var targetToggle = $(e.currentTarget).data('name');
            if(targetToggle != this.toggle){
                $('.caseToggle button').removeClass('active');
                $(e.currentTarget).addClass('active');
                this.toggle=targetToggle;
                this.drawCircles(this.allDays[this.date]);
                this.fillMapData();
                this.showSliderInput();
            }
        },
        checkToggle:function(){
            var targetToggle = $('.toggleButton .active').data('name');
            if(targetToggle != this.toggle){
                $('.toggleButton button').removeClass('active');
                $('.toggleButton button[data-name="' + this.toggle + '"').addClass('active');
            }
        },

        updateData:function(){
            _this = this;
            this.countryData = EbolaData.getSheet('cases by date');
            this.offsetData = EbolaData.getSheet('manual offset overrides');
            this.allDays = _.uniq(_.pluck(this.countryData,'date'));
            this.allCountries = _.uniq(_.pluck(this.countryData,'country'));

            this.createCircleData();
            this.renderSlider();
            this.checkToggle();
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

            maxNum = (Math.ceil(maxNum / 1000)) * 1000;
            //var roundMaxNum = (Math.floor(maxNum / 1000)) * 1000;
            var heatmapColors = this.getHeatmapColors();

            var countryClass, numCases;

            if (currentData != undefined) {
               $(".subunit").css("fill", defaultMapColor); // Reset colors !!
                $.each(this.countriesByDay,function(i,country){
                    countryClass = country.countrycode.toUpperCase();
                    countryValue = country[currentDay][_this.toggle];
                    $(".subunit." + countryClass).css("fill", 
                        function(d, i) {
                            if(countryValue === 0){
                                return defaultMapColor;
                            }else{
                                return _this.retrieveColor( countryValue, maxNum, heatmapColors )
                            }
                        });
                    
                });
            }

            buildMapKey(heatmapColors, maxNum);

            function buildMapKey(colors, maxNum) {
                var i;
                var colorBands = "";
                bandWidth = 100 / colors.length;

                for (i = 0; i < colors.length; i++) {
                    var colorBand = "<div class='key-band' style='background: " + colors[i] + "; width: " + bandWidth + "%'></div>";
                    colorBands += colorBand;
                }

                // $("#map-key h3").html('Number of ' + _this.toggle);
                $("#map-key .color-bands").html(colorBands);
                $("#map-key .key-max-num").html(maxNum);
            }
        },

        retrieveColor:function(num, maxNum, colors) {
            var colorsLength = colors.length;
            var bandSize = maxNum / colorsLength;
            var colorIndex = Math.floor(num / bandSize);
            return colors[colorIndex];
        },

        getHeatmapColors:function() {
            var arr = [];
            if (_this.toggle == "cases") {
                arr = ["rgb(195,247,255)", "rgb(112,223,239)", "rgb(79,190,206)", "rgb(17,128,144)", "rgb(1,94,108)"];
            } else { // deaths
                arr = ["rgb(255,226,208)", "rgb(255,172,122)", "rgb(255,129,52)", "rgb(228,97,18)", "rgb(128,49,1)"]
            }
            //"rgb(243,253,255)", "rgb(255,249,245)",
            return arr;
        },

        createCircleData: function(){
            _this = this;
            this.countriesByDay = [];
            var lastDay = this.allDays[this.allDays.length-1];
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
            });
            
            this.countriesByDay = _.sortBy(_this.countriesByDay, function(num){ return num[lastDay][_this.toggle] }).reverse();
            this.countriesByDay.maxdeaths = _.max(this.countriesByDay, function(country){return country.maxdeaths; }).maxdeaths;
            this.countriesByDay.maxcases = _.max(this.countriesByDay, function(country){return country.maxcases; }).maxcases;
            
        },

        drawCircles: function(date){
            var maxValue = "max" + this.toggle;
            var allCountries = this.allCountries.length;
            var containerWidth = $(this.el).width();
            var countryColumns = 3;
            if(allCountries<=6){
                if(containerWidth>480){
                    countryColumns = 6;
                }else{
                    countryColumns=6;
                }
            }else if(allCountries<=8){
                if(containerWidth>480){
                   countryColumns = allCountries;
                }else{
                   countryColumns=allCountries;
                }
            }else if(allCountries>8){
                if(containerWidth>640){
                   countryColumns = 10;
                }else if(containerWidth>480){
                    countryColumns = 8;
                }else{
                    countryColumns=7;
                }
            }

            var initialWidth = (containerWidth/countryColumns)-2;
            
            // var countriesByDaySorted = _.sortBy(_this.countriesByDay, function(num){ return num[lastDay][_this.toggle] });
            $('.circlesContainer').html('');
            _.each(_this.countriesByDay,function(country){
                var circleValue = country[date][_this.toggle];
                var isEmpty = false;
                var maxCircleValue = _this.countriesByDay["max"+_this.toggle];
                var circleWidth = (circleValue/_this.countriesByDay["max" + _this.toggle])*initialWidth;
                var maxCircleWidth = (maxCircleValue/_this.countriesByDay["max" + _this.toggle])*initialWidth;
                var circleColor = _this.colors[_this.toggle];

                if(circleWidth < 0.5){
                    circleWidth = 2;
                    if(circleValue === 0){
                        isEmpty = true;
                    }
                }
                console.log();
                var circleHTML = _this.circleTemplate({
                    country : country.country,
                    currentToggle : _this.toggle,
                    maxWidth : maxCircleWidth,
                    circleWidth : circleWidth,
                    circleValue : numeral(circleValue).format('0,0'),
                    isEmpty: isEmpty,
                    maxHeight: initialWidth,
                    countryCode: country.countrycode,
                    backgroundColor: circleColor
                });

                var $circle = $(circleHTML);
                $circle.on(
                    'click, mouseover',
                    null,
                    country,
                    _.bind(this.activeCountry, this)
                );
                
                $('.circlesContainer').append($circle);
            }, this);
        },

        renderSlider: function(){
            $('#slider-range').noUiSlider({
                start: [ _this.allDays.length-1 ],
                step: 1,
                range: {
                    'min': [  0 ],
                    'max': [ _this.allDays.length-1 ]
                }
            });

            $('#slider-range').on('slide', _.bind(this.readSlider, this));

            this.$timeSlider = $('#slider-range');
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
            var newValue = parseInt(this.$timeSlider.val());
            if(newValue !== this.date){
                this.date = newValue;
                this.drawCircles(this.allDays[this.date]);
                this.fillMapData();
                this.showSliderInput();
            }
        },

        showSliderInput:function(){
            var totalAmounts = 0;
            _.each(this.countriesByDay,function(i,j){
                var currentCountryNumber = i[this.allDays[this.date]][this.toggle];
                totalAmounts+=currentCountryNumber;
            },this);
            $('#currentSliderInput .currentDay span').html(this.allDays[this.date]);
            $('#currentSliderInput .currentDeaths').html('Total ' + this.toggle + ' so far <span>' + numeral(totalAmounts).format('0,0') + '</span>');  
        },

        activeCountry: function(e){
            if (!e || !e.hasOwnProperty('data') || !e.data) {
                return;
            }

            var id = e.target.className;
            var element;
            var rect;
            var offset;
            var x;
            var y;
            var w;
            var h;
            var map = document.querySelector("#map");
            var name;
            var override;

            name = e.data.country;
            id = e.data.countrycode;
            override = this.checkForOffsetOverride(id);

            if ( override === null ) {
                id = id.toUpperCase();
                offset = map.getBoundingClientRect();
                w = map.width;
                h = map.height;
                element = document.querySelector('#map .' + id);
                rect = element.getBoundingClientRect();
                x = rect.left - offset.left + rect.width / 2;
                y = rect.top - offset.top + rect.height / 2;
            } else {
                x = override.x + "%";
                y = override.y + "%";
            }

            $("#map-tooltip").css({top: y, left: x}).show();
            $("#map-tooltip-inner").html("<p>" + name + "</p>");

        },


        checkForOffsetOverride: function(name) {
            var obj = null;
             _.each(_this.offsetData,function(offsetCountry){
                if (offsetCountry.countrycode === name) {
                    obj = {
                        x: offsetCountry.percentageoffsetx,
                        y: offsetCountry.percentageoffsety
                    };
                } 
            });
             return obj;
        },

        hideTooltip: function(){
            $("#map-tooltip").hide();
        },

        autoPlayData:function(e){
            var currentState = $(e.currentTarget).attr('data-status');
            if(currentState==="paused"){
                startPlaying();
                currentState = "playing";
                $(e.currentTarget).attr('data-status',currentState);
            }else if(currentState==="playing"){
                stopPlaying();
                currentState = "paused";
                $(e.currentTarget).attr('data-status',currentState);
            }

            function startPlaying(){
                var hasLooped = false;
                var currentValue = _this.$timeSlider.val();
                var maxSliderValue = parseInt(_this.allDays.length-1);
                var i = parseInt(currentValue);
                if(i===maxSliderValue){
                    i = 0;
                }
                this.pauseData = false;

                function toNextPoint() {
                    setTimeout(function () {
                        if(!this.pauseData){
                            _this.$timeSlider.val(i);
                            _this.readSlider();
                            if(i<maxSliderValue){
                                i++;
                                toNextPoint();
                            }else if(i===maxSliderValue){
                                stopPlaying();
                                currentState = "paused";
                                $(e.currentTarget).attr('data-status',currentState);
                            }

                        }
                    }, 500);
                }
                toNextPoint();
            }

            function stopPlaying(){
                this.pauseData = true;
            }
        },

        render: function() {
            var data = EbolaData.getSheet('Historic cases');
            if (data && data.length > 0) {
                this.$el.html(this.template());
                this.updateData();
            }

            return this;
        }
    });
});

