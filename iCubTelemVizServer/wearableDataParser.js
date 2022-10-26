/**
 * This class holds the parser and all related methods for processing wearable data received
 * from the port publishing iFeelSuit wearable sensors.
 */

function WearableDataParser(state) {
    this.producerName = undefined;
    this.telemKeyTree = new Map([
        ["iFeelSuitTelemetry.accSens", {keyPrefix: ["acc"], format: ["vectorXYZ"], names: []}],
        ["iFeelSuitTelemetry.emgSens", {keyPrefix: [], format: [], names: []}],
        ["iFeelSuitTelemetry.force3dSens", {keyPrefix: ["force"], format: ["vectorXYZ"], names: []}],
        ["iFeelSuitTelemetry.FTsens", {keyPrefix: ["force","torque"], format: ["vectorXYZ","vectorXYZ"], names: []}],
        ["iFeelSuitTelemetry.FBaccSens", {keyPrefix: ["acc"], format: ["vectorXYZ"], names: []}],
        ["iFeelSuitTelemetry.gyroSens", {keyPrefix: ["gyr"], format: ["vectorXYZ"], names: []}],
        ["iFeelSuitTelemetry.magSens", {keyPrefix: ["mag"], format: ["vectorXYZ"], names: []}],
        ["iFeelSuitTelemetry.orientSens", {keyPrefix: ["oriQuat"], format: ["quaternionWXYZ"], names: []}],
        ["iFeelSuitTelemetry.poseSens", {keyPrefix: ["oriQuat","pos"], format: ["quaternionWXYZ","vectorXYZ"], names: []}],
        ["iFeelSuitTelemetry.positionSens", {keyPrefix: ["pos"], format: ["vectorXYZ"], names: []}],
        ["iFeelSuitTelemetry.skinSens", {keyPrefix: [], format: [], names: []}],
        ["iFeelSuitTelemetry.tempSens", {keyPrefix: [], format: [], names: []}],
        ["iFeelSuitTelemetry.torq3dSens", {keyPrefix: ["torque"], format: ["vectorXYZ"], names: []}],
        ["iFeelSuitTelemetry.virtLinkKinSens", {keyPrefix: ["oriQuat","pos","linearVel","angVel","linearAcc","angAcc"], format: ["quaternionWXYZ","vectorXYZ","vectorXYZ","vectorXYZ","vectorXYZ","vectorXYZ"], names: []}],
        ["iFeelSuitTelemetry.virtJointKinSens", {keyPrefix: [], format: [], names: []}],
        ["iFeelSuitTelemetry.virtSpherJointKinSens", {keyPrefix: ["oriRPY","angVel","angAcc"], format: ["vectorRPY","vectorXYZ","vectorXYZ"], names: []}]
    ]);
}

// WearableDataParser.prototype.addSubIdToKeyTree = function (subID) {
//     this.telemKeyTree.iFeelSuitTelemetry.accSens.push(subID.split('.')[2]);
// }

WearableDataParser.prototype.parse = function (sensorSample,state,history) {
    this.producerName = sensorSample[0];
    let subIDs = [];
    let keyIdx = 1;
    for (const telemFolderKey of this.telemKeyTree.keys()) {
        let telemFolderMetadata = this.telemKeyTree.get(telemFolderKey);
        telemFolderMetadata.names = [];
        sensorSample[keyIdx].forEach((sensorData,sensorIdx) => {
            telemFolderMetadata.names.push(sensorData[1].shift());  // sensor name
            let telemKey = [telemFolderKey,sensorIdx].join('.');
            state[telemKey] = {};
            state[telemKey].status = sensorData[1].shift(); // sensor status
            switch(telemFolderKey) { // sensor data
                case "iFeelSuitTelemetry.emgSens":
                    state[telemKey].value = sensorData[1][0];
                    state[telemKey].normalization = sensorData[1][1];
                    break;
                case "iFeelSuitTelemetry.tempSens":
                    state[telemKey] = sensorData[1][0];
                    break;
                case "iFeelSuitTelemetry.virtJointKinSens":
                    state[telemKey].position = sensorData[1][0];
                    state[telemKey].velocity = sensorData[1][1];
                    break;
                case "iFeelSuitTelemetry.skinSens":
                    state[telemKey].taxel = sensorData[1]
                    break;
                default:
                    telemFolderMetadata.keyPrefix.forEach((prfx,idx) => {
                        let data = {};
                        switch(telemFolderMetadata.format[idx]) {
                            case "vectorXYZ":
                                let [x,y,z] = sensorData[1];
                                Object.assign(data, {x: x, y: y, z: z});
                                break;
                            case "vectorRPY":
                                let [roll,pitch,yaw] = sensorData[1];
                                Object.assign(data, {roll: roll, pitch: pitch, yaw: yaw});
                                break;
                            case "quaternionWXYZ":
                                let [qw,qx,qy,qz] = sensorData[1];
                                Object.assign(data, {w: qw, x: qx, y: qy, z: qz});
                                break;
                            default:
                                throw new Error("Unsupported sensor data format");
                        }
                        state[telemKey][prfx] = data;
                    });
            }
            subIDs.push(telemKey);
            if (!Object.keys(history).includes(telemKey)) {
                history[telemKey] = [];
            }
        });
        keyIdx++;
    }
    return subIDs;
}

module.exports = WearableDataParser;
