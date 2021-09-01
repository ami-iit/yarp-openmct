"use strict";

function PingHandler() {
    // Create a child process spawn for executing shell commands
    this.spawn = require('child_process').spawn;
    this.processHandle = null;
    // Create a parser
    this.querystring = require('querystring');
}

PingHandler.prototype.start = function (period,targetHost,onStdout,onStderr,onError,onClose) {
    if (this.isOn()) {
        return {status: 'WARNING', err: 'ping session already ongoing.'};
    }
    else {
        const embeddedThis = this;
        // Start the process
        let ping = this.spawn('ping', ['-i', period.toString(), targetHost]); // "ping" with 1s delay between ICMPs
        // Set the output callbacks
        ping.stdout.on('data', function (data) {
            let parsedData = embeddedThis.querystring.parse(data.toString(),' ','=');
            let parsedKeySet = new Set(Object.keys(parsedData));
            if (parsedKeySet.has('time')) {
                onStdout(parsedData.time);
            }
            else {
                onStdout('-1');
            }
        });
        ping.stderr.on('data', onStderr);
        ping.on('error', onError);
        ping.on('close', function (code) {
            embeddedThis.processHandle = null;
            onClose(code);
        });

        this.processHandle = ping;
        return {status: 'OK', err: 'Process started.'};
    }
}

PingHandler.prototype.stop = function () {
    this.processHandle.kill();
    return {status: 'OK', err: 'Process stopping...'};
}

PingHandler.prototype.isOn = function () {
    return (this.processHandle != null);
}

module.exports = function () {
    return new PingHandler();
};
