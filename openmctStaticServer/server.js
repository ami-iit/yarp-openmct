/**
 * Basic implementation of a history and realtime server.
 */

var StaticServer = require('./static-server');

var expressWs = require('express-ws');
var app = require('express')();
expressWs(app);

var staticServer = new StaticServer();

app.use('/', staticServer);

var port = process.env.PORT || 8080

app.listen(port, function () {
    console.log('iCub Telemetry Visualizer (Open MCT based) hosted at http://localhost:' + port);
});