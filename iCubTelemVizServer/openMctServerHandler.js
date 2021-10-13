"use strict";

// Import utilities for working with file and directory paths.
const path = require('path');

function OpenMctServerHandler(outputCallback) {
    // Create a child process spawn for later setting the NVM version and running the server
    this.childProcess = require('child_process');
    this.processPID = undefined;
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
    const wPath = path.join(process.cwd(), '..', 'openmctStaticServer');
    const npmStart = this.childProcess.spawn('sh', ['runModule.sh'], {shell: 'bash', cwd: wPath, stdio: ['pipe','pipe','pipe','ipc']});

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

OpenMctServerHandler.prototype.stop = function (signal) {
    if (this.isOn()) {
        process.kill(this.processPID,signal);
        console.log('Killing PID %d with signal %s',this.processPID,signal);
        return {status: 'WRPLY', message: 'Process OpenMCT Server stopping...'};
    } else {
        return {status: 'WARNING', message: 'No process OpenMCT Server running...'};
    }
}

OpenMctServerHandler.prototype.isOn = function () {
    return (this.processPID !== undefined);
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
