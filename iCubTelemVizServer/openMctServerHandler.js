"use strict";

// Import utilities for working with file and directory paths.
const path = require('path');

function OpenMctServerHandler(outputCallback) {
    // Create a child process spawn for later setting the NVM version and running the server
    this.childProcess = require('child_process');
    this.processHandle = null;
    this.outputCallback = outputCallback;
}

OpenMctServerHandler.prototype.start = function () {
    // Check if the server is already running
    if (this.isOn()) {
        return {status: 'WARNING', message: 'OpenMCT server already running.'};
    }

    // Inside the callbacks, for 'this' to be the 'OpenMctServerHandler' object instead of the
    // callback caller, we need to back it up.
    const embeddedThis = this;

    // Start the process
    const execPath = path.join(process.cwd(), '..', 'openmctStaticServer');
    let npmStart = this.childProcess.spawn('npm', ['start'], {shell: 'bash', cwd: execPath});

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
    npmStart.on('close', function (code) {
        embeddedThis.processHandle = null;
        embeddedThis.outputCallback('[OPEN-MCT STATIC SERVER] close: ' + code);
    });

    this.processHandle = npmStart;
    return {status: 'OK', message: 'Opem-MCT static server process started.'};
}

OpenMctServerHandler.prototype.stop = function () {
    if (this.processHandle) {
        this.processHandle.kill();
        return {status: 'WRPLY', message: 'Process OpenMCT Server stopping...'};
    } else {
        return {status: 'WARNING', message: 'No process OpenMCT Server running...'};
    }
}

OpenMctServerHandler.prototype.isOn = function () {
    return (this.processHandle != null);
}

function spawnSynchInOpenMCTserverPath(childProcess, shellCommand, cmdArgs) {
    // Run a shell command from a child process in 'openmctStaticServer' folder working path.
    let ret = childProcess.spawnSync(shellCommand, cmdArgs, {shell: 'bash', cwd: process.cwd(), timeout: 3000});
    if (ret.signal) {
        return {success: false, cmdRet: {status: ret.status, message: ['exited with signal ' + ret.signal]}};
    } else if (ret.error !== undefined) {
        return {success: false, cmdRet: {status: ret.status, message: ['error: ' + ret.error.message]}};
    } else if (ret.stderr.length > 0) {
        return {success: false, cmdRet: {status: ret.status, message: ['stderr: ' + ret.stderr]}};
    } else {
        return {success: true, cmdRet: {status: ret.status, message: ['stdout: ' + ret.stdout]}};
    }
}

module.exports = function (outputCallback) {
    return new OpenMctServerHandler(outputCallback);
}
