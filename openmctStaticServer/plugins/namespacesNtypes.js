const YARPOPENMCT_DICTIONARY_PLUGIN_NAMESPACE = 'yarpopenmct';
const VECTORCOLLECTIONS_DOMAIN_OBJECTS_SUBNAMESPACE = 'vectorCollectionsTelemetry';

const dictionaryID2file = {
    'icubtelemetry': 'plugins/conf/dictionaryIcubTelemetry.json',
    'vectorCollectionsTelemetry': 'config/dictionaryVectorCollectionsTelemetry.json',
    'processLogging': 'plugins/conf/dictionaryProcessLogging.json',
    'iFeelSuitTelemetry': 'plugins/conf/dictionaryIFeelSuitTelemetry.json'
}
Object.freeze(dictionaryID2file);

class ReportSchedule {
    static Realtime = Symbol();
    static Historical = Symbol();
}
Object.freeze(ReportSchedule);
