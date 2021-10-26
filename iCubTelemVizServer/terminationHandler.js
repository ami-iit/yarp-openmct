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
    this.runSubsetA(signal);
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
    closeChildProcessPromise.then(
        function(value) {
            console.log(value);
            this.runSubsetB();
        }.bind(this),
        function(error) { console.error(error.toString()); }
    );
}

TerminationHandler.prototype.runSubsetB = function() {
    /*
     * === Closure subset B ===
     * B.1 - Stop listening to client requests ("subscribe"/"unsubscribe" events) on the existing connections.
     */
     this.telemServerTracker.pauseAll();
}

module.exports = TerminationHandler;
