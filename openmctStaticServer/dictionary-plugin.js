// Prepare closure variables for function 'requestLatestTelemetrySample()'
let telemServerAddress = {host:'',port:''};

function requestLatestTelemetrySample(telemetryEntryKey) {
    var url = 'http://' + telemServerAddress.host + ':' + telemServerAddress.port + '/history/' +
        telemetryEntryKey +
        '/latest';

    return http.get(url)
        .then(function (resp) {
            return resp.data[0];
        });
}
//requestLatestTelemetrySample.prototype.telemServerHost = {host:'',port:''};

function getDictionary(identifier) {
    switch (identifier.namespace) {
        case ICUBTELEMETRY_DOMAIN_OBJECTS_NAMESPACE:
            return http.get('/dictionaryIcubTelemetry.json')
                .then(function (result) {
                    return result.data;
                });
        case WALKINGCTRLTELEMETRY_DOMAIN_OBJECTS_NAMESPACE:
            return http.get('/dictionaryWalkingControllerTemplate.json')
                .then(function (result) {
                    let dictionaryTemplate = result.data;
                    return requestLatestTelemetrySample("walkingController.logger")
                        .then(function (sample) {
                            let walkingCtrlPortDataStruct = sample;
                            delete walkingCtrlPortDataStruct.timestamp;   // discard last element (timestamp)
                            delete walkingCtrlPortDataStruct.id; // discard first element (id)
                            return genDictFromWalkingCtrlPortDataStruct(dictionaryTemplate,walkingCtrlPortDataStruct);
                        });
                });
        default:
            console.error('Unknown namespace!!');
    }
}

class ObjectProvider {
    constructor(telemetryEntryType) {
        this.telemetryEntryType = telemetryEntryType;
    }
    get(identifier) {
        return getDictionary(identifier).then(function (dictionary) {
            if (identifier.key === dictionary.key) {
                return {
                    identifier: identifier,
                    name: dictionary.name,
                    type: 'folder',
                    location: 'ROOT'
                };
            } else {
                var telemetryEntry = dictionary.telemetryEntries.filter(function (m) {
                    return m.key === identifier.key;
                })[0];
                telemetryEntry.values.forEach(function (value) {
                    if (value.units !== undefined) {
                        value.name += " (" + value.units + ")";
                    }
                });
                return {
                    identifier: identifier,
                    name: telemetryEntry.name,
                    type: this.telemetryEntryType,
                    telemetry: {
                        values: telemetryEntry.values
                    },
                    location: identifier.namespace + ':' + dictionary.key
                };
            }
        }.bind(this));
    }
}

var compositionProvider = {
    appliesTo: function (domainObject) {
        return (domainObject.identifier.namespace === ICUBTELEMETRY_DOMAIN_OBJECTS_NAMESPACE
            || domainObject.identifier.namespace === WALKINGCTRLTELEMETRY_DOMAIN_OBJECTS_NAMESPACE)
            && domainObject.type === 'folder';
    },
    load: function (domainObject) {
        return getDictionary(domainObject.identifier)
            .then(function (dictionary) {
                return dictionary.telemetryEntries.map(function (m) {
                    return {
                        namespace: domainObject.identifier.namespace,
                        key: m.key
                    };
                });
            });
    }
};

function DictionaryPlugin(telemServerHost,telemServerPort) {
    return function install(openmct) {
        telemServerAddress.host = telemServerHost;
        telemServerAddress.port = telemServerPort;

        openmct.types.addType(ICUBTELEMETRY_DOMAIN_OBJECTS_TYPE, {
            name: 'iCub Sensor Telemetry Entry',
            description: 'Telemetry entry from one or multiple iCub sensors published on a single port.',
            cssClass: 'icon-telemetry'
        });

        openmct.types.addType(WALKINGCTRLTELEMETRY_DOMAIN_OBJECTS_TYPE, {
            name: 'iCub Sensor Telemetry Entry',
            description: 'Telemetry entry from one or multiple iCub sensors published on a single port.',
            cssClass: 'icon-telemetry'
        });

        openmct.objects.addRoot({
            namespace: ICUBTELEMETRY_DOMAIN_OBJECTS_NAMESPACE,
            key: 'icubtelemetry'
        });

        openmct.objects.addProvider(ICUBTELEMETRY_DOMAIN_OBJECTS_NAMESPACE, new ObjectProvider(ICUBTELEMETRY_DOMAIN_OBJECTS_TYPE));

        openmct.objects.addRoot({
            namespace: WALKINGCTRLTELEMETRY_DOMAIN_OBJECTS_NAMESPACE,
            key: 'walkingctrltelemetry'
        });

        openmct.objects.addProvider(WALKINGCTRLTELEMETRY_DOMAIN_OBJECTS_NAMESPACE, new ObjectProvider(WALKINGCTRLTELEMETRY_DOMAIN_OBJECTS_TYPE));

        openmct.composition.addProvider(compositionProvider);
    };
};
