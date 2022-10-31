/**
 * This class holds the parser and all related methods for processing wearable data received
 * from the port publishing iFeelSuit wearable sensors.
 */

const {flatten} = require('../common/utils');

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

    for (const telemFolderKey of this.telemKeyTree.keys()) {
        let telemFolderMetadata = this.telemKeyTree.get(telemFolderKey);
        let parsedData = {};
        telemFolderMetadata.keyPrefix.forEach((prfx,idx) => {
            switch(telemFolderMetadata.format[idx]) {
                case "vectorXYZ":
                    parsedData[prfx] = {x: 0, y: 0, z: 0};
                    break;
                case "vectorRPY":
                    parsedData[prfx] = {roll: 0, pitch: 0, yaw: 0};
                    break;
                case "quaternionWXYZ":
                    parsedData[prfx] = {w: 0, x: 0, y: 0, z: 0};
                    break;
                default:
                    throw new Error("Unsupported sensor data format definition!");
            }
        });
        let packedParsedData = {};
        packedParsedData.parsedData = parsedData;
        let flattenParsedData = flatten(packedParsedData);
        let funcBody = `
          let parsedData = ${JSON.stringify(parsedData)};
          [${Object.keys(flattenParsedData).toString()}] = sensorData;
          return parsedData;
        `;
        telemFolderMetadata.parse = Function('sensorData', funcBody);
    }
}

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
                    Object.assign(state[telemKey],telemFolderMetadata.parse(sensorData[1]));
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
