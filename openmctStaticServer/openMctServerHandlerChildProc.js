"use strict";

// Import comon properties for OpenMctServerHandlerParentProc and OpenMctServerHandlerChildProc
const OpenMctServerHandlerBase = require('../common/openMctServerHandlerBase');

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
    if (process.connected) {
        process.send(message);
    }
}

module.exports = OpenMctServerHandlerChildProc;
