define([
    'backbone',
    'underscore',
    'text!templates/mapTemplate.html'
], function(Backbone, _, templateHTML) {
    'use strict';

    return Backbone.View.extend({

        className: 'mapView',

        template: _.template(templateHTML),

        initialize: function(options) {
            this.date = options.date;
            console.log('Map start date: %s', this.date);
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        }
    });
});

