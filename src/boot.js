'use strict';
define([], function() {
    return {
        boot: function(el, context, config, mediator) {
            // Load main application
            require(['@@assetpath/assets/js/main.js'], function(req) {
                // Main app returns a almond instance of require to avoid
                // R2 / NGW inconsistencies.
                req(['main'], function(main) {
                    var config = (config) ? config : {};
                    config.assetPath = '@@assetpath/';
                    main.init(el, context, config, mediator);
                });
            }, function(err) { console.error('Error loading boot.', err); });
        }
    };
});
