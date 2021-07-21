// Server http (non secure)

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
    "sens.camRightEye": {"yarpName":'/icubSim/camRightEye', "localName":'/yarpjs/camRightEye:i',"portType":'image'}
};

// Open the ports, register read callback functions, connect the ports
Object.keys(portInConfig).forEach(function (id) {
    var portIn = yarp.portHandler.open(portInConfig[id]["localName"],portInConfig[id]["portType"]);
    switch (portInConfig[id]["portType"]) {
        case 'bottle':
            portIn.onRead(function (bottle){ icubtelemetry.updateState(id,bottle.toArray()); });
            break;
        case 'image':
            portIn.onRead(function (image){ icubtelemetry.updateState(id,getDataURIscheme(image.compression_type,image.buffer)); });
            break;
        default:
    }
    yarp.Network.connect(portInConfig[id]["yarpName"],portInConfig[id]["localName"]);
});

// Start history and realtime servers
app.listen(portTelemetryRespOrigin, function () {
    console.log('ICubTelemetry History hosted at http://localhost:' + portTelemetryRespOrigin + '/history');
    console.log('ICubTelemetry Realtime hosted at ws://localhost:' + portTelemetryRespOrigin + '/realtime');
});

// start the server!
http.listen(3000, function(){
  console.log('listening on http://localhost:3000');
});
