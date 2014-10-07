define([
    'backbone',
    'underscore',
    'data/ebolaData',
    'text!templates/tableTemplate.html'
], function(
    Backbone,
    _,
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
            var maxDiameter = 500;
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

            console.log(casesDiamerter, deathDiameter, totalCases, totalDeaths);


            _.forEach(data, function(row) {
                row.casesPercentage = (row.cases / totalCases) * 100;
                row.deathsPercentage = (row.deaths / totalDeaths) * 100;
                row.casesSize = Math.ceil(casesDiamerter / 100 * row.casesPercentage);
                row.deathsSize = Math.ceil(deathDiameter / 100 * row.deathsPercentage);
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

