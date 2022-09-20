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
    let regexpPortNames = this.getRegexpPortEntries();
    if (regexpPortNames.length == 0) {
        return this.regexpMatchedPortInConfig = {};
    }
    return this.getActiveYarpPorts().then((yarpPortNames) => {
        this.activeYarpPorts = yarpPortNames;
    });
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
    });
}

module.exports = ConfigHandler;
