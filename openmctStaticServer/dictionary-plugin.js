const ICUBTELEMETRY_DOMAIN_OBJECTS_NAMESPACE = 'yarpopenmct.icubtelemetry';
const WALKINGCTRLTELEMETRY_DOMAIN_OBJECTS_NAMESPACE = 'yarpopenmct.walkingctrltelemetry';

function getDictionary(identifier) {
    switch (identifier.namespace) {
        case ICUBTELEMETRY_DOMAIN_OBJECTS_NAMESPACE:
            dictionaryRelPath = '/dictionaryIcubTelemetry.json';
            break;
        case WALKINGCTRLTELEMETRY_DOMAIN_OBJECTS_NAMESPACE:
            dictionaryRelPath = '/dictionaryWalkingControllerTemplate.json';
            break;
        default:
            console.error('Unknown namespace!!');
    }
    return http.get(dictionaryRelPath)
        .then(function (result) {
            return result.data;
        });
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

function DictionaryPlugin() {
    return function install(openmct) {
        openmct.objects.addRoot({
            namespace: ICUBTELEMETRY_DOMAIN_OBJECTS_NAMESPACE,
            key: 'icubtelemetry'
        });

        openmct.types.addType('icubsensor.telemetry', {
            name: 'iCub Sensor Telemetry Point',
            description: 'Telemetry point from one or multiple iCub sensors published on a single port.',
            cssClass: 'icon-telemetry'
        });

        openmct.objects.addProvider(ICUBTELEMETRY_DOMAIN_OBJECTS_NAMESPACE, new ObjectProvider('icubsensor.telemetry'));

        openmct.objects.addRoot({
            namespace: WALKINGCTRLTELEMETRY_DOMAIN_OBJECTS_NAMESPACE,
            key: 'walkingctrltelemetry'
        });

        openmct.objects.addProvider(WALKINGCTRLTELEMETRY_DOMAIN_OBJECTS_NAMESPACE, new ObjectProvider('icubsensor.telemetry'));

        openmct.composition.addProvider(compositionProvider);
    };
};
