"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cuid = require("cuid");
const lodash_1 = require("lodash");
const utils_1 = require("./utils");
class DynamoDBCRIModel {
    constructor(config) {
        this.indexName = 'byGSIK';
        this.trackDates = false;
        this.trackIndexes = false;
        this.tableName = config.tableName;
        this.documentClient = config.documentClient;
        this.entity = config.entity;
        this.gsik = config.gsik;
        if (config.indexes !== undefined) {
            this.indexes = config.indexes;
        }
        if (config.indexName !== undefined) {
            this.indexName = config.indexName;
        }
        if (config.tenant !== undefined) {
            this.tenant = config.tenant;
        }
        if (config.trackDates !== undefined) {
            this.trackDates = config.trackDates;
        }
        if (config.trackIndexes !== undefined) {
            this.trackIndexes = config.trackIndexes;
        }
    }
    /**
     *  Creates secondary key sk with this form:  tenant|entity|index
     * @param index index parameter for sk conformation.
     */
    createSecondaryKey(index) {
        if (this.tenant !== undefined && this.tenant !== '') {
            return index === undefined
                ? { sk: this.tenant + '|' + this.entity }
                : { sk: this.tenant + '|' + this.entity + '|' + index };
        }
        else {
            return index === undefined
                ? { sk: this.entity }
                : { sk: this.entity + '|' + index };
        }
    }
    /**
     * Tracks the updatedAt and createdAt values.
     *
     * @param {IItem} atributes Update object body
     * @returns {IDynamoDBModelTrack} Track body object,
     *
     */
    trackChanges(attributes) {
        if (this.trackDates === false)
            return {};
        var isoDate = new Date().toISOString();
        var isNew = attributes.createdAt === undefined;
        var result = {
            updatedAt: isoDate
        };
        if (isNew === true)
            result.createdAt = isoDate;
        return result;
    }
    /**
     *  Given an index, creates the proyection attribute
     * @param index Index to proyect
     * @param item  Item with attributes to proyect
     */
    proyectIndexes(index, item) {
        var object = {};
        index.proyections.forEach(proyection => {
            object[proyection] = item[proyection];
        });
        return { __p: JSON.stringify(object) };
    }
    async putIndexItems(body) {
        for (let index of this.indexes) {
            var proyection = {};
            if (index.proyections !== undefined) {
                proyection = this.proyectIndexes(index, body);
            }
            var item = Object.assign({ pk: body.pk || body.id }, this.createSecondaryKey(index.indexName), { gk: body[index.indexName], __v: index.indexName }, proyection);
            var params = {
                TableName: this.tableName,
                Item: item
            };
            await this.documentClient.put(params).promise();
        }
    }
    createUpdateExpressionParams(body) {
        body = lodash_1.omit(body, ['id']);
        var expressions = [], attributeNames = {}, attributeValues = {};
        for (var key in body) {
            expressions.push(`#${key} = :${key}`);
            attributeNames[`#${key}`] = key;
            attributeValues[`:${key}`] = body[key];
        }
        if (expressions.length === 0)
            throw new Error(`Can't construct UpdateExpression from the body`);
        expressions = [`SET ${expressions[0]}`].concat(expressions.slice(1, expressions.length));
        return {
            UpdateExpression: expressions.join(', '),
            ExpressionAttributeNames: attributeNames,
            ExpressionAttributeValues: attributeValues
        };
    }
    async create(attributes) {
        var track = this.trackChanges(attributes);
        var body = Object.assign({ pk: attributes.id || cuid() }, this.createSecondaryKey(), { gk: attributes[this.gsik], __v: this.gsik }, lodash_1.omit(attributes, ['id', this.gsik]), track);
        var params = {
            TableName: this.tableName,
            Item: body
        };
        await this.documentClient.put(params).promise();
        if (this.trackIndexes) {
            await this.putIndexItems(body);
        }
        return {
            item: Object.assign({ id: attributes.id || body.pk }, attributes, track)
        };
    }
    /**
     * Deletes the elements created by the idnexes
     * @param key primary key of elements
     */
    async deleteIndexItems(key) {
        for (let index of this.indexes) {
            var Key = Object.assign({ pk: key.id }, this.createSecondaryKey(index.indexName));
            await this.documentClient
                .delete({
                TableName: this.tableName,
                Key
            })
                .promise();
        }
    }
    async delete(key) {
        await this.documentClient
            .delete({
            TableName: this.tableName,
            Key: Object.assign({ pk: key.id }, this.createSecondaryKey())
        })
            .promise();
        if (this.trackIndexes) {
            this.deleteIndexItems(key);
        }
    }
    async get(key) {
        var data = await this.documentClient
            .get({
            TableName: this.tableName,
            Key: Object.assign({ pk: key.id }, this.createSecondaryKey(key.index))
        })
            .promise();
        return data.Item;
    }
    flattenIndexes() {
        var indexes = [];
        this.indexes.forEach(index => {
            indexes.push(index.indexName);
            if (index.proyections !== undefined) {
                indexes.push(...index.proyections);
            }
        });
        return [...new Set(indexes)];
    }
    needUpdateIndexes(body) {
        var keys = Object.keys(body);
        var indexes = this.flattenIndexes();
        return keys.some(r => indexes.indexOf(r) >= 0);
    }
    async updateIndexesItems(body) {
        if (this.needUpdateIndexes(body) === false) {
            return;
        }
        var response = await this.documentClient
            .get({
            TableName: this.tableName,
            Key: Object.assign({ pk: body.id || body.pk }, this.createSecondaryKey())
        })
            .promise();
        await this.putIndexItems(response.Item);
    }
    async update(body) {
        if (body.id === undefined) {
            throw new Error(`The value of id can't be undefined`);
        }
        if (this.trackDates === true)
            body = Object.assign({}, body, this.trackChanges(body));
        await this.documentClient
            .update(Object.assign({ TableName: this.tableName, Key: {
                pk: body.id,
                sk: `${this.tenant}|${this.entity}`
            } }, this.createUpdateExpressionParams(body)))
            .promise();
        if (this.trackIndexes) {
            this.updateIndexesItems(body);
        }
        return { item: body };
    }
    createStartKey(offset, index) {
        return {
            ExclusiveStartKey: Object.assign({}, JSON.parse(utils_1.atob(offset)), this.createSecondaryKey(index))
        };
    }
    createQueryParameters(options) {
        var KeyCondition, AttributeValues = {}, AttributeNames = {}, ScanIndexForward = {}, StartKey = {};
        AttributeValues[':sk'] = this.createSecondaryKey(options.index).sk;
        AttributeNames['#sk'] = 'sk';
        KeyCondition = `#sk = :sk`;
        if (options.keyCondition !== undefined) {
            AttributeValues[':key'] = options.keyCondition.key;
            AttributeNames['#key'] = 'gk';
            KeyCondition = `${KeyCondition} and ${options.keyCondition.expression}`;
        }
        if (options.scanIndexForward !== undefined)
            ScanIndexForward = { ScanIndexForward: options.scanIndexForward };
        if (options.offset !== undefined)
            StartKey = this.createStartKey(options.offset, options.index);
        return Object.assign({ TableName: this.tableName, IndexName: this.indexName, KeyConditionExpression: KeyCondition, ExpressionAttributeNames: AttributeNames, ExpressionAttributeValues: AttributeValues, Limit: options.limit }, StartKey, ScanIndexForward);
    }
    /**
     * Omits the GSIkeys from an item
     * @param item Item to remove keys
     */
    omitGSIK(item) {
        return lodash_1.omit(item, 'pk', 'sk', 'gk', '__v', '__p');
    }
    /**
     * Unwraps an item from the db to the standard item.
     * @param item Item to unwrap
     */
    unwrapGSIK(item) {
        if (item.__v)
            item[item.__v] = item.gk;
        item.id = item.pk;
        if (item.__p)
            item = Object.assign({}, item, JSON.parse(item.__p));
        return this.omitGSIK(item);
    }
    unwrapGSIKItems(items) {
        return items.map(item => this.unwrapGSIK(item));
    }
    /**
     * Transforms primary keys into entities
     * @param items The items to transform
     * @param index The index to search
     */
    async pksToEntities(items) {
        var outputs = await Promise.all(items.map(i => i.pk).map((pk) => this.documentClient
            .get({
            TableName: this.tableName,
            Key: Object.assign({ pk }, this.createSecondaryKey())
        })
            .promise()));
        return outputs.map(output => output.Item);
    }
    async query(options) {
        options = Object.assign({ limit: 100 }, options);
        var params = this.createQueryParameters(options);
        var data = await this.documentClient.query(params).promise();
        var responseItems = data.Items;
        if (options.unwrapIndexItems) {
            responseItems = await this.pksToEntities(data.Items);
        }
        var items = this.unwrapGSIKItems(responseItems);
        return Object.assign({ items, count: data.Count }, (data.LastEvaluatedKey !== undefined
            ? { offset: utils_1.btoa(JSON.stringify(data.LastEvaluatedKey)) }
            : {}));
    }
}
exports.DynamoDBCRIModel = DynamoDBCRIModel;
//# sourceMappingURL=model.js.map