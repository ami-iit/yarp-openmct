function WebsocketTracker(server) {
    this.server = server;
    this.sockets = new Map();
    server.on('connection',(socket) => {
        console.log('NEW CONNECTION!!');
        this.sockets.set(socket,true);
        socket.on('close',function() {
            console.log('CLOSE CONNECTION');
            this.sockets.delete(socket);
        }.bind(this));
    })
}

WebsocketTracker.prototype.closeAll = function() {
    this.sockets.forEach((value,key) => {
        key.destroy();
    });
}

module.exports = function (server) {
    return new WebsocketTracker(server);
}
