function OpenMctServerHandlerBase(outputCallback) {
    this.outputCallback = outputCallback;
    this.processPID = undefined;
}

// Ready States
OpenMctServerHandlerBase.prototype.RUNNING = 0;
OpenMctServerHandlerBase.prototype.CLOSING = 1;

module.exports = OpenMctServerHandlerBase;
