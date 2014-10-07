define([
    'backbone',
    'underscore',
    'numeral',
    'data/ebolaData',
    'text!templates/tableTemplate.html'
], function(
    Backbone,
    _,
    numeral,
    EbolaData,
    templateHTML
) {
    'use strict';

    return Backbone.View.extend({

        className: 'tableView',

        template: _.template(templateHTML),

        initialize: function() {
            Backbone.on('fetch:success', this.render, this);
        },

        // TODO: Use border width
        calcScale: function(data) {
            var maxDiameter = 350;
            var deathDiameter;
            var casesDiamerter;

            var totalDeaths = _.reduce(data, function(memo, d) {
                return memo + parseInt(d.deaths, 10);
            }, 0);

            var totalCases = _.reduce(data, function(memo, d) {
                return memo + parseInt(d.cases, 10);
            }, 0);


            if (totalCases > totalDeaths) {
                casesDiamerter = maxDiameter;
                deathDiameter = (totalDeaths / totalCases) * maxDiameter;
            } else {
                casesDiamerter = (totalCases / totalDeaths) * maxDiameter;
                deathDiameter = maxDiameter;
            }

            var maxRow = _.max(data, function(row) { return row.cases; });
            var maxDiamter = Math.sqrt(maxRow.cases / Math.PI) * 2;

            _.forEach(data, function(row) {
                // Tidy up data
                if (row.year === '2001/2002') {
                    row.year = '2001/02';
                }

                //var diameter = (row.cases / maxRow.cases) * maxDiameter;
                var diameter = Math.sqrt(row.cases / Math.PI) * 2;
                var pixelDiameter = (diameter / maxDiamter) * maxDiameter;

                var deathDiameter = Math.sqrt(row.deaths / Math.PI) * 2;
                var pixelDeathSize = pixelDiameter - ((deathDiameter / maxDiamter) * maxDiameter);

                /*
                row.casesPercentage = (row.cases / totalCases) * 100;
                row.deathsPercentage = (row.deaths / totalDeaths) * 100;
                */

                row.casesSize = Math.ceil(pixelDiameter);
                row.deathsSize = pixelDeathSize / 2;

                // Format numbers
                row.cases = numeral(row.cases).format('0,0');
                row.deaths = numeral(row.cases).format('0,0');
            });
        },

        render: function() {
            var data = EbolaData.getSheet('Historic cases');
            if (data) {
                this.calcScale(data);
            }
            console.log(data);

            this.$el.html(this.template({ data: data }));
            return this;
        }
    });
});


