/**
 * Expand the telemetry metadata within the dictionary using the sample
 * data received on the Yarp port, and the user defined dictionary.
 *
 * @param {object} dictionary - input dictionary with unexpanded telemetry metadata elements.
 * @param {object} telemetrySample - Telemetry sample used for filling the telemetry metadata values in the dictionary.
 * @returns {object} dictionary - Expanded dictionary.
 */
function expandTelemetryMetadataInDict(dictionary,telemetrySample) {
    var telemetryEntry = dictionary.telemetryEntries.filter(function (elem) {
        return elem.key === telemetrySample.id;
    })[0];
    var valueTemplate = telemetryEntry.values[0];
    let timestampTemplate = telemetryEntry.values[1];
    telemetryEntry.values = []; // reset values array

    // traverse 'telemetrySample' and fill telemetryEntry.values
    delete telemetrySample.timestamp;   // discard last element (timestamp)
    delete telemetrySample.id; // discard first element (id)
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
