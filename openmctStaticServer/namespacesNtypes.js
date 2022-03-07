const ICUBTELEMETRY_DOMAIN_OBJECTS_NAMESPACE = 'yarpopenmct.icubtelemetry';
const WALKINGCTRLTELEMETRY_DOMAIN_OBJECTS_NAMESPACE = 'yarpopenmct.walkingctrltelemetry';
class ReportSchedule {
    static Realtime = Symbol();
    static Historical = Symbol();
}
Object.freeze(ReportSchedule);
