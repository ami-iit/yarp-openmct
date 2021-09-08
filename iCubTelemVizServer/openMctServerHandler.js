"use strict";

function OpenMctServerHandler(outputCallback) {
    // Create a child process spawn for later setting the NVM version and running the server
    this.childProcess = require('child_process');
    this.processHandle = null;
    this.outputCallback = outputCallback;
}

OpenMctServerHandler.prototype.setNvmVersion = function (nvmVersion) {
    if (typeof nvmVersion != 'string') {
        this.outputCallback('NVM version must be a string.');
    }

    // Switch the NVM version
    let ret = this.childProcess.spawnSync('nvm',['use',nvmVersion],{cwd:[process.cwd()+'/../openmctStaticServer'],timeout:3000});
    if (ret.signal) {
        return {status: ret.status, message: ['exited with signal '+ret.signal]};
    }
    if (ret.error != undefined) {
        return {status: ret.status, message: ['error: '+ret.error.message]};
    }
    if (ret.stderr.length > 0) {
        return {satus: ret.status, message: ['stderr: '+ret.stderr]};
    }
    this.nvmVersion = nvmVersion;
    return {status: ret.status, message: ['stdout: '+ret.stdout]};
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

module.exports = function (outputCallback) {
    return new OpenMctServerHandler(outputCallback);
}
