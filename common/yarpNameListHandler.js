"use strict";

function YarpNameListHandler() {
    // Create a child process spawn for executing shell commands
    this.spawn = require('child_process').spawn;
    this.yarpNameListprocHdl = null;
    // Create a parser
    this.querystring = require('querystring');
}

YarpNameListHandler.prototype.run = function (prefix,onStdout,onStdinf,onStderr) {
    if (this.isOn()) {
        return Promise.reject('Yarp command already running!');
    } else {
        return new Promise(function (resolve,reject) {
            // Spawn the command process asynchronously
            let procHdl = this.spawn('yarp', ['name', 'list', prefix.toString()]);
            // Set the output callbacks
            procHdl.stdout.on('data', function (data) {
                onStdout(data);
            });
            procHdl.stderr.on('data', onStderr);
            procHdl.on('spawn', function (code) {
                this.yarpNameListprocHdl = procHdl;
                onStdinf('Yarp command successfully started...');
            }.bind(this));
            procHdl.on('error', function (error) {
                reject(error);
            });
            procHdl.on('close', function (code) {
                this.yarpNameListprocHdl = null;
                resolve(code);
            }.bind(this));
        }.bind(this));
    }
}

YarpNameListHandler.prototype.kill = function () {
    this.yarpNameListprocHdl.kill();
    return {status: 'DELAYED_REPLY', err: 'Process stopping...'};
}

YarpNameListHandler.prototype.isOn = function () {
    return (this.yarpNameListprocHdl != null);
}

module.exports = YarpNameListHandler;
