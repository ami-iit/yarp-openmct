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

vizServer = app.listen(port, function () {
    console.log('iCub Telemetry Visualizer (Open MCT based) hosted at http://localhost:' + port);
});

function handleTermination(signal) {
    console.log('Received '+signal+' ...');
}

process.prependOnceListener('SIGQUIT', () => {handleTermination('SIGQUIT');});
process.prependOnceListener('SIGTERM', () => {handleTermination('SIGTERM');});
process.prependOnceListener('SIGINT', () => {handleTermination('SIGINT');});
