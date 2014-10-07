define([
    'backbone',
    'underscore',
    'text!templates/tableTemplate.html'
], function(Backbone, _, templateHTML) {
    'use strict';

    return Backbone.View.extend({

        className: 'tableView',

        template: _.template(templateHTML),

        initialize: function() {
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        }
    });
});

