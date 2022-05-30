const ICUBTELEMETRY_DOMAIN_OBJECTS_NAMESPACE = 'yarpopenmct.icubtelemetry';
const VECTORCOLLECTIONS_DOMAIN_OBJECTS_NAMESPACE = 'yarpopenmct.vectorCollectionsTelemetry';
class ReportSchedule {
    static Realtime = Symbol();
    static Historical = Symbol();
}
Object.freeze(ReportSchedule);
