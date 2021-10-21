function OpenMctServerHandlerBase(outputCallback,errorCallback) {
    this.outputCallback = outputCallback;
    this.errorCallback = errorCallback;
    this.processPID = undefined;
}

// Ready States
OpenMctServerHandlerBase.prototype.RUNNING = 0;
OpenMctServerHandlerBase.prototype.CLOSING = 1;

module.exports = OpenMctServerHandlerBase;
