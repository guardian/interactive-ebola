define([
    'backbone',
    'underscore',
    'data/ebolaData',
    'text!templates/mapTemplate.html'
], function(
    Backbone,
    _,
    EbolaData,
    templateHTML
) {
    'use strict';

    return Backbone.View.extend({

        className: 'mapView',

        template: _.template(templateHTML),

        initialize: function(options) {
            this.date = options.date;
            console.log('Map start date: %s', this.date);
            Backbone.on('fetch:success', this.render, this);
        },

        render: function() {
            console.log(EbolaData.getSheets());
            this.$el.html(this.template());
            return this;
        }
    });
});

