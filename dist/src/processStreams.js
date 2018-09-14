"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unwrapRecords_1 = require("../utils/unwrapRecords");
const lodash_1 = require("lodash");
async function processStreams(models, event) {
    for (let record of event.Records) {
        var eventName = record.eventName;
        switch (eventName) {
            case 'INSERT':
                await createIndexesItems(record, models);
                break;
            case 'MODIFY':
                await updateIndexesItems(record, models);
                break;
            case 'REMOVE':
                await deleteIndexesItems(record, models);
                break;
            default:
                break;
        }
    }
}
exports.processStreams = processStreams;
async function createIndexesItems(record, models) {
    var entity = lodash_1.get(record, 'dynamodb.Keys.sk.S').split('|')[1];
    var model = findModel(models, entity);
    if (model === undefined) {
        throw new Error('No Model provided for this entity');
    }
    var body = buildBodyFromRecord(record);
    return await model().putIndexItems(body);
}
async function updateIndexesItems(record, models) {
    var entity = lodash_1.get(record, 'dynamodb.Keys.sk.S').split('|')[1];
    var model = findModel(models, entity);
    if (model === undefined) {
        throw new Error('No Model provided for this entity');
    }
    var body = buildBodyFromRecord(record);
    return await model().updateIndexesItems(body);
}
async function deleteIndexesItems(record, models) {
    var entity = lodash_1.get(record, 'dynamodb.Keys.sk.S').split('|')[1];
    var model = findModel(models, entity);
    if (model === undefined) {
        throw new Error('No Model provided for this entity');
    }
    var id = lodash_1.get(record, 'dynamodb.Keys.pk.S');
    return await model().deleteIndexItems({ id });
}
function buildBodyFromRecord(record) {
    var newItem = lodash_1.get(record, 'dynamodb.NewImage');
    return unwrapRecords_1.unwrapAllAttributeValues(newItem);
}
function findModel(models, key) {
    var item = lodash_1.find(models, (elem) => {
        return elem().entity === key;
    });
    return item !== undefined ? item : undefined;
}
//# sourceMappingURL=processStreams.js.map