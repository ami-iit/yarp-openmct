/**
 * Server http (non secure)
 */

// Import main configuration
var config = require('../config/processedDefault');

// require and setup basic http functionalities
var portTelemetryReqOrigin = process.env.PORT_TLM_REQ_ORIGIN || config.openmctStaticServer.port;
var portTelemetryRespOrigin = process.env.PORT_TLM_RSP_ORIGIN || config.telemVizServer.port;
var express = require('express');
var app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://" + config.openmctStaticServer.host + ":" + portTelemetryReqOrigin); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var http = require('http').Server(app);
var io = require('socket.io')(http);

// require yarp.js and setup the communication
//with the browser using websockets
var yarp = require('YarpJS');
yarp.browserCommunicator(io);

// setup static folders
app.use(express.static(__dirname + '/../node_modules'));
app.use(express.static(__dirname + '/../node_modules/YarpJS/js'));
app.use(express.static(__dirname));

// setup default page
app.get('/', function(req, res){
  res.sendFile('indexTest.html',{ root : __dirname});
});

// Basic implementation of a history and realtime server.
var ICubTelemetry = require('../iCubTelemVizServer/icubtelemetry');
var RealtimeServer = require('../iCubTelemVizServer/realtime-server');
var HistoryServer = require('../iCubTelemVizServer/history-server');

// Create the ping handler
var PingHandler = require('../iCubTelemVizServer/pingHandler');
var pingHandler = new PingHandler();

// Handle Data URI Scheme
var getDataURIscheme = require('../iCubTelemVizServer/getDataURIscheme');

// Setup 'express-ws' in order to add WebSocket routes
var expressWs = require('express-ws');
expressWs(app);

// Create the servers
var icubtelemetry = new ICubTelemetry();
var realtimeServer = new RealtimeServer(icubtelemetry);
var historyServer = new HistoryServer(icubtelemetry);
app.use('/realtime', realtimeServer);
app.use('/history', historyServer);

// Open the Yarp ports and feed the data to the 'icubtelemetry' object

// Define the ports
var portInConfig = config.portInConfig;

// Open the ports, register read callback functions, connect the ports and start the notifier task.
// Use topics to create persistent connections.
icubtelemetry.defineNetworkConnector(
  (id) => {
      yarp.Network.connect(portInConfig[id]["yarpName"],"topic:/" + portInConfig[id]["yarpName"]);
      yarp.Network.connect("topic:/" + portInConfig[id]["yarpName"],portInConfig[id]["localName"]);
  },
  (id) => {
      yarp.Network.disconnect(portInConfig[id]["yarpName"],"topic:/" + portInConfig[id]["yarpName"]);
      yarp.Network.disconnect("topic:/" + portInConfig[id]["yarpName"],portInConfig[id]["localName"]);
      yarp.Network.disconnect(portInConfig[id]["yarpName"],portInConfig[id]["localName"]);
  }
);

const TerminationHandler = require('../iCubTelemVizServer/terminationHandler.js');

Object.keys(portInConfig).forEach(function (id) {
    var portIn = yarp.portHandler.open(portInConfig[id]["localName"],portInConfig[id]["portType"]);

    // Redefine the Yarp port listener
    switch (portInConfig[id]["portType"]) {
        case 'bottle':
            portIn.onRead(function (bottle){
                icubtelemetry.forwardYarpDataToNotifier[id](id,bottle.toArray());
            });
            break;
        case 'image':
            portIn.onRead(function (image){
                icubtelemetry.forwardYarpDataToNotifier[id](id,getDataURIscheme(image.getCompressionType(),image.toBinary()));
            });
            break;
        default:
    }

    // Connect the Yarp port listener to 'icubtelemetry' handler and to the robot interface.
    // Prepare the disconnection for the server termination.
    TerminationHandler.prototype.unlistenToNetworkPorts.push(icubtelemetry.connectTelemSrcToNotifier(id));
});

icubtelemetry.startNotifier();

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
