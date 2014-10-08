define([
    'backbone'
],
function(Backbone) {
    'use strict';

    var Routes = Backbone.Router.extend({
        routes: {
            'table(/:mode)' : 'tableView',
            'map(/:date)'   : 'mapView',
            '*other'        : 'default'
        }
    });

    return new Routes();
});

