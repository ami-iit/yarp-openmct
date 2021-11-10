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
app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(__dirname + '/node_modules/YarpJS/js'));
app.use(express.static(__dirname));

// setup default page
app.get('/', function(req, res){
  res.sendFile('index.html',{ root : __dirname});
});

// Basic implementation of a history and realtime server.
var ICubTelemetry = require('./icubtelemetry');
var RealtimeServer = require('./realtime-server');
var HistoryServer = require('./history-server');

// Create the ping handler
var PingHandler = require('./pingHandler');
var pingHandler = new PingHandler();

// Handle Data URI Scheme
var getDataURIscheme = require('./getDataURIscheme');

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

// Open the ports, register read callback functions, connect the ports and start the notifier task
icubtelemetry.defineNetworkConnector(
  (id) => yarp.Network.connect(portInConfig[id]["yarpName"],portInConfig[id]["localName"]),
  (id) => yarp.Network.disconnect(portInConfig[id]["yarpName"],portInConfig[id]["localName"])
);

const TerminationHandler = require('./terminationHandler.js');

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

// Start history and realtime servers
const telemServer = app.listen(portTelemetryRespOrigin, config.telemVizServer.host, function () {
    console.log('ICubTelemetry History Server listening on http://' + telemServer.address().address + ':' + telemServer.address().port + '/history');
    console.log('ICubTelemetry Realtime Server listening on ws://' + telemServer.address().address + ':' + telemServer.address().port + '/realtime');
});

// Start the control console server
const consoleServer = http.listen(config.consoleServer.port, config.consoleServer.host, function(){
  console.log('Control Console Server listening on http://' + consoleServer.address().address + ':' + consoleServer.address().port);
});

// Track the connections
WebsocketTracker = require('../common/websocket-tracker');
const telemServerTracker = new WebsocketTracker(telemServer);
const consoleServerTracker = new WebsocketTracker(consoleServer);

// Create and start the OpenMCT server
var OpenMctServerHandler = require('./openMctServerHandlerParentProc');
var openMctServerHandler = new OpenMctServerHandler(console.log,console.error);
var ret = openMctServerHandler.start();
console.log(ret);

// Handler for a gracious termination
var terminationHandler = new TerminationHandler(
  openMctServerHandler,
  telemServer,telemServerTracker,
  consoleServer,consoleServerTracker,
  icubtelemetry
);

// Add our own termination signals listeners.
// When the signal comes from the terminal, the generated event doesn't have a 'signal' parameter,
// so it appears undefined in the callback body. We worked around this issue by explicitly setting
// the 'signal' parameter case by case.
terminationHandler.backupAndReplaceSignalListeners('SIGQUIT');
terminationHandler.backupAndReplaceSignalListeners('SIGTERM');
terminationHandler.backupAndReplaceSignalListeners('SIGINT');
