/**
 * Basic implementation of a static server.
 */

// Import main configuration and dynamic dictionaries
config = require('../common/processedConfig');

// Send the process PID back to the parent through the IPC channel
const OpenMctServerHandlerChildProc = require('./openMctServerHandlerChildProc');
const procHandler = new OpenMctServerHandlerChildProc(console.log,console.error);
procHandler.messageParentProcess({"pid": process.pid});

const StaticServer = require('./static-server');
const expressWs = require('express-ws');
const {jsonExportScript} = require("../common/utils");
const app = require('express')();
expressWs(app);

const staticServer = new StaticServer();
// Process default server configuration requests
app.get('/common/processedConfig.json', function(req, res){
    res.send(jsonExportScript(config,'processedConfig'));
});

// Route static server
app.use('/', staticServer);

// Start the server
const port = process.env.PORT || config.openmctStaticServer.port;
vizServer = app.listen(port, config.openmctStaticServer.host, function () {
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
