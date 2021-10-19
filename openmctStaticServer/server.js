/**
 * Basic implementation of a static server.
 */

// Send the process PID back to the parent through the IPC channel
const OpenMctServerHandlerChildProc = require('./openMctServerHandlerChildProc');
const procHandler = new OpenMctServerHandlerChildProc(console.log);
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
function handleTermination(signal) {
    console.log('Received '+signal+' ...');
    vizServer.close(() => {
        console.log('Open-MCT Visualizer Server closed. No further requests accepted. Refreshing the visualizer web page will fail.');
    })
    vizServerTracker.closeAll();
}

process.prependOnceListener('SIGQUIT', () => {handleTermination('SIGQUIT');});
process.prependOnceListener('SIGTERM', () => {handleTermination('SIGTERM');});
process.prependOnceListener('SIGINT', () => {handleTermination('SIGINT');});
