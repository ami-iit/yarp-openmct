// Server http (non secure)

// Process the termination signals callbacks.
// When the signal comes from the terminal, the generated event doesn't have a 'signal' parameter,
// so it appears undefined in the callback body. We worked around this issue by explicitly setting
// the 'signal' parameter case by case.
process.once('SIGQUIT', () => {terminationHandler.run('SIGQUIT');});
process.once('SIGTERM', () => {terminationHandler.run('SIGTERM');});
process.once('SIGINT', () => {terminationHandler.run('SIGINT');});

// require and setup basic http functionalities
var portTelemetryReqOrigin = process.env.PORT_TLM_REQ_ORIGIN || 8080
var portTelemetryRespOrigin = process.env.PORT_TLM_RSP_ORIGIN || 8081
var express = require('express');
var app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:"+portTelemetryReqOrigin); // update to match the domain you will make the request from
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
var portInConfig = {
    "sens.imu": {"yarpName":'/icubSim/inertial', "localName":'/yarpjs/inertial:i',"portType":'bottle'},
    "sens.leftLegState": {"yarpName":'/icubSim/left_leg/stateExt:o', "localName":'/yarpjs/left_leg/stateExt:o',"portType":'bottle'},
    "sens.camLeftEye": {"yarpName":'/icubSim/camLeftEye', "localName":'/yarpjs/camLeftEye:i',"portType":'image'},
    "sens.camRightEye": {"yarpName":'/icubSim/camRightEye', "localName":'/yarpjs/camRightEye:i',"portType":'image'},
    "sens.leftLegEEwrench": {"yarpName":'/wholeBodyDynamics/left_leg/cartesianEndEffectorWrench:o', "localName":'/yarpjs/left_leg/cartesianEndEffectorWrench:i',"portType":'bottle'},
    "sens.rightLegEEwrench": {"yarpName":'/wholeBodyDynamics/right_leg/cartesianEndEffectorWrench:o', "localName":'/yarpjs/right_leg/cartesianEndEffectorWrench:i',"portType":'bottle'},
    "sens.batteryStatus": {"yarpName":'/icubSim/battery/data:o', "localName":'/yarpjs/battery/data:i',"portType":'bottle'}
};

// Open the ports, register read callback functions, connect the ports
Object.keys(portInConfig).forEach(function (id) {
    var portIn = yarp.portHandler.open(portInConfig[id]["localName"],portInConfig[id]["portType"]);
    switch (portInConfig[id]["portType"]) {
        case 'bottle':
            portIn.onRead(function (bottle){
                icubtelemetry.updateState(id,bottle.toArray());
            });
            break;
        case 'image':
            portIn.onRead(function (image){
                icubtelemetry.updateState(id,getDataURIscheme(image.getCompressionType(),image.toBinary()));
            });
            break;
        default:
    }
    yarp.Network.connect(portInConfig[id]["yarpName"],portInConfig[id]["localName"]);
});

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
const telemServer = app.listen(portTelemetryRespOrigin, function () {
    console.log('ICubTelemetry History hosted at http://localhost:' + portTelemetryRespOrigin + '/history');
    console.log('ICubTelemetry Realtime hosted at ws://localhost:' + portTelemetryRespOrigin + '/realtime');
});

// Start the control console server
const consoleServer = http.listen(3000, function(){
  console.log('listening on http://localhost:3000');
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
  consoleServer,consoleServerTracker);

function TerminationHandler(
  openMctServerHandler,
  telemServer,telemServerTracker,
  consoleServer,consoleServerTracker) {
    this.openMctServerHandler = openMctServerHandler;
    this.telemServer = telemServer;
    this.telemServerTracker = telemServerTracker;
    this.consoleServer = consoleServer;
    this.consoleServerTracker = consoleServerTracker;
}

TerminationHandler.prototype.run = function(signal) {
    console.log('Received '+signal+' ...');
    this.runSubsetA(signal);
}

TerminationHandler.prototype.runSubsetA = function (signal) {
    /*
     * === Closure subset A ===
     * A.1 - Stop the child Node.js process running the OpenMCT static server.
     * A.2 - Stop the Telemetry HTTP server telemServer from accepting new connections.
     * A.3 - Stop the Control Console HTTP server consoleServer from accepting new connections.
     */
    const closeChildProcessPromise = new Promise(function(resolve,reject) {
        ret = this.openMctServerHandler.stop(signal,resolve,reject);
        console.log(ret);
    }.bind(this));
    const closeTelemServerPromise = new Promise(function(resolve,reject) {
        this.telemServer.close((error) => {
            if (error === undefined) {
                resolve('iCub Telemetry Server closed: all sockets closed.');
            } else {
                reject(error);
            }
        });
        console.log('iCub Telemetry Server closing: no further connection requests accepted.');
    }.bind(this));
    const closeConsoleServerPromise = new Promise(function(resolve,reject) {
        this.consoleServer.close((error) => {
            if (error === undefined) {
                resolve('Control Console Server closed: all sockets closed.');
            } else {
                reject(error);
            }
        });
        console.log('Control Console Server closing: no further incoming requests accepted.');
    }.bind(this));
    closeChildProcessPromise.then(
        function(value) {
            console.log(value);
            this.runSubsetB();
        }.bind(this),
        function(error) { console.error(error.toString()); }
    );
}

TerminationHandler.prototype.runSubsetB = function() {
    /*
     * === Closure subset B ===
     * B.1 - Stop listening to client requests ("subscribe"/"unsubscribe" events) on the existing connections.
     */
     this.telemServerTracker.pauseAll();
}
