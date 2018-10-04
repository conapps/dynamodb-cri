"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cuid = require("cuid");
const lodash_1 = require("lodash");
const utils_1 = require("./utils");
const index_1 = require("./index");
class DynamoDBCRIModel {
    constructor(config) {
        this._config = {
            trackDates: false,
            trackIndexes: false,
            entity: '',
            gsik: 'gsik'
        };
        this._config.entity = config.entity;
        this._config.gsik = config.gsik;
        if (config.indexName !== undefined) {
            this._config.indexName = config.indexName;
        }
        if (config.tableName !== undefined) {
            this._config.tableName = config.tableName;
        }
        if (config.documentClient !== undefined) {
            this._config.documentClient = config.documentClient;
        }
        if (config.tenant !== undefined) {
            this._config.tenant = config.tenant;
        }
        if (config.indexes !== undefined) {
            this._config.indexes = config.indexes;
        }
        if (config.trackDates !== undefined) {
            this._config.trackDates = config.trackDates;
        }
        if (config.trackIndexes !== undefined) {
            this._config.trackIndexes = config.trackIndexes;
        }
    }
    get config() {
        return Object.assign({}, index_1.globalConfig, this._config);
    }
    /**
     *  Creates secondary key sk with this form:  tenant|entity|index
     * @param index index parameter for sk conformation.
     */
    createSecondaryKey(index) {
        return index === undefined
            ? { sk: `${this.config.tenant || ''}|${this.config.entity}` }
            : { sk: `${this.config.tenant || ''}|${this.config.entity}|${index}` };
    }
    /**
     * Tracks the updatedAt and createdAt values.
     *
     * @param {IItem} atributes Update object body
     * @returns {IDynamoDBModelTrack} Track body object,
     *
     */
    trackChanges(attributes) {
        if (this.config.trackDates === false)
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
     *  Given an index, creates the projection attribute
     * @param index Index to proyect
     * @param item  Item with attributes to proyect
     */
    proyectIndexes(index, item) {
        var object = {};
        index.projections.forEach(projection => {
            object[projection] = item[projection];
        });
        return { __p: JSON.stringify(object) };
    }
    async putIndexItems(body) {
        for (let index of this.config.indexes) {
            var projection = {};
            if (index.projections !== undefined) {
                projection = this.proyectIndexes(index, body);
            }
            var item = Object.assign({ pk: body.pk || body.id }, this.createSecondaryKey(index.indexName), { gk: JSON.stringify(body[index.indexName]), __v: index.indexName }, projection);
            var params = {
                TableName: this.config.tableName,
                Item: item
            };
            await this.config.documentClient.put(params).promise();
        }
    }
    createUpdateExpressionParams(body) {
        body = lodash_1.omit(body, ['id']);
        var expressions = [], attributeNames = {}, attributeValues = {};
        for (var key in body) {
            if (key === this.config.gsik) {
                expressions.push(`#gk = :${key}`);
                attributeNames[`#gk`] = 'gk';
                attributeValues[`:${key}`] = body[key];
            }
            else {
                expressions.push(`#${key} = :${key}`);
                attributeNames[`#${key}`] = key;
                attributeValues[`:${key}`] = body[key];
            }
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
    async create(attributes, index = undefined) {
        var track = this.trackChanges(attributes);
        var body = Object.assign({ pk: attributes.id || cuid() }, this.createSecondaryKey(index), { gk: JSON.stringify(attributes[this.config.gsik]), __v: this.config.gsik }, lodash_1.omit(attributes, ['id', this.config.gsik]), track);
        var params = {
            TableName: this.config.tableName,
            Item: body
        };
        await this.config.documentClient.put(params).promise();
        if (this.config.trackIndexes) {
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
        for (let index of this.config.indexes) {
            var Key = Object.assign({ pk: key.id }, this.createSecondaryKey(index.indexName));
            await this.config.documentClient
                .delete({
                TableName: this.config.tableName,
                Key
            })
                .promise();
        }
    }
    async delete(key) {
        await this.config.documentClient
            .delete({
            TableName: this.config.tableName,
            Key: Object.assign({ pk: key.id }, this.createSecondaryKey(key.index))
        })
            .promise();
        if (this.config.trackIndexes) {
            this.deleteIndexItems(key);
        }
    }
    async get(key) {
        var data = await this.config.documentClient
            .get({
            TableName: this.config.tableName,
            Key: Object.assign({ pk: key.id }, this.createSecondaryKey(key.index))
        })
            .promise();
        return data.Item !== undefined ? { item: this.unwrapGSIK(data.Item) } : undefined;
    }
    flattenIndexes() {
        var indexes = [];
        this.config.indexes.forEach(index => {
            indexes.push(index.indexName);
            if (index.projections !== undefined) {
                indexes.push(...index.projections);
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
        var response = await this.config.documentClient
            .get({
            TableName: this.config.tableName,
            Key: Object.assign({ pk: body.id || body.pk }, this.createSecondaryKey())
        })
            .promise();
        await this.putIndexItems(response.Item);
    }
    async update(body, index = undefined) {
        if (body.id === undefined) {
            throw new Error(`The value of id can't be undefined`);
        }
        if (this.config.trackDates === true)
            body = Object.assign({}, body, this.trackChanges(body));
        await this.config.documentClient
            .update(Object.assign({ TableName: this.config.tableName, Key: Object.assign({ pk: body.id }, this.createSecondaryKey(index)) }, this.createUpdateExpressionParams(body)))
            .promise();
        if (this.config.trackIndexes) {
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
        var KeyCondition, Filter, AttributeValues = {}, AttributeNames = {}, ScanIndexForward = {}, StartKey = {};
        AttributeValues[':sk'] = this.createSecondaryKey(options.index).sk;
        AttributeNames['#sk'] = 'sk';
        KeyCondition = `#sk = :sk`;
        if (options.keyCondition !== undefined) {
            options.keyCondition.values.forEach((value) => {
                if (value[':key'] !== undefined) {
                    AttributeValues = Object.assign({ ":key": JSON.stringify(value[':key']) }, AttributeValues);
                }
                else {
                    AttributeValues = Object.assign({}, value, AttributeValues);
                }
            });
            AttributeNames['#key'] = 'gk';
            KeyCondition = `${KeyCondition} and ${options.keyCondition.expression}`;
        }
        if (options.filter !== undefined) {
            Filter = options.filter.expression;
            options.filter.values.forEach((value) => {
                AttributeValues = Object.assign({}, value, AttributeValues);
            });
            options.filter.names.forEach((name) => {
                AttributeNames = Object.assign({}, name, AttributeNames);
            });
        }
        if (options.scanIndexForward !== undefined)
            ScanIndexForward = { ScanIndexForward: options.scanIndexForward };
        if (options.offset !== undefined)
            StartKey = this.createStartKey(options.offset, options.index);
        return Object.assign({ TableName: this.config.tableName, IndexName: this.config.indexName, KeyConditionExpression: KeyCondition, FilterExpression: Filter, ExpressionAttributeNames: AttributeNames, ExpressionAttributeValues: AttributeValues, Limit: options.limit }, StartKey, ScanIndexForward);
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
            item[item.__v] = JSON.parse(item.gk);
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
        var outputs = await Promise.all(items.map(i => i.pk).map((pk) => this.config.documentClient
            .get({
            TableName: this.config.tableName,
            Key: Object.assign({ pk }, this.createSecondaryKey())
        })
            .promise()));
        return outputs.map(output => output.Item);
    }
    async query(options) {
        options = Object.assign({ limit: 100 }, options);
        var params = this.createQueryParameters(options);
        var data = await this.config.documentClient.query(params).promise();
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