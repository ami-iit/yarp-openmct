/**
 * Basic implementation of a history and realtime server.
 */

var Spacecraft = require('./spacecraft');
var StaticServer = require('./static-server');

var expressWs = require('express-ws');
var app = require('express')();
expressWs(app);

var spacecraft = new Spacecraft();
var staticServer = new StaticServer();

app.use('/', staticServer);

var port = process.env.PORT || 8080

app.listen(port, function () {
    console.log('Open MCT hosted at http://localhost:' + port);
});
