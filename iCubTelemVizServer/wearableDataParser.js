/**
 * This class holds the parser and all related methods for processing wearable data received
 * from the port publishing iFeelSuit wearable sensors.
 */

function WearableDataParser(state) {
}

WearableDataParser.prototype.parse = function (sensorSample,state,history) {
    state["iFeelSuitTelemetry.accSens.10"] = {"status":"OK","acc.x":0,"acc.y":0,"acc.z":0};
    state["iFeelSuitTelemetry.accSens.11"] = {"status":"OK","acc.x":0,"acc.y":0,"acc.z":0};
    let subIDs = ["iFeelSuitTelemetry.accSens.10","iFeelSuitTelemetry.accSens.11"];
    subIDs.forEach((subID) => {
        if (!Object.keys(history).includes(subID)) {
            history[subID] = [];
        }
    });
    return subIDs;
}

module.exports = WearableDataParser;
