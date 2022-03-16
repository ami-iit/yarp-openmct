/**
 * Basic Realtime telemetry plugin using websockets.
 */

function RealtimeTelemetryPlugin(telemServerHost,telemServerPort,echoPort) {
    return function (openmct) {
        var socket = new WebSocket('ws://' + telemServerHost + ':' + telemServerPort + '/realtime/');
        var listener = {};

        socket.onmessage = function (event) {
            let data = JSON.parse(event.data);
            let point = {
                timestamp: data.timestamp,
                value: yarp.getImageSrc(data.value.compressionType,data.value.buffer.data),
                id: data.id
            };
            // echoPort.write(point.value);
            if (listener[point.id]) {
                listener[point.id](point);
            }
        };

        echoPort.onRead(function(img) {
            let point = {
                timestamp: Date.now(),
                value: yarp.getImageSrc(img.compression_type,img.buffer),
                id: "sens.camLeftEye"
            };
            if (listener[point.id]) {
                listener[point.id](point);
            }
        });

        var provider = {
            supportsSubscribe: function (domainObject) {
                return DOMAIN_OBJECTS_TYPES[domainObject.type].reportSchedule.includes(ReportSchedule.Realtime);
            },
            subscribe: function (domainObject, callback) {
                listener[domainObject.identifier.key] = callback;
                if (DOMAIN_OBJECTS_TYPES[domainObject.type].reportSchedule.includes(ReportSchedule.Direct)) {
                    yarp.Network.connect('/icubSim/camLeftEye','/yarpjs/camLeftEyeDirect:i');
                } else {
                    socket.send('subscribe ' + domainObject.identifier.key);
                    return function unsubscribe() {
                        delete listener[domainObject.identifier.key];
                        yarp.Network.disconnect('/icubSim/camLeftEye','/yarpjs/camLeftEyeDirect:i');
                    };
                }
            }
        };

        openmct.telemetry.addProvider(provider);
    }
}
