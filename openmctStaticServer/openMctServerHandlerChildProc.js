"use strict";

// Import comon properties for OpenMctServerHandlerParentProc and OpenMctServerHandlerChildProc
const {OpenMctServerHandlerBase,Child2ParentCommands} = require('../common/openMctServerHandlerBase');

function OpenMctServerHandlerChildProc(outputCallback) {
    // Old Javascript inheritance: Apply the "parent" class OpenMctServerHandlerBase
    // constructor to "this"
    OpenMctServerHandlerBase.call(this,outputCallback);
    this.processPID = process;
}

// Old Javascript inheritance: inherit all of OpenMctServerHandlerBase'methods
OpenMctServerHandlerChildProc.prototype = new OpenMctServerHandlerBase();
OpenMctServerHandlerChildProc.prototype.constructor = OpenMctServerHandlerChildProc;

// Method for sending messages to the parent process through IPC only if there is one
OpenMctServerHandlerChildProc.prototype.messageParentProcess = function (message) {
    if (!process.connected) {
        console.warn(`Could not send request for refreshing ports. Connection lost with the parent process!`);
        return false;
    }
    return process.send(message);
}

// Data and commands messaging to the parent process
OpenMctServerHandlerChildProc.prototype.reportPIDtoParent = function () {
    this.messageParentProcess({"pid": process.pid});
}

OpenMctServerHandlerChildProc.prototype.requestPortsRefresh = function () {
    if (!this.messageParentProcess({"cmd": Child2ParentCommands.RefreshRegexpConnections})) {
        return Promise.reject('Could not send request for refreshing ports. Connection lost with the parent process!');
    };
    return Promise.resolve('Request for refreshing ports sent successfully');
}

module.exports = OpenMctServerHandlerChildProc;
