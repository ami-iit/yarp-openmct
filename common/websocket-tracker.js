function WebsocketTracker(server) {
    this.server = server;
    this.sockets = new Map();
    server.on('connection',(socket) => {
        this.sockets.set(socket,true);
        console.log(`NEW CONNECTION!! (${this.sockets.size} sockets on ${this.server._connectionKey})`);
        socket.on('close',function() {
            this.sockets.delete(socket);
            console.log(`CLOSE CONNECTION (${this.sockets.size} sockets left on ${this.server._connectionKey})`);
        }.bind(this));
    })
}

WebsocketTracker.prototype.closeAll = function() {
    this.sockets.forEach((value,key) => {
        key.destroy();
    });
}

WebsocketTracker.prototype.pauseAll = function() {
    this.sockets.forEach((value,key) => {
        key.pause();
    });
}

module.exports = function (server) {
    return new WebsocketTracker(server);
}
