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

        render: function() {
            console.log(EbolaData.getSheets());
            this.$el.html(this.template());
            return this;
        }
    });
});

