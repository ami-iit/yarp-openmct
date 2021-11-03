"use strict";

function TerminationHandler(
  openMctServerHandler,
  telemServer,telemServerTracker,
  consoleServer,consoleServerTracker,
  icubtelemetry) {
    this.openMctServerHandler = openMctServerHandler;
    this.telemServer = telemServer;
    this.telemServerTracker = telemServerTracker;
    this.consoleServer = consoleServer;
    this.consoleServerTracker = consoleServerTracker;
    this.icubtelemetry = icubtelemetry;
}

TerminationHandler.prototype.run = function(signal) {
    console.log('Received '+signal+' ...');
    let subsetApromise = this.runSubsetA(signal);
    let subsetCpromise = subsetApromise.closeChildProcess.then(
      this.runSubsetB.bind(this)).then(
        this.runSubsetC.bind(this));
    Promise.all([subsetCpromise,subsetApromise.closeServers]).then(
        function(values) { values.forEach((v) => console.log(v)); }
      ).catch(console.error);
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
        console.log('Control Console Server closing: no further connection requests accepted.');
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
     * B.2 - Close the YARP ports connections associated to the telemetry entries in `portInConfig` and instantiated by the main Node.js process.
     * B.3 - Stop reading the respective YARP ports (similar to turning off the port listeners).
     * B.4 - Stop sending "real-time telemetry data" messages (notifications) to subscribers.
     */
     console.log(resValue);              // consume resolve value from previous promise (synch operation)
     this.telemServerTracker.pauseAll(); // Stop listening to client requests (synch operation)
     console.log('iCub Telemetry Server closing: no further "subscribe"/"unsubscribe" requests accepted.');
     this.unlistenToNetworkPorts.forEach((disconnect) => { disconnect(); }); // Disconnect all telemetry entries (asynch operation)
     console.log('iCub Telemetry Server closing: disconnected network ports.');
     this.icubtelemetry.stopNotifier();
     return Promise.resolve('Data transmission ended.');
}

TerminationHandler.prototype.runSubsetC = function(resValue) {
  /*
   * === Closure subset C ===
   * Here we assume all data transmission is completed.
   * C.1 - Close all websockets.
   */
  console.log(resValue);
  this.telemServerTracker.closeAll();
  this.consoleServerTracker.closeAll();
  return Promise.resolve('Closing all Telemetry Server and Control Console sockets!');
}

TerminationHandler.prototype.unlistenToNetworkPorts = [];

module.exports = TerminationHandler;
