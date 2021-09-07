"use strict";

function OpenMctServerHandler(outputCallback) {
    // Create a child process spawn for setting the NVM version and running the server
    if (typeof nvmVersion != 'string') {
        outputCallback('NVM version must be a string.');
    }
    this.childProcess = require('child_process');
    this.processHandle = null;
    this.outputCallback = outputCallback;
}

OpenMctServerHandler.prototype.setNVMversion = function (nvmVersion) {
    // Switch the NVM version
    let {status,stdout,stderr,signal,error} = this.childProcess.spawnSync('nvm',['use',nvmVersion],{cwd:'../openmctStaticServer',timeout:3000});
    if (signal) {
        return {status: status, message: 'exited with signal ${signal}'};
    }
    if (error) {
        return {status: status, message:'error: ${error.message}'};
    }
    if (stderr) {
        return {satus: status, message: 'stderr: ${stderr}'};
    }
    this.nvmVersion = nvmVersion;
    return {status: status, message: 'stdout: ${stdout}'};
}

OpenMctServerHandler.prototype.start = function () {
    if (this.isOn()) {
        return {status: 'WARNING', msg: 'OpenMCT server already running.'};
    }
    else {
        const embeddedThis = this;
        // Start the process
        let npmStart = this.childProcess.spawn('npm', ['start']);
        // Set the output callbacks
        npmStart.stdout.on('data', function (data) {this.outputCallback('stdout: ' + data);});
        npmStart.stderr.on('data', function (data) {this.outputCallback('stderr: ' + data);});
        npmStart.on('error', function (error) {this.outputCallback('error: ' + error.message);});
        npmStart.on('close', function (code) {
            embeddedThis.processHandle = null;
            this.outputCallback('close: ' + code);
        });

        this.processHandle = npmStart;
        return {status: 'OK', msg: 'Process started.'};
    }
}

OpenMctServerHandler.prototype.stop = function () {
    this.processHandle.kill();
    return {status: 'DELAYED_REPLY', msg: 'Process stopping...'};
}

OpenMctServerHandler.prototype.isOn = function () {
    return (this.processHandle != null);
}

module.exports = function () {
    return new OpenMctServerHandler();
}
