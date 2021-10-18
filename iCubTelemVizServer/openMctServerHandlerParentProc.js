"use strict";

// Import utilities for working with file and directory paths.
const path = require('path');
// Create a child process spawn for later setting the NVM version and running the server
const childProcess = require('child_process');
// Import comon properties for OpenMctServerHandlerParentProc and OpenMctServerHandlerChildProc
var OpenMctServerHandlerBase = require('../common/openMctServerHandlerBase');

function OpenMctServerHandlerParentProc(outputCallback) {
    // Old Javascript inheritance: Apply the "parent" class OpenMctServerHandlerBase
    // constructor to "this"
    OpenMctServerHandlerBase.call(this,outputCallback);
}

// Old Javascript inheritance: inherit all of OpenMctServerHandlerBase'methods
OpenMctServerHandlerParentProc.prototype = new OpenMctServerHandlerBase();
OpenMctServerHandlerParentProc.prototype.constructor = OpenMctServerHandlerParentProc;

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
    const npmStart = childProcess.spawn('sh', ['runModule.sh'], {
        shell: 'bash',
        cwd: wPath,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    // Set the output callbacks
    npmStart.stdout.on('data', function (data) {
        embeddedThis.outputCallback('[OPEN-MCT STATIC SERVER] stdout: ' + data);
    });
    npmStart.stderr.on('data', function (data) {
        embeddedThis.outputCallback('[OPEN-MCT STATIC SERVER] stderr: ' + data);
    });
    npmStart.on('error', function (error) {
        embeddedThis.outputCallback('[OPEN-MCT STATIC SERVER] error: ' + error.message);
    });
    npmStart.on('message', function (m) {
        embeddedThis.outputCallback('[OPEN-MCT STATIC SERVER] ipc: ' + JSON.stringify(m));
        embeddedThis.processPID = m.pid;
    });
    npmStart.on('close', function (code) {
        embeddedThis.processPID = undefined;
        embeddedThis.outputCallback('[OPEN-MCT STATIC SERVER] close: ' + code);
    });

    return {status: 'OK', message: 'Opem-MCT static server process started.'};
}

OpenMctServerHandlerParentProc.prototype.stop = function (signal) {
    if (this.isOn()) {
        process.kill(this.processPID,signal);
        console.log('Killing PID %d with signal %s',this.processPID,signal);
        return {status: 'WRPLY', message: 'Process OpenMCT Server stopping...'};
    } else {
        return {status: 'WARNING', message: 'No process OpenMCT Server running...'};
    }
}

OpenMctServerHandlerParentProc.prototype.isOn = function () {
    return (this.processPID !== undefined);
}

module.exports = function (outputCallback) {
    return new OpenMctServerHandlerParentProc(outputCallback);
}
