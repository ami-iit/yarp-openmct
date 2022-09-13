const ICUBTELEMETRY_DOMAIN_OBJECTS_NAMESPACE = 'yarpopenmct.icubtelemetry';
const VECTORCOLLECTIONS_DOMAIN_OBJECTS_NAMESPACE = 'yarpopenmct.vectorCollectionsTelemetry';

const namespace2dictionaryFile = {
    'yarpopenmct.icubtelemetry': 'plugins/conf/dictionaryIcubTelemetry.json',
    'yarpopenmct.vectorCollectionsTelemetry': 'config/dictionaryVectorCollectionsTelemetry.json'
}
Object.freeze(namespace2dictionaryFile);

class ReportSchedule {
    static Realtime = Symbol();
    static Historical = Symbol();
}
Object.freeze(ReportSchedule);
