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

function requestFolderTelemetryEntryKeys(folderDomainObjectKey) {
    var url = `http://${telemServerAddress.host}:${telemServerAddress.port}/wearableMetadata/${folderDomainObjectKey}/childTelemEntryKeys`;

    return http.get(url)
        .then(function (resp) {
            return resp.data[0];
        }).catch((errorMessage) => {
            console.error(errorMessage);
            throw new Error(errorMessage);
        });
}

function requestTelemetryEntryNames(telemetryEntryKey) {
    let splitComposedKey = telemetryEntryKey.split('.');
    let entryKey = splitComposedKey.pop();
    var url = `http://${telemServerAddress.host}:${telemServerAddress.port}/wearableMetadata/${splitComposedKey.join('.')}/${entryKey}/name`;

    return http.get(url)
        .then(function (resp) {
            return resp.data[0];
        }).catch((errorMessage) => {
            console.error(errorMessage);
            throw new Error(errorMessage);
        });
}

function getFolderTelemetryEntryKeys(dictionary,folderDomainObjectKey) {
    if ((telemetryEntries = getElemFromComposedKey(dictionary, folderDomainObjectKey).telemetryEntries).length > 0) {
        return Promise.resolve(telemetryEntries.map(function (entry) {
            return entry.key
        }));
    }
    return requestFolderTelemetryEntryKeys(folderDomainObjectKey);
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
        telemetry: function () {
            if (telemetryEntry.type !== 'folder') return {
                values: telemetryEntry.values
            };
            return undefined;
        }(),
        location: identifier.namespace + ':' + dictionary.key
    };
}

function generateObject4iFeelSuitTelemetry(identifier,parentKey,dictionary) {
    return requestTelemetryEntryNames(identifier.key).then(function (telemetryName) {
        return {
            identifier: identifier,
            name: telemetryName,
            type: dictionary.telemetryEntryBase.type,
            telemetry: {
                values: [
                    ...dictionary.presetValuesBase[parentKey],
                    dictionary.presetValuesBase.status,
                    dictionary.presetValuesBase.timestamp
                ]
            },
            location: identifier.namespace + ':' + dictionary.key
        };
    });
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
            if (dictionary.key === 'iFeelSuitTelemetry') {
                let splitComposedKey = identifier.key.split('.');
                splitComposedKey.pop();
                if (getElemFromComposedKey(dictionary,splitComposedKey.join('.')).telemetryEntries.length == 0) {
                    return generateObject4iFeelSuitTelemetry(identifier,splitComposedKey.pop(),dictionary);
                }
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
        return getDictionary(domainObject.identifier).then(function (dictionary) {
            return getFolderTelemetryEntryKeys(dictionary,domainObject.identifier.key).then(function (keys) {
                return keys.map(function (k) {
                    return {
                        namespace: domainObject.identifier.namespace,
                        key: [domainObject.identifier.key,k].join('.')
                    };
                });
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
            },
            {
                namespace: YARPOPENMCT_DICTIONARY_PLUGIN_NAMESPACE,
                key: 'iFeelSuitTelemetry'
            }
        ]);

        openmct.objects.addProvider(YARPOPENMCT_DICTIONARY_PLUGIN_NAMESPACE, new ObjectProvider());

        openmct.composition.addProvider(compositionProvider);
    };
};
