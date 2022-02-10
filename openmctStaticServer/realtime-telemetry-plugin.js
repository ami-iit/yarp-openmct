/**
 * Basic Realtime telemetry plugin using websockets.
 */
function RealtimeTelemetryPlugin(telemServerHost,telemServerPort) {
    return function (openmct) {
        var socket = new WebSocket('ws://' + telemServerHost + ':' + telemServerPort + '/realtime/');
        var listener = {};

        socket.onmessage = function (event) {
            point = JSON.parse(event.data);
            if (listener[point.id]) {
                listener[point.id](point);
            }
        };

        var provider = {
            supportsSubscribe: function (domainObject) {
                return domainObject.type === ICUBTELEMETRY_DOMAIN_OBJECTS_TYPE
                    || domainObject.type === WALKINGCTRLTELEMETRY_DOMAIN_OBJECTS_TYPE;
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
