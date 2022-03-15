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

        var provider = {
            supportsSubscribe: function (domainObject) {
                return DOMAIN_OBJECTS_TYPES[domainObject.type].reportSchedule.includes(ReportSchedule.Realtime);
            },
            subscribe: function (domainObject, callback) {
                listener[domainObject.identifier.key] = callback;
                socket.send('subscribe ' + domainObject.identifier.key);
                return function unsubscribe() {
                    delete listener[domainObject.identifier.key];
                    socket.send('unsubscribe ' + domainObject.identifier.key);
                };
            }
        };

        openmct.telemetry.addProvider(provider);
    }
}
