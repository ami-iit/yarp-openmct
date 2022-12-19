"use strict";

const {evalTemplateLiteralInJSON} = require ('../common/utils');
const YarpNameListHandler = require ('../common/yarpNameListHandler');

function ConfigHandler(configFile) {
    this.config = require(configFile);
    this.config = evalTemplateLiteralInJSON(this.config);
    this.regexpMatchedPortInConfig = undefined;
    this.activeYarpPorts = undefined;
    this.yarpNameListHdl = new YarpNameListHandler();
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
    let regexpPortIDs = this.getRegexpPortEntries();
    if (regexpPortIDs.length == 0) {
        return Promise.resolve(
            this.regexpMatchedPortInConfig = JSON.parse(JSON.stringify(this.config.portInConfig))
        );
    }
    return this.getActiveYarpPorts().then(function (yarpPortNames) {
        this.activeYarpPorts = yarpPortNames;
        return this.regexpMatchedPortInConfig = this.matchRegexp(regexpPortIDs,yarpPortNames);
    }.bind(this));
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

/**
 * Runs a system command listing the Yarp active ports: "yarp name list", and returns that
 * list.
 */
ConfigHandler.prototype.getActiveYarpPorts = function() {
    let rplyBuffer = Buffer.from('');

    // Define the output callbacks
    let onStdout = function (stdoutChunk) {
        rplyBuffer = Buffer.concat([rplyBuffer,stdoutChunk]);
    };
    let onStdinf = function (info) {
        console.debug('info:' + info);
    };
    let onStderr = function (data) {
        console.error('stderr: ' + data);
    };

    return this.yarpNameListHdl.run('',onStdout,onStdinf,onStderr).then((resultCode) => {
        console.debug(`Yarp port names retrieval completed successfully (${resultCode})`);
        return rplyBuffer.toString().split(/\n/).filter((line) => {
            return line.startsWith("registration name");
        }).map((line) => {
            return line.split(' ')[2];
        });
    }).catch((errorMessage) => {
        console.error(`Failed running Yarp port names retrieval: ${errorMessage}./n
        returning empty array of ports`);
        return [];
    });
}

/**
 * Match the `regexpPortIDs` from the ports configuration with the active Yarp ports list and
 * return the result.
 *
 * @param {string[]} regexpPortIDs - array of keys indexing Yarp ports defined through a regexp.
 * @param {string[]} activeYarpPortNames - active remote Yarp ports.
 * @return {object} - port configuration list with matched Yarp remote ports.
 */
ConfigHandler.prototype.matchRegexp = function(regexpPortIDs, activeYarpPortNames) {
    let regexpMatchedPortInConfig = JSON.parse(JSON.stringify(this.config.portInConfig));
    regexpPortIDs.forEach((id) => {
        let regexpPattern = new RegExp(regexpMatchedPortInConfig[id].yarpName.match(/^@{(?<thePattern>.+)}$/i).groups.thePattern,"i");
        let matchedPorts = activeYarpPortNames.filter((name) => {
            return (name.match(regexpPattern) !== null);
        });
        if (matchedPorts.length == 0) {
            console.warn(`Yarp port name regexp ${regexpMatchedPortInConfig[id].yarpName} does not match any existing ports`);
            delete regexpMatchedPortInConfig[id];
            return;
        }
        if (matchedPorts.length > 1) {
            console.warn(`Yarp port name regexp ${regexpMatchedPortInConfig[id].yarpName} has multiple matches, kept the first match.`);
        }
        regexpMatchedPortInConfig[id].yarpName = matchedPorts[0];
    });

    return regexpMatchedPortInConfig;
}

module.exports = ConfigHandler;
