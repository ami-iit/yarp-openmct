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
    res.sendFile('indexTest.html',{ root: __dirname});
});

// setup static folders
app.use(express.static(__dirname + '/../node_modules'));
app.use(express.static(__dirname + '/../node_modules/YarpJS/js'));
app.use(express.static(__dirname));

// Create the ping handler
var PingHandler = require('../iCubTelemVizServer/pingHandler');
var pingHandler = new PingHandler();

// Handle Data URI Scheme
var getDataURIscheme = require('../iCubTelemVizServer/getDataURIscheme');
const {jsonExportScript} = require("../common/utils");

// Create RPC server for executing system commands
portRPCserver4sysCmds = yarp.portHandler.open('/yarpjs/sysCmdsGenerator/rpc','rpc');

portRPCserver4sysCmds.onRead(function (cmdNparams) {
    var cmdArray = cmdNparams.toArray();
    switch (cmdArray[0].toString()) {
        case 'pingON':
        case 'pingOFF':
            const pingRet = startStopPingOnSelectedServer(cmdArray,portRPCserver4sysCmds.reply);
            if (pingRet.status != 'DELAYED_REPLY') {
                portRPCserver4sysCmds.reply(pingRet.status + ' ' + pingRet.err);
            }
            break;
        default:
            portRPCserver4sysCmds.reply('ERROR Unknown command ' + cmdNparams.toString());
    }

    function startStopPingOnSelectedServer(cmdArray,replyCallback) {
        var startStopRet;
        switch (cmdArray[0].toString()) {
            case 'pingON':
                // Check for errors
                if (cmdArray.length > 3) {
                    return {status: 'ERROR', err: 'Too many input parameters'};
                }
                if (typeof cmdArray[1] != 'number' || typeof cmdArray[2] != 'string') {
                    return {status: 'ERROR', err: 'Wrong input parameters'};
                }
                // Define the output callbacks
                onStdout = function (data) {
                    if (data=='-1') {
                        console.log('error: Missing round trip time');
                    }
                    else {
                        icubtelemetry.generateTelemetry(Date.now(),data,'ping');
                    }
                }
                onStderror = function (data) {
                    console.log('stderr: ' + data);
                }
                onError = function (error) {
                    console.log('error: ' + error.message);
                }
                onClose = function (code) {
                    replyCallback('OK Process stopped.');
                    console.log('close: ' + code);
                }
                // Create and run network ping process
                startStopRet = pingHandler.start(cmdArray[1],cmdArray[2].toString(),onStdout,onStderror,onError,onClose);
                break;
            case 'pingOFF':
                startStopRet = pingHandler.stop();
                break;
            default:
                startStopRet = {status: 'OK', err: ''};
        }
        return startStopRet;
    }
});

// Start the control console server
const consoleServer = http.listen(config.openmctStaticServer.port, config.openmctStaticServer.host, function(){
  console.log('Control Console Server listening on http://' + consoleServer.address().address + ':' + consoleServer.address().port);
});

// Track the connections
WebsocketTracker = require('../common/websocket-tracker');
const consoleServerTracker = new WebsocketTracker(consoleServer);

// Handle a clean process termination
signalName2exitCodeMap = require('../common/utils').signalName2exitCodeMap;

function handleTermination(signal) {
    console.log('Received '+signal+' ...');
    consoleServer.close(() => {
        console.log('Open-MCT Visualizer Server closed: all sockets closed.');
        process.exitCode = signalName2exitCodeMap(signal);
        process.removeListener('SIGINT', inhibit2ndSIGINT); // Remove the idle listener
        clearTimeout(handleTermination.prototype.sigintTimer);    // Cancel the timeout that would remove the idle listener
    });
    console.log('Open-MCT Visualizer Server closing: no further incoming requests accepted. Refreshing the visualizer web page will fail.');
    consoleServerTracker.closeAll();
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
