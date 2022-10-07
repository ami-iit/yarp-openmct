// Prepare closure variables for function 'requestLatestTelemetrySample()'
let telemServerAddress = {host:'',port:''};

function getElemFromComposedKey(dictionary,telemetryEntryKey) {
    let keyPath = telemetryEntryKey.split('.');
    if (keyPath.shift() !== dictionary.key) {
        console.error('Inconsistent dictionary key and telemetry key sub-namespace!');
    }
    return keyPath.reduce((parentElem,currentKey) => {
        return parentElem.telemetryEntries.filter(function (m) {
            return currentKey === m.key;
        })[0];
    },dictionary);
}

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
    let subNamespace = identifier.key.split('.')[0];
    if (dictionaryID2file[subNamespace] !== undefined) {
        return http.get(dictionaryID2file[subNamespace])
            .then(function (result) {
                return result.data;
            });
    } else {
        return Promise.reject(`Unknown sub-namespace ${subNamespace}!!`);
    }
}

function generateObject(identifier,dictionary) {
    var telemetryEntry = getElemFromComposedKey(dictionary,identifier.key);
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
            }
            if (identifier.key.split('.')[0] === VECTORCOLLECTIONS_DOMAIN_OBJECTS_SUBNAMESPACE) {
                return requestLatestTelemetrySample(identifier.key)
                    .then(function (sample) {
                        return expandTelemetryMetadataInDict(DOMAIN_OBJECTS_TYPES, telemetryMetadataBaseDflt, dictionary, sample);
                    }).then(function (modifiedDictionary) {
                        return generateObject(identifier,modifiedDictionary);
                    });
            }
            return generateObject(identifier,dictionary);
        }.bind(this)).catch((errorMessage) => {
            console.error(errorMessage);
            throw new Error(errorMessage);
        });
    }
}

var compositionProvider = {
    appliesTo: function (domainObject) {
        return domainObject.identifier.namespace === YARPOPENMCT_DICTIONARY_PLUGIN_NAMESPACE
            && domainObject.type === 'folder';
    },
    load: function (domainObject) {
        return getDictionary(domainObject.identifier)
            .then(function (dictionary) {
                return getElemFromComposedKey(dictionary,domainObject.identifier.key).telemetryEntries.map(function (m) {
                    return {
                        namespace: domainObject.identifier.namespace,
                        key: [domainObject.identifier.key,m.key].join('.')
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

        openmct.objects.addRoot([
            {
                namespace: YARPOPENMCT_DICTIONARY_PLUGIN_NAMESPACE,
                key: 'icubtelemetry'
            },
            {
                namespace: YARPOPENMCT_DICTIONARY_PLUGIN_NAMESPACE,
                key: 'processLogging'
            },
            {
                namespace: YARPOPENMCT_DICTIONARY_PLUGIN_NAMESPACE,
                key: 'vectorCollectionsTelemetry'
            }
        ]);

        openmct.objects.addProvider(YARPOPENMCT_DICTIONARY_PLUGIN_NAMESPACE, new ObjectProvider());

        openmct.composition.addProvider(compositionProvider);
    };
};
