/**
 * Generate the dictionary from the template and structure extracted from the Yarp port data
 *
 * @param {object} dictionaryTemplate - Template for initialising the dictionary.
 * @param {object} telemetrySample - Telemetry sample used for filling the telemetry values attributes in the dictionary.
 * @returns {object} dictionary - Generated dictionary.
 */
function genDictFromWalkingCtrlPortDataStruct(dictionaryTemplate,telemetrySample) {
    let dictionary = JSON.parse(JSON.stringify(dictionaryTemplate)); // init the dictionary from the template
    var telemetryEntry = dictionary.telemetryEntries.filter(function (elem) {
        return elem.key === "walkingController.logger";
    })[0];
    var valueTemplate = telemetryEntry.values[0];
    let timestampTemplate = telemetryEntry.values[1];
    telemetryEntry.values = []; // reset values array

    // traverse 'telemetrySample' and fill telemetryEntry.values
    Object.keys(telemetrySample).forEach(function (key,index) {
        let splitKey = key.split('.');
        let componentIndex = splitKey.pop();
        splitKey.shift(); // remove 'value' prefix
        telemetryEntry.values[index] = JSON.parse(JSON.stringify(valueTemplate));
        Object.assign(telemetryEntry.values[index],{
            key: key,
            name: splitKey.join('.')+'['+componentIndex+']',
            hints: {"range": index+1}
        });
    });

    telemetryEntry.values.push(timestampTemplate);
    return dictionary;
}
