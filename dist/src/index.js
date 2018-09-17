"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model_1 = require("./model");
const processStreams_1 = require("./processStreams");
exports.globalConfig = {};
var DynamoDBCRI;
(function (DynamoDBCRI) {
    function getConfig() {
        return Object.assign({}, exports.globalConfig);
    }
    function config(options) {
        if (options !== undefined) {
            exports.globalConfig = Object.assign({}, exports.globalConfig, options);
        }
        return getConfig();
    }
    DynamoDBCRI.config = config;
    class Model extends model_1.DynamoDBCRIModel {
        constructor(config) {
            super(Object.assign({}, config));
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