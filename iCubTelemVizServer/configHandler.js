"use strict";

const {evalTemplateLiteralInJSON} = require ('../common/utils');

function ConfigHandler(configFile) {
    this.config = require(configFile);
    this.config = evalTemplateLiteralInJSON(this.config);
}

module.exports = ConfigHandler;
