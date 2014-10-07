define([
    'backbone',
    'models/gameModel',
    'data/gamesData'
], function(
    Backbone,
    GameModel,
    GamesData
) {
    'use strict';

    var GameCollection = Backbone.Collection.extend({
        
        model: GameModel

    });

    return new GameCollection(GamesData);
});

