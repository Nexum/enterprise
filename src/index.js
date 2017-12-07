const jQuery = require("jquery");
const CanvasGame = require("lib/canvasgame");
const MY_ID = require("uuid/v1")();
const apiClass = require("adventskalender-js-api");

var Api = new apiClass();
Api.init(window, "Enterprise");
var debug = location.hostname === "localhost";
var game = new CanvasGame("game");

game.setApi(Api);

Api.getUser().then((data) => {
    game.setUser(data);
}, (err) => {
    if (debug) {
        game.setUser({
            _id: "5a17d8700af00952e999dccc",
            isVa: true
        });
    }
});

Api.getHighscore().then((data) => {
    game.setHighscore(data);
}, (err) => {
    if (debug) {
        game.setHighscore(3000);
    }
    game.setHighscore(0);
});