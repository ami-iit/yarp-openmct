"use strict";

// Import utilities for working with file and directory paths.
const path = require('path');

function OpenMctServerHandler(outputCallback) {
    // Create a child process spawn for later setting the NVM version and running the server
    this.childProcess = require('child_process');
    this.processHandle = null;
    this.outputCallback = outputCallback;
    this.nvmVars = {};
}

OpenMctServerHandler.prototype.setNvmVersion = function (nvmVersion) {
    if (typeof nvmVersion != 'string') {
        this.outputCallback('NVM version must be a string.');
    }

    // Build the string of shell commands
    const homeDir = process.env.HOME;
    const cmdString =
        '. ' + path.join(process.env.NVM_DIR, 'nvm.sh') + ' 1> /dev/null ' +     // Load the NVM function script
        '&& nvm use ' + nvmVersion + ' 1> /dev/null ' +                          // Set the NVM version
        '&& echo {\\"NVM_INC\\":\\"$NVM_INC\\", \\"NVM_CD_FLAGS\\":\\"$NVM_CD_FLAGS\\", \\"NVM_BIN\\":\\"$NVM_BIN\\"}'; // Return the updated NVM path (env. variables)
    try {
        const stdout = this.childProcess.execSync(cmdString, {shell: 'bash', timeout: 3000});
        this.nvmVars = JSON.parse(stdout.toString());
        this.nvmVersion = nvmVersion;
        return {status: 'OK', message: 'Updated NVM config in spawned shell: ' + stdout.toString() + '\n'};
    } catch (error) {
        this.nvmVersion = 'default';
        return {status: 'ERROR', message: 'command "nvm use version" failed!'};
    }
}

OpenMctServerHandler.prototype.start = function () {
    // Check if the server is already running
    if (this.isOn()) {
        return {status: 'WARNING', msg: 'OpenMCT server already running.'};
    } else {
        const embeddedThis = this;
        // Start the process
        const execPath = path.join(process.cwd(), '..', 'openmctStaticServer');
        let npmStart = this.childProcess.spawn('npm', ['start'],{shell: 'bash', cwd: execPath);
        // Set the output callbacks
        npmStart.stdout.on('data', function (data) {
            this.outputCallback('stdout: ' + data);
        });
        npmStart.stderr.on('data', function (data) {
            this.outputCallback('stderr: ' + data);
        });
        npmStart.on('error', function (error) {
            this.outputCallback('error: ' + error.message);
        });
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
