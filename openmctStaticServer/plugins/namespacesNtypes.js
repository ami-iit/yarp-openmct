const ICUBTELEMETRY_DOMAIN_OBJECTS_NAMESPACE = 'yarpopenmct.icubtelemetry';
const VECTORCOLLECTIONS_DOMAIN_OBJECTS_NAMESPACE = 'yarpopenmct.vectorCollectionsTelemetry';
const PROCESSLOGGING_DOMAIN_OBJECTS_NAMESPACE = 'yarpopenmct.processLogging';

const namespace2dictionaryFile = {
    'yarpopenmct.icubtelemetry': 'plugins/conf/dictionaryIcubTelemetry.json',
    'yarpopenmct.vectorCollectionsTelemetry': 'config/dictionaryVectorCollectionsTelemetry.json',
    'yarpopenmct.processLogging': 'plugins/conf/dictionaryProcessLogging.json'
}
Object.freeze(namespace2dictionaryFile);

class ReportSchedule {
    static Realtime = Symbol();
    static Historical = Symbol();
}
Object.freeze(ReportSchedule);
