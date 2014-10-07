define([
    'backbone'
], function(Backbone) {
    'use strict';

    var configModel = new Backbone.Model.extend({

        defaults: {
            URL: '',
            shortURL: ''
        }
    });

    return configModel;
});

