var express = require('express');

function StaticServer() {
    var router = express.Router();

    router.use('/', express.static(__dirname));
    router.use('/config', express.static(__dirname + '/../config'));

    return router
}

module.exports = StaticServer;
