"use strict";

const {evalTemplateLiteralInJSON} = require ('../common/utils');

function ConfigHandler(configFile) {
    this.config = require(configFile);
    this.config = evalTemplateLiteralInJSON(this.config);
    this.regexpMatchedPortInConfig = undefined;
}

/**
 * Retrieves from the ports configuration all the port names defined through a regular
 * expression and matches those to existing Yarp ports (Yarp ports are listed through
 * the command `yarp name list`.
 * Returns the array of resulting port names and also stores it in place.
 *
 * @returns {string[]} - array of matching Yarp port names.
 */
ConfigHandler.prototype.matchRegexpYarpPortNames = function() {
    let regexpPortNames = this.getRegexpPortEntries();
    if (regexpPortNames.length == 0) {
        return this.regexpMatchedPortInConfig = {};
    }
    return this.regexpMatchedPortInConfig;
}

/**
 * Returns the list of keys in `this.config.portInConfig` which index regexp port names.
 *
 * @returns {string[]} - array of keys indexing regexp port names.
 */
ConfigHandler.prototype.getRegexpPortEntries = function() {
    return Object.keys(this.config.portInConfig).filter((id) => {
        return (this.config.portInConfig[id].yarpName.match(/^\@\{.+\}$/i) !== null);
    });
}

module.exports = ConfigHandler;
