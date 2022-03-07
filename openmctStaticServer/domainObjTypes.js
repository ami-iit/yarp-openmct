const DOMAIN_OBJECTS_TYPES = {
    "yarpopenmct.sensormeas": {
        name: 'iCub Sensor Telemetry Entry',
        description: 'Telemetry entry from one or multiple iCub sensors published on a single port.',
        icon: 'icon-telemetry',
        reportSchedule: [ReportSchedule.Realtime,ReportSchedule.Historical]
    },
    "yarpopenmct.veccollectionmap": {
        name: 'Walking Controller Telemetry Entry',
        description: 'Telemetry entry from the Walking Controller related data published on a single port (e.g. internal variables), structured as a vector collection map.',
        icon: 'icon-telemetry',
        reportSchedule: [ReportSchedule.Realtime,ReportSchedule.Historical]
    }
};
