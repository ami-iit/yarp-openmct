const DOMAIN_OBJECTS_TYPES = {
    "yarpopenmct.sensormeas": {
        name: 'iCub Sensor Telemetry Entry',
        description: 'Sensor measurements from one or multiple iCub sensors published on a single port.',
        icon: 'icon-telemetry',
        reportSchedule: [ReportSchedule.Realtime,ReportSchedule.Historical]
    },
    "yarpopenmct.camimage": {
        name: 'iCub Eye Camera Telemetry Entry',
        description: 'Camera images from one of the iCub eye cameras published on a single port.',
        icon: 'icon-camera',
        reportSchedule: [ReportSchedule.Realtime,ReportSchedule.Direct]
    },
    "yarpopenmct.nwstatus": {
        name: 'Network Satus Related Entry',
        description: 'Telemetry entry related to the satus of the network hosting the robot and other connected interface systems.',
        icon: 'icon-connectivity',
        reportSchedule: [ReportSchedule.Realtime,ReportSchedule.Historical]
    },
    "yarpopenmct.wbdestimation": {
        name: 'Whole-body Dynamics Estimation Entry',
        description: 'Dynamic variable output from the whole-body dynamics estimations.',
        icon: 'icon-gear',
        reportSchedule: [ReportSchedule.Realtime,ReportSchedule.Historical]
    },
    "yarpopenmct.veccollectionmap": {
        name: 'Walking Controller Internal Variable or Setpoint Entry',
        description: 'Walking Controller internal variable or setpoint data published within a vector collection map on a single port.',
        icon: 'icon-telemetry-aggregate',
        reportSchedule: [ReportSchedule.Realtime,ReportSchedule.Historical]
    }
};
