"use strict";

/**
 * Signal string to code conversion from the POSIX standard
 *
 *      1       HUP (hang up)
 *      2       INT (interrupt)
 *      3       QUIT (quit)
 *      6       ABRT (abort)
 *      9       KILL (non-catchable, non-ignorable kill)
 *      14      ALRM (alarm clock)
 *      15      TERM (software termination signal)
 */

const signalName2codeMap = {
    SIGHUP :  1,
    SIGINT :  2,
    SIGQUIT:  3,
    SIGABRT:  6,
    SIGKILL:  9,
    SIGALRM:  14,
    SIGTERM:  15
};

/**
 * Signal Exits codes
 *
 * (Refer to https://nodejs.org/api/process.html#exit-codes)
 *
 * @param {string} signalName - 'SIGINT', 'SIGQUIT', 'SIGTERM', ...
 * @returns {number} Signal Exits (>128): If Node.js receives a fatal signal such as SIGKILL or SIGHUP, then its
 * exit code will be 128 plus the value of the signal code. This is a standard POSIX practice, since exit codes are
 * defined to be 7-bit integers, and signal exits set the high-order bit, and then contain the value of the signal
 * code. For example, signal SIGABRT has value 6, so the expected exit code will be 128 + 6, or 134.
 */
function signalName2exitCodeMap (signalName) {
    return 128+signalName2codeMap[signalName];
}

/**
 * A counter
 */
function MyCounter () {
    this.counter = 0;
    this.incr = () => {this.counter += 1; return this.counter};
    this.decr = () => {this.counter -= 1; return this.counter};
    this.reset = () => {this.counter= 0};
}

/**
 * Returns a string which evaluation defines a variable and sets its value to the stringified JSON object. This
 * function produces the same result as what would be expected from `res.jsonp` (refer to
 * https://expressjs.com/en/5x/api.html#res.jsonp).
 *
 * @param {object} jsonObject - input object to stringify.
 * @param {string} objectName - JSON string name in the scope where the eventual script is run.
 * @return {string} - script to be eventually run on a remote machine.
 */
function jsonExportScript (jsonObject,objectName) {
    return `const ${objectName} = ${JSON.stringify(jsonObject)}`;
}

/**
 * Traverses the root object "jsonObjectWithTemplateLiterals", evaluating any used variable in the
 * <value> string instantiated as ${this.key1.key2...keyN} where:
 * - "this" is the root object,
 * - "key1.key2...keyN" is the path to the nested field defining the variable.
 *
 * @param {object} jsonObjectWithTemplateLiterals
 * @returns {object} evaluatedRootOject
 */
function evalTemplateLiteralInJSON(jsonObjectWithTemplateLiterals, ...args) {
    /**
     * Set variable arguments
     */
    if (args.length > 0) {
       var inVars = args[0];
    }

    /**
     * Performs string interpolation in strings, by using string interpolation in Template literals [1], and the eval
     * function [2].
     * [1]: https://www.w3schools.com/js/js_string_templates.asp
     * [2]: https://www.w3schools.com/jsref/jsref_eval.asp
     *
     * `${aVariable} is the value of "aVariable"` --> '40 is the value of "aVariable"'
     *
     * @param {string} quoteDelimitedTemplateLiteral - a Template literal delimited by simple quotes instead of back quotes.
     * @returns {string} - the resulting string after string interpolation has been performed.
     */
    const templateLiteralEvalof = function (quoteDelimitedTemplateLiteral) {
        let interpolatedString = eval('`' + quoteDelimitedTemplateLiteral + '`').replace(/^"/,"").replace(/"$/,"");
        let out;
        try {
            out = JSON.parse(interpolatedString);
        }
        catch {
            out = interpolatedString;
        }
        return out;
    }.bind(jsonObjectWithTemplateLiterals);

    /**
     * Traverses the nested object <key:value> pairs in a DFS (Deep First Search) pattern, evaluating any used variable in the
     * <value> string instantiated as ${this.key1.key2...keyN} where:
     * - "this" is the root object "jsonObjectWithTemplateLiterals",
     * - "key1.key2...keyN" is the path to the nested field defining the variable.
     *
     * @param {object} nestedObject - Javascript object to perform a DFS on and keep evaluating.
     * @returns {object} - evaluated nested object.
     */
    function traverse(nestedObject) {
        Object.keys(nestedObject).forEach((k) => {
            switch (typeof nestedObject[k]) {
                case "object":
                    nestedObject[k] = traverse(nestedObject[k]);
                    break;
                case "string":
                    if (nestedObject[k].includes("$")) {
                        nestedObject[k] = templateLiteralEvalof(nestedObject[k]);
                    }
                    break;
                case "boolean":
                case "number":
                    break;
                default:
                    throw('Unsupported value type in nested object!');
            }
        }, nestedObject);
        return nestedObject;
    }

    return traverse(jsonObjectWithTemplateLiterals);
}

/**
 * Generates the values template blocks (generatedValuesBase) from the parameters in valuesTemplateGeneratorParams.
 * @type {{MyCounter: MyCounter, jsonExportScript: (function(Object, string): string), signalName2exitCodeMap: (function(string)), signalName2codeMap: {SIGQUIT: number, SIGINT: number, SIGALRM: number, SIGHUP: number, SIGABRT: number, SIGTERM: number, SIGKILL: number}, evalTemplateLiteralInJSON: (function(Object): Object)}}
 */
function expandTelemetryDictionary(dictionary2expand) {
    // Run a first interpolation
    let interpolatedDictionary2expand = JSON.parse(JSON.stringify(dictionary2expand));
    evalTemplateLiteralInJSON(interpolatedDictionary2expand);
    let jointStateParams = interpolatedDictionary2expand.valuesTemplateGeneratorParams.jointState;
    // Convert literals #{} to ${}
    let valuesTemplate = JSON.parse(JSON.stringify(jointStateParams.valuesTemplate).replace(/#/g,"$"));

    Object.keys(interpolatedDictionary2expand.generatedValuesBase.jointState).forEach((bodyPart) => {
        // Generate all value keys combinations of format "value.${modKey}.${jointKey}".
        let valueIndex = 0;
        let valueKeyIndexArray = Object.keys(jointStateParams.mods).reduce((concatArray,modKey) => {
            return concatArray.concat(jointStateParams.jointKeys[bodyPart].map((jointKey) => {
                valueIndex += 1;
                return [modKey,jointKey,valueIndex];
            }));
        },[]);

        // Generate the block for each key combination
        let values = valueKeyIndexArray.map((modKeyIndex) => {
            let [modKey,jointKey,rangeIndex] = modKeyIndex;
            let modValue = jointStateParams.mods[modKey];
            let jointName = jointKey.replace(/_/g," ");
            return evalTemplateLiteralInJSON(JSON.parse(JSON.stringify(valuesTemplate)),{"modKey": modKey, "jointKey": jointKey, "modValue": modValue, "jointName": jointName, "rangeIndex": rangeIndex});
        });

        dictionary2expand.generatedValuesBase.jointState[bodyPart] = values;
        dictionary2expand.generatedValuesBase.jointState[bodyPart].push(jointStateParams.timestampTemplate);
    });

    return dictionary2expand;
}

module.exports = {
    signalName2codeMap: signalName2codeMap,
    signalName2exitCodeMap: signalName2exitCodeMap,
    MyCounter: MyCounter,
    jsonExportScript: jsonExportScript,
    evalTemplateLiteralInJSON: evalTemplateLiteralInJSON,
    expandTelemetryDictionary: expandTelemetryDictionary
};
