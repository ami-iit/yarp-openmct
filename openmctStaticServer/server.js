/**
 * Static Server http (non secure)
 */

// Import main configuration
let config = require('../config/processedDefault');

// Send the process PID back to the parent through the IPC channel
const OpenMctServerHandlerChildProc = require('./openMctServerHandlerChildProc');
const procHandler = new OpenMctServerHandlerChildProc(console.log,console.error);
procHandler.messageParentProcess({"pid": process.pid});

// require and setup basic http functionalities
const express = require('express');
const app = express();

// Setup 'express-ws' in order to add WebSocket routes
const expressWs = require('express-ws');
expressWs(app);

// Process default server configuration requests
const {jsonExportScript} = require("../common/utils");
app.get('/config/processedDefault.json', function(req, res){
    console.log('processedDefault.json requested!');
    res.send(jsonExportScript(config,'processedConfig'));
});

// require yarp.js and setup the communication
// with the browser using websockets
var yarp = require('YarpJS');
var http = require('http').Server(app);
var io = require('socket.io')(http);
yarp.browserCommunicator(io);

// setup default page
app.get('/', function(req, res){
    res.sendFile('index.html',{ root : __dirname});
});

// setup static folders
app.use('/config', express.static(__dirname + '/../config'));
app.use('/openmctdist', express.static(__dirname + '/../node_modules/openmct/dist'));
app.use(express.static(__dirname + '/../node_modules'));
app.use(express.static(__dirname + '/../node_modules/YarpJS/js'));
app.use(express.static(__dirname));

// Start the server
const port = process.env.PORT || config.openmctStaticServer.port;
vizServer = http.listen(port, config.openmctStaticServer.host, function () {
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
        process.exit(0);
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
