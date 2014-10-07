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
            this.MAX_VIZ_WIDTH = 500;
            this.MAX_WINDOW_WIDTH = 660;
            Backbone.on('fetch:success', this.render, this);

            // Handle resize
            this.resizeRender = _.debounce(this.render.bind(this), 300);
            $(window).on('resize', this.resizeRender);
        },

        getVizWidth: function() {
            var windowWidth = $(window).width();
            return windowWidth * 0.333;
        },

        // TODO: Use border width
        calcScale: function(data) {
            var maxDiameter = this.getVizWidth();
            var maxRow = _.max(data, function(row) { return row.cases; });
            var maxDiamter = Math.sqrt(maxRow.cases / Math.PI) * 2;

            _.forEach(data, function(row) {
                // Tidy up data
                if (row.year === '2001/2002') {
                    row.year = '2001/02';
                }

                var diameter = Math.sqrt(row.cases / Math.PI) * 2;
                var pixelDiameter = (diameter / maxDiamter) * maxDiameter;
                var deathDiameter = Math.sqrt(row.deaths / Math.PI) * 2;
                var pixelDeathSize = pixelDiameter - ((deathDiameter / maxDiamter) * maxDiameter);

                row.casesSize = Math.ceil(pixelDiameter);
                row.deathsSize = pixelDeathSize / 2;

                // Format numbers
                row.cases = numeral(row.cases).format('0,0');
                row.deaths = numeral(row.deaths).format('0,0');
            });
        },

        render: function() {
            var data = EbolaData.getSheet('Historic cases');
            if (data) {
                this.calcScale(data);
            }

            this.$el.html(this.template({ data: data }));
            return this;
        }
    });
});


