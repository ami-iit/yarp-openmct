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

function getDictionary(identifier) {
    switch (identifier.namespace) {
        case ICUBTELEMETRY_DOMAIN_OBJECTS_NAMESPACE:
            return http.get('/dictionaryIcubTelemetry.json')
                .then(function (result) {
                    return result.data;
                });
        case VECTORCOLLECTIONS_DOMAIN_OBJECTS_NAMESPACE:
            return http.get('config/dictionaryVectorCollectionsTelemetry.json')
                .then(function (result) {
                    return result.data;
                });
        default:
            return Promise.reject('Unknown namespace!!');
    }
}

function generateObject(identifier,dictionary) {
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
        type: telemetryEntry.type,
        telemetry: {
            values: telemetryEntry.values
        },
        location: identifier.namespace + ':' + dictionary.key
    };
}

class ObjectProvider {
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
                if (identifier.namespace === VECTORCOLLECTIONS_DOMAIN_OBJECTS_NAMESPACE) {
                    return requestLatestTelemetrySample(identifier.key)
                        .then(function (sample) {
                            return genDictFromWalkingCtrlPortDataStruct(dictionary, sample);
                        }).then(function (modifiedDictionary) {
                            return generateObject(identifier,modifiedDictionary);
                        });
                } else {
                    return generateObject(identifier,dictionary);
                }
            }
        }.bind(this)).catch((errorMessage) => {
            console.error(errorMessage);
            throw new Error(errorMessage);
        });
    }
}

var compositionProvider = {
    appliesTo: function (domainObject) {
        return (domainObject.identifier.namespace === ICUBTELEMETRY_DOMAIN_OBJECTS_NAMESPACE
            || domainObject.identifier.namespace === VECTORCOLLECTIONS_DOMAIN_OBJECTS_NAMESPACE)
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

        Object.keys(DOMAIN_OBJECTS_TYPES).forEach((type) => {
            openmct.types.addType(type, Object.assign({},{
                name: DOMAIN_OBJECTS_TYPES[type].name,
                description: DOMAIN_OBJECTS_TYPES[type].description,
                cssClass: DOMAIN_OBJECTS_TYPES[type].icon
            }));
        });

        openmct.objects.addRoot({
            namespace: ICUBTELEMETRY_DOMAIN_OBJECTS_NAMESPACE,
            key: 'icubtelemetry'
        });

        openmct.objects.addProvider(ICUBTELEMETRY_DOMAIN_OBJECTS_NAMESPACE, new ObjectProvider());

        openmct.objects.addRoot({
            namespace: VECTORCOLLECTIONS_DOMAIN_OBJECTS_NAMESPACE,
            key: 'vectorCollectionsTelemetry'
        });

        openmct.objects.addProvider(VECTORCOLLECTIONS_DOMAIN_OBJECTS_NAMESPACE, new ObjectProvider());

        openmct.composition.addProvider(compositionProvider);
    };
};
