function OpenMctServerHandlerBase(outputCallback,errorCallback) {
    this.outputCallback = outputCallback;
    this.errorCallback = errorCallback;
    this.processPID = undefined;
}

// Ready States
OpenMctServerHandlerBase.prototype.RUNNING = 0;
OpenMctServerHandlerBase.prototype.CLOSING = 1;

// Supported Child->Parent commands
class Child2ParentCommands {
    static RefreshRegexpConnections = 0;
}
class Parent2ChildReplies {
    static RefreshRegexpConnectionsCompleted = 0;
    static RefreshRegexpConnectionsFailed = 1;
}
Object.freeze(Child2ParentCommands);

module.exports = {
    OpenMctServerHandlerBase,
    Child2ParentCommands,
    Parent2ChildReplies
};
