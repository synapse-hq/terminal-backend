"use strict";
exports.__esModule = true;
var express_1 = require("express");
var app = (0, express_1["default"])();
var port = process.env.PORT;
app.get('/', function (req, res) {
    res.send('hello');
});
app.listen(port, function () { return console.log('Server listening on port ' + port); });
