/**
 * This class holds the parser and all related methods for processing wearable data received
 * from the port publishing iFeelSuit wearable sensors.
 */

function WearableDataParser(state) {
    this.telemKeyTree = {
        "iFeelSuitTelemetry.accSens": [],
        "iFeelSuitTelemetry.emgSens": [],
        "iFeelSuitTelemetry.force3dSens": [],
        "iFeelSuitTelemetry.FTsens": [],
        "iFeelSuitTelemetry.FBaccSens": [],
        "iFeelSuitTelemetry.gyroSens": [],
        "iFeelSuitTelemetry.magSens": [],
        "iFeelSuitTelemetry.orientSens": [],
        "iFeelSuitTelemetry.poseSens": [],
        "iFeelSuitTelemetry.positionSens": [],
        "iFeelSuitTelemetry.skinSens": [],
        "iFeelSuitTelemetry.tempSens": [],
        "iFeelSuitTelemetry.torq3dSens": [],
        "iFeelSuitTelemetry.virtLinkKinSens": [],
        "iFeelSuitTelemetry.virtJointKinSens": [],
        "iFeelSuitTelemetry.virtSpherJointKinSens": []
    };
}

WearableDataParser.prototype.parse = function (sensorSample,state,history) {
    state["iFeelSuitTelemetry.accSens.0"] = {"status":"OK","acc.x":0,"acc.y":0,"acc.z":0};
    state["iFeelSuitTelemetry.accSens.1"] = {"status":"OK","acc.x":0,"acc.y":0,"acc.z":0};
    let subIDs = ["iFeelSuitTelemetry.accSens.0","iFeelSuitTelemetry.accSens.1"];
    this.telemKeyTree["iFeelSuitTelemetry.accSens"] = ["iFeelSuit::acc::Node#10","iFeelSuit::acc::Node#11"];
    subIDs.forEach((subID) => {
        if (!Object.keys(history).includes(subID)) {
            history[subID] = [];
        }
    });
    return subIDs;
}

module.exports = WearableDataParser;
