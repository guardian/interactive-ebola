define([
    'jquery',
    'backbone',
    'underscore',
    'data/ebolaData',
    'text!templates/mapTemplate.html',
    'text!templates/circleTemplate.html',
], function(
    $,
    Backbone,
    _,
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
            'click .caseToggle button': 'switchToggle',
            'click .playButton': 'autoPlayData'
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
                this.showSliderInput();
            }
        },
        updateData:function(){
            _this = this;
            this.countryData = EbolaData.getSheet('cases by date');
            this.offsetData = EbolaData.getSheet('manual offset overrides');
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

            maxNum = (Math.ceil(maxNum / 1000)) * 1000;
            //var roundMaxNum = (Math.floor(maxNum / 1000)) * 1000;
            var heatmapColors = this.getHeatmapColors();

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
                            return _this.retrieveColor( countryValue, maxNum, heatmapColors )
                        }

                    });
                });
            }

            buildMapKey(heatmapColors, maxNum);

            function buildMapKey(colors, maxNum) {

                var i, htmlString = "<h3>Number of " + _this.toggle + "</h3>", $key = $("#map-key"), bandWidth = 100 / colors.length;

                for (i = 0; i < colors.length; i++) {

                    htmlString += "<div class='key-band' style='background: " + colors[i] + "; width: " + bandWidth + "%'></div>";

                }

                htmlString += "<p style='float: left'>0</p><p style='float: right'>" + maxNum + "</p>";

                $key.html(htmlString);

            }
        },
        retrieveColor:function(num, maxNum, colors) {
            var colorsLength = colors.length;
            var bandSize = maxNum / colorsLength;
            var colorIndex = Math.floor(num / bandSize)
            return colors[colorIndex];
        },
        getHeatmapColors:function() {
            var arr = [];
            if (_this.toggle == "cases") {
                arr = ["rgb(195,247,255)", "rgb(150,242,255)", "rgb(112,223,239)", "rgb(79,190,206)", "rgb(49,160,176)", "rgb(17,128,144)", "rgb(1,94,108)", "rgb(1,59,68)"];
            } else { // deaths
                arr = ["rgb(255,226,208)", "rgb(255,204,172)", "rgb(255,172,122)", "rgb(255,129,52)", "rgb(228,97,18)", "rgb(183,70,1)", "rgb(128,49,1)", "rgb(82,32,1)"]
            }
            //"rgb(243,253,255)", "rgb(255,249,245)",
            return arr;
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
                var circleValue = country[date][_this.toggle];
                var isEmpty = false;
                var maxCircleValue = country["max"+_this.toggle];
                var circleWidth = (circleValue/_this.countriesByDay["max" + _this.toggle])*initialWidth;
                var maxCircleWidth = (maxCircleValue/_this.countriesByDay["max" + _this.toggle])*initialWidth;
                var circleColor = _this.retrieveColor(circleValue, _this.countriesByDay["max" + _this.toggle]+1, _this.getHeatmapColors());

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
                    countryCode: country.countrycode,
                    backgroundColor: circleColor
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
            $('#currentSliderInput').html("All " + this.toggle + " until: " + this.allDays[this.date]);
        },

        activeCountry: function(e){

            var id = e.target.className, element, rect, offset, x, y, w, h, map = $("#map"), name, override;

            if ($(e.target).hasClass("countryContainer")) {

                name = $(e.target).data().countryname;

                id = id.substring(id.length-3, id.length);

                override = checkForOffsetOverride(id);

                if ( override === null ) {

                    id = id.toUpperCase();

                offset = map.offset();
                w = map.width();
                h = map.height;

                map = document.getElementById("map");

                element = map.getElementsByClassName(id)[0];
                rect = element.getBoundingClientRect();

                x = rect.left - offset.left + rect.width / 2;
                y = rect.top - offset.top + rect.height / 2;

            } else {
                x = override.x + "%";
                y = override.y + "%";
            }

                $("#map-tooltip").css({top: y, left: x}).show();
                $("#map-tooltip-inner").html("<p>" + name + "</p>");

            }

            function checkForOffsetOverride(name) {

                var obj = null;

                console.log(name)

                 _.each(_this.offsetData,function(offsetCountry){

                    if (offsetCountry.countrycode == name) {

                        obj = {
                            x: offsetCountry.percentageoffsetx,
                            y: offsetCountry.percentageoffsety
                        };

                        console.log("yes")
                    } 

                });

                 return obj;
            }
        },

        hideTooltip: function(e){
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
                var currentValue = _this.$timeSlider.val();
                var maxSliderValue = parseInt(_this.$timeSlider.attr('max'));
                var i = parseInt(currentValue);
                this.pauseData = false;

                function toNextPoint() {
                    setTimeout(function () {
                        if(!this.pauseData){
                            if(i===maxSliderValue){
                                i=0;
                            }else{
                                i++;
                            }
                            _this.$timeSlider.val(i);
                            _this.readSlider();
                            toNextPoint();
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
            this.$el.html(this.template());
            Backbone.on('fetch:success', this.updateData, this);

            return this;
        }
    });
});

