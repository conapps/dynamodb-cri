"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const processStreams_1 = require("./processStreams");
var globalConfig = {};
var DynamoDBCRI;
(function (DynamoDBCRI) {
    function getConfig() {
        return Object.assign({}, globalConfig);
    }
    DynamoDBCRI.getConfig = getConfig;
    function config(options) {
        globalConfig = Object.assign({}, globalConfig, options);
    }
    DynamoDBCRI.config = config;
    class Model extends model_1.DynamoDBCRIModel {
        constructor(config) {
            super(Object.assign({}, globalConfig, config));
        }
    }
    DynamoDBCRI.Model = Model;
    async function hookDynamoDBStreams(models, event) {
        try {
            await processStreams_1.processStreams(models, event);
        }
        catch (err) {
            throw err;
        }
    }
    DynamoDBCRI.hookDynamoDBStreams = hookDynamoDBStreams;
})(DynamoDBCRI = exports.DynamoDBCRI || (exports.DynamoDBCRI = {}));
//# sourceMappingURL=index.js.map