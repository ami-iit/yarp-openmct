/**
 * Basic historical telemetry plugin.
 */

function HistoricalTelemetryPlugin(telemServerHost,telemServerPort) {
    return function install (openmct) {
        var provider = {
            supportsRequest: function (domainObject) {
                return domainObject.type === 'icubsensor.telemetry';
            },
            request: function (domainObject, options) {
                var url = 'http://' + telemServerHost + ':' + telemServerPort + '/history/' +
                    domainObject.identifier.key +
                    '?start=' + options.start +
                    '&end=' + options.end;

                return http.get(url)
                    .then(function (resp) {
                        return resp.data;
                    });
            }
        };

        openmct.telemetry.addProvider(provider);
    }
}
