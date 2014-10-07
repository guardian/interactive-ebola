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
            var data = EbolaData.getSheet('Historic cases');
            console.log(data);
            this.$el.html(this.template({ data: data }));
            return this;
        }
    });
});

