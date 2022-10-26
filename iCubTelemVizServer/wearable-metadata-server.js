var express = require('express');

function WearableMetadataServer(wearableDataParser) {
    let router = express.Router();

    router.get('/:folderKeys/childTelemEntryKeys', function (req, res) {
        let response = req.params.folderKeys.split(',').map(function (folderId) {
            return Object.keys(wearableDataParser.telemKeyTree.get(folderId).names);
        }, []);
        res.status(200).json(response).end();
    });

    router.get('/:folderKey/:entryKeys/name', function (req, res) {
        let folderId = req.params.folderKey;
        let response = req.params.entryKeys.split(',').map(function (entryId) {
            return wearableDataParser.telemKeyTree.get(folderId).names[entryId];
        });
        res.status(200).json(response).end();
    });

    return router;
}

module.exports = WearableMetadataServer;
