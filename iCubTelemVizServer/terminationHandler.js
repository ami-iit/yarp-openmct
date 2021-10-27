"use strict";

function TerminationHandler(
  openMctServerHandler,
  telemServer,telemServerTracker,
  consoleServer,consoleServerTracker) {
    this.openMctServerHandler = openMctServerHandler;
    this.telemServer = telemServer;
    this.telemServerTracker = telemServerTracker;
    this.consoleServer = consoleServer;
    this.consoleServerTracker = consoleServerTracker;
}

TerminationHandler.prototype.run = function(signal) {
    console.log('Received '+signal+' ...');
    this.runSubsetA(signal).closeChildProcess.then(this.runSubsetB).catch(console.error);
}

TerminationHandler.prototype.runSubsetA = function (signal) {
    /*
     * === Closure subset A ===
     * A.1 - Stop the child Node.js process running the OpenMCT static server.
     * A.2 - Stop the Telemetry HTTP server telemServer from accepting new connections.
     * A.3 - Stop the Control Console HTTP server consoleServer from accepting new connections.
     */
    const closeChildProcessPromise = new Promise(function(resolve,reject) {
        let ret = this.openMctServerHandler.stop(signal,resolve,reject);
        console.log(ret);
    }.bind(this));
    const closeTelemServerPromise = new Promise(function(resolve,reject) {
        this.telemServer.close((error) => {
            if (error === undefined) {
                resolve('iCub Telemetry Server closed: all sockets closed.');
            } else {
                reject(error);
            }
        });
        console.log('iCub Telemetry Server closing: no further connection requests accepted.');
    }.bind(this));
    const closeConsoleServerPromise = new Promise(function(resolve,reject) {
        this.consoleServer.close((error) => {
            if (error === undefined) {
                resolve('Control Console Server closed: all sockets closed.');
            } else {
                reject(error);
            }
        });
        console.log('Control Console Server closing: no further incoming requests accepted.');
    }.bind(this));

    // Return the promises
    return {
        closeChildProcess: closeChildProcessPromise,
        closeServers: Promise.all([closeTelemServerPromise,closeConsoleServerPromise])
    };
}

TerminationHandler.prototype.runSubsetB = function(resValue) {
    /*
     * === Closure subset B ===
     * B.1 - Stop listening to client requests ("subscribe"/"unsubscribe" events) on the existing connections.
     */
     console.log(resValue);              // consume resolve value from previous promise
     this.telemServerTracker.pauseAll(); // Stop listening to client requests
     return Promise.resolve('Stop listening to "subscribe"/"unsubscribe" client requests');
}

module.exports = TerminationHandler;
