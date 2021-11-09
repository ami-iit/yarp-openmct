"use strict";

// Import the configuration
let config = require('../config/default');

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
    return eval('`' + quoteDelimitedTemplateLiteral + '`');
}.bind(config);

// Process the imported config
let processedConfig = traverse(config);

/**
 * Traverses the object <key:value> pairs in a DFS (Deep First Search) pattern, evaluating any used variable in the
 * <value> string instantiated as ${this.key1.key2...keyN} where:
 * - "this" is the root object "config",
 * - "key1.key2...keyN" is the path to the nested field defining the variable.
 *
 * @param nestedObject
 * @returns nestedOject
 */
function traverse (nestedObject) {
    Object.keys(nestedObject).forEach((k) => {
        switch(typeof nestedObject[k]) {
            case "object":
                nestedObject[k] = traverse(nestedObject[k]);
                break;
            case "number":
                nestedObject[k] = Number(templateLiteralEvalof(nestedObject[k]));
                break;
            case "string":
                nestedObject[k] = String(templateLiteralEvalof(nestedObject[k]));
                break;
            case "boolean":
                nestedObject[k] = Boolean(templateLiteralEvalof(nestedObject[k]));
                break;
            default:
                throw('Unsupported value type in nested object!');
        }
    }, nestedObject);
    return nestedObject;
}


// Export processed config
module.exports = processedConfig;
