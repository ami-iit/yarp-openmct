"use strict";

// Init the dictionary from a template
let dictionaryTemplate = require('./dictionaryWalkingControllerTemplate.json');

function genDictFromWalkingCtrlPortDataStruct(dataStruct) {
    let dictionary = JSON.parse(JSON.stringify(dictionaryTemplate));
    var telemetryEntry = dictionary.telemetryEntries.filter(function (elem) {
        return elem.key === "walkingController.logger";
    })[0];
    var valueTemplate = JSON.parse(JSON.stringify(telemetryEntry.values[0]));
    let timestampTemplate = JSON.parse(JSON.stringify(telemetryEntry.values[1]));
    telemetryEntry.values = []; // reset values array

    // traverse 'dataStruct' and fill telemetryEntry.values
    Object.keys(dataStruct).map(function (key,index) {
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

/**
 * Generate the dictionary from the template and structure extracted from the Yarp port data
 *
 * @param {String}
 */

// Export processed dictionary
module.exports = genDictFromWalkingCtrlPortDataStruct;
