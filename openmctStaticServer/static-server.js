var express = require('express');

function StaticServer() {
    var router = express.Router();

    router.use('/', express.static(__dirname));
    router.use('/config', express.static(__dirname + '/../config'));
    router.use('/openmctdist', express.static(__dirname + '/../node_modules/openmct/dist'));

    return router
}

module.exports = StaticServer;
