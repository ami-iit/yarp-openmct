"use strict";

// Import utilities for working with file and directory paths.
const path = require('path');
// Create a child process spawn for later setting the NVM version and running the server
const childProcess = require('child_process');
// Import comon properties for OpenMctServerHandlerParentProc and OpenMctServerHandlerChildProc
const {OpenMctServerHandlerBase,Child2ParentCommands} = require('../common/openMctServerHandlerBase');
// Format the output like printf
const util = require('util');
// Handle errors
var assert = require('assert');
// Signal Event values
const signalName2exitCodeMap = require('../common/utils').signalName2exitCodeMap;

function OpenMctServerHandlerParentProc(outputCallback,errorCallback) {
    // Old Javascript inheritance: Apply the "parent" class OpenMctServerHandlerBase
    // constructor to "this"
    OpenMctServerHandlerBase.call(this,outputCallback,errorCallback);
    // Callback to be set by OpenMctServerHandlerParentProc.stop() function call
    this.onCloseSuccess = (messageString) => {
        this.outputCallback('Untriggered closure: ' + messageString);
    };
    this.onCloseFailure = (errorObject) => {
        this.errorCallback('Untriggered closure: ' + errorObject.toString());
    };
    this.refreshPortsNconnections = () => {};
    this.npmStart = undefined;
}

// Old Javascript inheritance: inherit all of OpenMctServerHandlerBase'methods
OpenMctServerHandlerParentProc.prototype = new OpenMctServerHandlerBase();
OpenMctServerHandlerParentProc.prototype.constructor = OpenMctServerHandlerParentProc;

OpenMctServerHandlerParentProc.prototype.installRefreshPorts = function (refreshPortsNconnectionsCB) {
    this.refreshPortsNconnections = refreshPortsNconnectionsCB;
}

OpenMctServerHandlerParentProc.prototype.start = function () {
    // Check if the server is already running
    if (this.isOn()) {
        return {status: 'WARNING', message: 'OpenMCT server already running.'};
    }

    // Inside the callbacks, for 'this' to be the 'OpenMctServerHandlerParentProc' object instead of the
    // callback caller, we need to back it up.
    const embeddedThis = this;

    // Start the process
    const wPath = path.join(process.cwd(), '..', 'openmctStaticServer');
    this.npmStart = childProcess.spawn('sh', ['runModule.sh'], {
        shell: 'bash',
        cwd: wPath,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    // Set the output callbacks
    this.npmStart.stdout.on('data', function (data) {
        embeddedThis.outputCallback('[OPEN-MCT STATIC SERVER] stdout: ' + data);
    });
    this.npmStart.stderr.on('data', function (data) {
        embeddedThis.outputCallback('[OPEN-MCT STATIC SERVER] stderr: ' + data);
    });
    this.npmStart.on('error', function (error) {
        embeddedThis.outputCallback('[OPEN-MCT STATIC SERVER] error: ' + error.message);
    });
    this.npmStart.on('message', function (m) {
        embeddedThis.outputCallback('[OPEN-MCT STATIC SERVER] ipc: ' + JSON.stringify(m));
        Object.keys(m).forEach((k) => {
            switch (k) {
                case "pid":
                    embeddedThis.processPID = m.pid;
                    break;
                case "cmd":
                    switch (m.cmd) {
                        case Child2ParentCommands.RefreshRegexpConnections:
                            embeddedThis.refreshPortsNconnections();
                            break;
                        default:
                    }
                    break;
                default:
                    embeddedThis.outputCallback(`[OPEN-MCT STATIC SERVER] ipc: Don't know how to parse IPC message!`);
            }
        });
    });
    this.npmStart.on('close', function (code,signal) {
        embeddedThis.processPID = undefined;
        // Call local or synchronisation callback
        try {
            switch ([code, signal].toString()) {
                case [0, null].toString():
                case [signalName2exitCodeMap('SIGQUIT'), null].toString():
                case [signalName2exitCodeMap('SIGTERM'), null].toString():
                case [signalName2exitCodeMap('SIGINT'), null].toString():
                    embeddedThis.onCloseSuccess('normalExit: [OPEN-MCT STATIC SERVER] on close: ' + code + ', signal: ' + signal);
                    break;
                case [null, null].toString():
                    throw 'unexpectedExitCondition';
                case [code,null].toString():
                    throw 'uncaughtOrInternalError';
                case [null,signal].toString():
                    throw 'uncaughtSignalExit';
                default:
                    throw 'unexpectedExitCondition';
            }
        } catch (errName) {
            let err = new Error('[OPEN-MCT STATIC SERVER] on close: ' + code + ', signal: ' + signal, {cause: [code, signal]});
            err.name = errName;
            embeddedThis.onCloseFailure(err);
        }
    });

    return {status: 'OK', message: 'Opem-MCT static server process started.'};
}

OpenMctServerHandlerParentProc.prototype.stop = function (signal,onCloseSuccess,onCloseFailure) {
    // Handle programming error. Can happen only during dev/debug, so just throw a fatal error.
    assert(
        typeof onCloseSuccess == "function" && typeof onCloseFailure == "function",
        new TypeError('Input callback is not a function!')
    );
    if (this.isOn()) {
        this.onCloseSuccess = onCloseSuccess;
        this.onCloseFailure = onCloseFailure;
        process.kill(this.processPID,signal);
        this.npmStart = undefined;
        return {status: 'WRPLY', message: util.format('Process (PID %d) OpenMCT Server stopping (signal %s) ...',this.processPID,signal)};
    } else {
        onCloseSuccess('');
        this.npmStart = undefined;
        return {status: 'WARNING', message: 'No process OpenMCT Server running...'};
    }
}

OpenMctServerHandlerParentProc.prototype.isOn = function () {
    return (this.processPID !== undefined);
}

// Method for sending messages to the child process through IPC only if there is one
OpenMctServerHandlerParentProc.prototype.messageChildProcess = function (message) {
    if (!this.npmStart.connected) {
        console.warn(`Could not send message. Connection lost with the child process!`);
        return false;
    }
    return this.npmStart.send(message);
}

module.exports = OpenMctServerHandlerParentProc;
