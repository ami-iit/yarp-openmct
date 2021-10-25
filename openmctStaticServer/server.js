/**
 * Basic implementation of a static server.
 */

// Send the process PID back to the parent through the IPC channel
const OpenMctServerHandlerChildProc = require('./openMctServerHandlerChildProc');
const procHandler = new OpenMctServerHandlerChildProc(console.log,console.error);
procHandler.messageParentProcess({"pid": process.pid});

const StaticServer = require('./static-server');
const expressWs = require('express-ws');
const app = require('express')();
expressWs(app);

const staticServer = new StaticServer();
app.use('/', staticServer);
const port = process.env.PORT || 8080

// Start the server
vizServer = app.listen(port, function () {
    console.log('iCub Telemetry Visualizer (Open MCT based) hosted at http://localhost:' + port);
});

// Track the connections
WebsocketTracker = require('../common/websocket-tracker');
const vizServerTracker = new WebsocketTracker(vizServer);

// Handle a clean process termination
SignalName2codeMap = require('../common/utils').SignalName2codeMap;

function handleTermination(signal) {
    console.log('Received '+signal+' ...');
    vizServer.close(() => {
        console.log('Open-MCT Visualizer Server closed: all sockets closed.');
        process.exitCode = 128+SignalName2codeMap[signal];
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
