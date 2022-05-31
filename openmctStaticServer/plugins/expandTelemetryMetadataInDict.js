/**
 * Expands the telemetry metadata within the dictionary using the default values from the DOMAIN_OBJECTS_TYPES, the user
 * defined dictionary and the sample data received on the Yarp port.
 *
 * @param {object} dictionary - input dictionary with unexpanded telemetry metadata elements.
 * @param {object} telemetrySample - Telemetry sample used for filling the telemetry metadata values in the dictionary.
 * @returns {object} dictionary - Expanded dictionary.
 */
function expandTelemetryMetadataInDict(domainObjectsTypes, telemetryMetadataBaseDflt, dictionary,telemetrySample) {
    var telemetryEntry = dictionary.telemetryEntries.filter(function (elem) {
        return elem.key === telemetrySample.id;
    })[0];

    let userMetadata = JSON.parse(JSON.stringify(telemetryMetadataBaseDflt));
    dfsAssign(userMetadata,domainObjectsTypes[telemetryEntry.type].telemetryMetadataDflt);
    dfsAssign(userMetadata,telemetryEntry.values)

    telemetryEntry.values = []; // reset values array

    // traverse 'telemetrySample' and fill telemetryEntry.values
    delete telemetrySample.timestamp;   // discard last element (timestamp)
    delete telemetrySample.id; // discard first element (id)
    Object.keys(telemetrySample).forEach(function (key,index) {
        // Set template variables and set telem entry from user metadata
        let splitKey = key.split('.');
        let _componentIndex = splitKey.pop();
        let _signalName = splitKey.join('.').replace(/^value\./,"");
        telemetryEntry.values[index] = JSON.parse(JSON.stringify(userMetadata.range));
        dfsAssign(telemetryEntry.values[index],{
            "key": key,
            "name": eval('`' + userMetadata.range.name + '`'),
            "hints": {"range": index+1}
        });
    });

    telemetryEntry.values.push(userMetadata.domain);
    return dictionary;
}

/**
 * Copy the values of all of the enumerable own properties from a source objects to a target object. Returns the target
 * object. Unlike the classical Object.assign(), this function performs a deep copy of the fields.
 * @param {object} target The target JS object to copy to.
 * @param {object} source The source JS object from which to copy properties.
 * @returns {object} target.
 */
function dfsAssign (target, source) {
    let traversal = function (refParent,otherParent,key) {
        otherParent[key] = refParent[key];
    };
    JSpairParse(source,target,traversal);
    return target;
}

/**
 * Traverses two JavaScript Objects in parallel, calling for each common member a callback function passed as an input parameter.
 * @param {object} refObj A valid JS object.
 * @param {object} otherObj A valid JS object.
 * @param {function} traversal A function that transforms the results. This function is called for each member of the object.
 * If a member contains nested objects, the nested objects are transformed before the parent object is.
 */
function JSpairParse (refObj, otherObj, traversal) {
    Object.keys(refObj).forEach((key) => {
        if (otherObj.hasOwnProperty(key)) {
            if (typeof(refObj[key]) == "object") {
                JSpairParse(refObj[key],otherObj[key],traversal);
            } else {
                traversal(refObj,otherObj,key);
            }
        }
    });
}
