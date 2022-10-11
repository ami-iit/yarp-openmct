/**
 * Basic implementation of a static server.
 */

// Import main configuration and dynamic dictionaries
confServers = require('../conf/servers');
dictionaryIcubtelemetry = require('./plugins/conf/dictionaryIcubTelemetry');
dictionaryIFeelSuitTelemetry = require('./plugins/conf/dictionaryIFeelSuitTelemetry');
dictionaryProcessLogging = require('./plugins/conf/dictionaryProcessLogging');

// Send the process PID back to the parent through the IPC channel
const OpenMctServerHandlerChildProc = require('./openMctServerHandlerChildProc');
const procHandler = new OpenMctServerHandlerChildProc(console.log,console.error);
procHandler.reportPIDtoParent();

const StaticServer = require('./static-server');
const expressWs = require('express-ws');
const {
    jsonExportScript,
    evalTemplateLiteralInJSON,
    expandTelemetryDictionary
} = require("../common/utils");
const confServersJSON = evalTemplateLiteralInJSON(confServers);
const expandedDictionaryIcubtelemetry = expandTelemetryDictionary(dictionaryIcubtelemetry);
const dictionaryIcubtelemetryJSON = evalTemplateLiteralInJSON(expandedDictionaryIcubtelemetry);
const dictionaryIFeelSuitTelemetryJSON = evalTemplateLiteralInJSON(dictionaryIFeelSuitTelemetry);
const dictionaryProcessLoggingJSON = evalTemplateLiteralInJSON(dictionaryProcessLogging);
const app = require('express')();
expressWs(app);

const staticServer = new StaticServer();
// Process default server configuration requests

// The default page request processing is defined by default, but redefined here for triggering a refresh of the port
// connections.
app.get('/', function(req, res){
    res.sendFile('index.html',{ root : __dirname});
    if (!procHandler.requestPortsRefresh()) {
        console.warn('Ports refresh request not sent!');
    }
});

app.get('/config/confServers.json', function(req, res){
    res.send(jsonExportScript(confServersJSON,'confServers'));
});
app.get('/plugins/conf/dictionaryIcubTelemetry.json', function(req, res){
    res.send(dictionaryIcubtelemetryJSON);
});
app.get('/plugins/conf/dictionaryIFeelSuitTelemetry.json', function(req, res){
    res.send(dictionaryIFeelSuitTelemetryJSON);
});
app.get('/plugins/conf/dictionaryProcessLogging.json', function(req, res){
    res.send(dictionaryProcessLoggingJSON);
});

// Route static server
app.use('/', staticServer);

// Start the server
const port = process.env.PORT || confServersJSON.openmctStaticServer.port;
vizServer = app.listen(port, confServersJSON.openmctStaticServer.host, function () {
    console.log('Visualizer Console Server (Open MCT based) listening on http://' + vizServer.address().address + ':' + vizServer.address().port);
});

// Track the connections
WebsocketTracker = require('../common/websocket-tracker');
const vizServerTracker = new WebsocketTracker(vizServer);

// Handle a clean process termination
signalName2exitCodeMap = require('../common/utils').signalName2exitCodeMap;

function handleTermination(signal) {
    console.log('Received '+signal+' ...');
    vizServer.close(() => {
        console.log('Open-MCT Visualizer Server closed: all sockets closed.');
        process.exitCode = signalName2exitCodeMap(signal);
        process.removeListener('SIGINT', inhibit2ndSIGINT); // Remove the idle listener
        clearTimeout(handleTermination.prototype.sigintTimer);    // Cancel the timeout that would remove the idle listener
    });
    console.log('Open-MCT Visualizer Server closing: no further incoming requests accepted. Refreshing the visualizer web page will fail.');
    vizServerTracker.closeAll();
    // Run a timer for scheduling the removal of the idle listener in case the server closure gets stuck
    handleTermination.prototype.sigintTimer = setTimeout(function () {process.removeListener('SIGINT', inhibit2ndSIGINT);},5000);
}

// IDLE termination handler for inhibiting an eventual 2nd SIGINT (probably from the parent process)
// while we wait for the processing completion of the first SIGINT.
function inhibit2ndSIGINT() {}

process.prependOnceListener('SIGQUIT', () => {handleTermination('SIGQUIT');});
process.prependOnceListener('SIGTERM', () => {handleTermination('SIGTERM');});
process.prependOnceListener('SIGINT', () => {handleTermination('SIGINT');});
process.prependListener('SIGINT', inhibit2ndSIGINT);
