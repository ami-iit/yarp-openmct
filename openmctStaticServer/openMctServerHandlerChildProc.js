"use strict";

// Import comon properties for OpenMctServerHandlerParentProc and OpenMctServerHandlerChildProc
const {OpenMctServerHandlerBase,Child2ParentCommands,Parent2ChildReplies} = require('../common/openMctServerHandlerBase');

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
    if (!process.connected) {
        console.warn(`Could not send message. Connection lost with the parent process!`);
        return false;
    }
    return process.send(message);
}

// Data and commands messaging to the parent process
OpenMctServerHandlerChildProc.prototype.reportPIDtoParent = function () {
    this.messageParentProcess({"pid": process.pid});
}

OpenMctServerHandlerChildProc.prototype.requestPortsRefresh = function () {
    return new Promise(function (resolve, reject) {
        process.once('message', function (m) {
            console.log(`[ICUB-TELEM-VIZ SERVER] message: ${JSON.stringify(m)}`);
            if (!("rply" in m)) {
                reject(`Can't parse IPC reply`);
            } else {
                switch (m.rply) {
                    case Parent2ChildReplies.RefreshRegexpConnectionsCompleted:
                        resolve('Ports refreshing completed!');
                        break;
                    case Parent2ChildReplies.RefreshRegexpConnectionsFailed:
                        reject(`Ports refreshing Failed`);
                        break;
                    default:
                }
            };
        });
        if (!this.messageParentProcess({"cmd": Child2ParentCommands.RefreshRegexpConnections})) {
            reject('Could not send request for refreshing ports!');
        } else {
            console.log('Request for refreshing ports sent successfully');
        }
    }.bind(this));
}

module.exports = OpenMctServerHandlerChildProc;
