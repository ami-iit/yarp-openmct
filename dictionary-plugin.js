const DOMAIN_OBJECTS_NAMESPACE = 'yarpopenmct.telemetry';
const ROOT_DOMAIN_OBJECT_KEY = 'icubtelemetry';

function getDictionary() {
    return http.get('/dictionary.json')
        .then(function (result) {
            return result.data;
        });
}

var objectProvider = {
    get: function (identifier) {
        return getDictionary().then(function (dictionary) {
            if (identifier.key === ROOT_DOMAIN_OBJECT_KEY) {
                return {
                    identifier: identifier,
                    name: dictionary.name,
                    type: 'folder',
                    location: 'ROOT'
                };
            } else {
                var measurement = dictionary.measurements.filter(function (m) {
                    return m.key === identifier.key;
                })[0];
                return {
                    identifier: identifier,
                    name: measurement.name,
                    type: 'icubsensor.telemetry',
                    telemetry: {
                        values: measurement.values
                    },
                    location: DOMAIN_OBJECTS_NAMESPACE + ':' + ROOT_DOMAIN_OBJECT_KEY
                };
            }
        });
    }
};

var compositionProvider = {
    appliesTo: function (domainObject) {
        return domainObject.identifier.namespace === DOMAIN_OBJECTS_NAMESPACE &&
               domainObject.type === 'folder';
    },
    load: function (domainObject) {
        return getDictionary()
            .then(function (dictionary) {
                return dictionary.measurements.map(function (m) {
                    return {
                        namespace: DOMAIN_OBJECTS_NAMESPACE,
                        key: m.key
                    };
                });
            });
    }
};

function DictionaryPlugin() {
    return function install(openmct) {
        openmct.objects.addRoot({
            namespace: DOMAIN_OBJECTS_NAMESPACE,
            key: ROOT_DOMAIN_OBJECT_KEY
        });

        openmct.objects.addProvider(DOMAIN_OBJECTS_NAMESPACE, objectProvider);

        openmct.composition.addProvider(compositionProvider);

        openmct.types.addType('icubsensor.telemetry', {
            name: 'iCub Sensor Telemetry Point',
            description: 'Telemetry point from one or multiple iCub sensors published on a single port.',
            cssClass: 'icon-telemetry'
        });
    };
};
