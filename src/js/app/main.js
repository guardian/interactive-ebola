define([
    'backbone',
    'jquery',
    'data/ebolaData',
    'views/tableView',
    'views/mapView',
    'routes',
    'iframeMessenger'
], function(
    Backbone,
    $,
    EbolaData,
    TableView,
    MapView,
    routes,
    iframeMessenger
) {
    'use strict';

    var $el;

    function startTableView() {
        var tableView = new TableView();
        $el.html(tableView.render().el);
    }

    function startMapView(date) {
        var mapView = new MapView({ date: date });
        $el.html(mapView.render().el);
    }

    // Kick things off
    function init(el) {
        $el = $(el);

        // Listen to routes
        routes.on('route:default', startTableView);
        routes.on('route:tableView', startTableView);
        routes.on('route:mapView', startMapView);
        Backbone.history.start();

        // Fetch data
        EbolaData.fetch();

        // Enable iframe resizing on the GU site
        iframeMessenger.enableAutoResize();
    }

    return {
        init: init
    };
});
