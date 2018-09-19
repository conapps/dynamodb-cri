import * as cuid from 'cuid';
import { omit } from 'lodash';
import { atob, btoa } from './utils';
import { DynamoDB } from 'aws-sdk';
import {
  IDynamoDBCRIModelConfig,
  IDynamoDBCRIModel,
  IItem,
  IDynamoDBCRIItem,
  IDynamoDBCRIModelTrack,
  IDynamoDBCRIIndexes,
  IDynamoDBKey,
  IUpdateExpressionAttributes,
  IExpressionAttributeNames,
  IExpressionAttributeValues,
  IDynamoDBCRIIndexOptions,
  IDynamoDBCRIResponseItem,
  IDynamoDBCRIResponseItems
} from './types';
import { globalConfig } from './index';
import { AttributeValue } from 'aws-lambda';

export class DynamoDBCRIModel implements IDynamoDBCRIModel {
  
  _config: IDynamoDBCRIModelConfig = {
    trackDates: false,
    trackIndexes: false,
    entity:'',
    gsik:'gsik'
  };

  get config(): IDynamoDBCRIModelConfig {
    return {...globalConfig, ...this._config}
  }

  constructor(config: IDynamoDBCRIModelConfig) {

    this._config.entity = config.entity;
    this._config.gsik = config.gsik;

    if (config.indexName !== undefined){
      this._config.indexName= config.indexName
    }

    if (config.tableName !== undefined){
      this._config.tableName = config.tableName
    }

    if (config.tenant !== undefined){
      this._config.tenant = config.tenant
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

  /**
   *  Creates secondary key sk with this form:  tenant|entity|index
   * @param index index parameter for sk conformation.
   */

  createSecondaryKey(index?: string): IItem {
    return index === undefined
      ? { sk: `${this.config.tenant || ''}|${this.config.entity}` }
      : { sk:  `${this.config.tenant ||''}|${this.config.entity}|${index}` };
  }

  /**
   * Tracks the updatedAt and createdAt values.
   *
   * @param {IItem} atributes Update object body
   * @returns {IDynamoDBModelTrack} Track body object,
   *
   */
  trackChanges(attributes: IDynamoDBCRIItem): IDynamoDBCRIModelTrack {
    if (this.config.trackDates === false) return {} as IDynamoDBCRIModelTrack;
    var isoDate = new Date().toISOString();
    var isNew = attributes.createdAt === undefined;
    var result: IDynamoDBCRIModelTrack = {
      updatedAt: isoDate
    };
    if (isNew === true) result.createdAt = isoDate;
    return result;
  }

  /**
   *  Given an index, creates the proyection attribute
   * @param index Index to proyect
   * @param item  Item with attributes to proyect
   */
  proyectIndexes(index: IDynamoDBCRIIndexes, item: IItem): IItem {
    var object: IItem = {};
    index.proyections.forEach(proyection => {
      object[proyection] = item[proyection];
    });
    return { __p: JSON.stringify(object) };
  }

  async putIndexItems(body: IItem): Promise<void> {
    for (let index of this.config.indexes) {
      var proyection = {};

      if (index.proyections !== undefined) {
        proyection = this.proyectIndexes(index, body);
      }

      var item: IItem = {
        pk: body.pk || body.id,
        ...this.createSecondaryKey(index.indexName),
        gk: body[index.indexName],
        __v: index.indexName,
        ...proyection
      };

      var params: DynamoDB.DocumentClient.PutItemInput = {
        TableName: this.config.tableName,
        Item: item
      };

      await this.config.documentClient.put(params).promise();
    }
  }

  private createUpdateExpressionParams(
    body: IDynamoDBCRIItem
  ): IUpdateExpressionAttributes {
    body = omit(body, ['id']);

    var expressions: string[] = [],
      attributeNames: IExpressionAttributeNames = {},
      attributeValues: IExpressionAttributeValues = {};

    for (var key in body) {
      if (key===this.config.gsik){
        expressions.push(`#gk = :${key}`);
        attributeNames[`#gk`] = 'gk';
        attributeValues[`:${key}`] = body[key];
      } else {
        expressions.push(`#${key} = :${key}`);
        attributeNames[`#${key}`] = key;
        attributeValues[`:${key}`] = body[key];
      }
     
    }

    if (expressions.length === 0)
      throw new Error(`Can't construct UpdateExpression from the body`);

    expressions = [`SET ${expressions[0]}`].concat(
      expressions.slice(1, expressions.length)
    );

    return {
      UpdateExpression: expressions.join(', '),
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues
    };
  }

  async create(
    attributes: IDynamoDBCRIItem
  ): Promise<IDynamoDBCRIResponseItem> {
    var track: IDynamoDBCRIModelTrack = this.trackChanges(attributes);

    var body: IItem = {
      pk: attributes.id || cuid(),
      ...this.createSecondaryKey(),
      gk: attributes[this.config.gsik],
      __v: this.config.gsik,
      ...omit(attributes, ['id', this.config.gsik]),
      ...track
    };

    var params: DynamoDB.DocumentClient.PutItemInput = {
      TableName: this.config.tableName,
      Item: body
    };

    await this.config.documentClient.put(params).promise();

    if (this.config.trackIndexes) {
      await this.putIndexItems(body);
    }

    return {
      item: {
        id: attributes.id || body.pk,
        ...attributes,
        ...track
      }
    };
  }
  /**
   * Deletes the elements created by the idnexes
   * @param key primary key of elements
   */
  async deleteIndexItems(key: IDynamoDBKey): Promise<void> {
    for (let index of this.config.indexes) {
      var Key = {
        pk: key.id,
        ...this.createSecondaryKey(index.indexName)
      };
      await this.config.documentClient
        .delete({
          TableName: this.config.tableName,
          Key
        })
        .promise();
    }
  }

  async delete(key: IDynamoDBKey): Promise<void> {
    await this.config.documentClient
      .delete({
        TableName: this.config.tableName,
        Key: {
          pk: key.id,
          ...this.createSecondaryKey(key.index)
        }
      })
      .promise();

    if (this.config.trackIndexes) {
      this.deleteIndexItems(key);
    }
  }

  async get(key: IDynamoDBKey): Promise<IDynamoDBCRIResponseItem> {
    var data: any = await this.config.documentClient
      .get({
        TableName: this.config.tableName,
        Key: {
          pk: key.id,
          ...this.createSecondaryKey(key.index)
        }
      })
      .promise();

    return  { item: this.unwrapGSIK(data.Item) };
  }

  private flattenIndexes(): string[] {
    var indexes: string[] = [];

    this.config.indexes.forEach(index => {
      indexes.push(index.indexName);
      if (index.proyections !== undefined) {
        indexes.push(...index.proyections);
      }
    });

    return [...new Set(indexes)];
  }

  private needUpdateIndexes(body: IDynamoDBCRIItem): boolean {
    var keys: string[] = Object.keys(body);
    var indexes: string[] = this.flattenIndexes();
    return keys.some(r => indexes.indexOf(r) >= 0);
  }

  async updateIndexesItems(body: IDynamoDBCRIItem | IItem): Promise<void> {
    if (this.needUpdateIndexes(body) === false) {
      return;
    }
    var response = await this.config.documentClient
      .get({
        TableName: this.config.tableName,
        Key: {
          pk: body.id || body.pk,
          ...this.createSecondaryKey()
        }
      })
      .promise();

    await this.putIndexItems(response.Item);
  }

  async update(body: IDynamoDBCRIItem): Promise<IDynamoDBCRIResponseItem> {
    if (body.id === undefined) {
      throw new Error(`The value of id can't be undefined`);
    }

    if (this.config.trackDates === true)
      body = { ...body, ...this.trackChanges(body) };

    await this.config.documentClient
      .update({
        TableName: this.config.tableName,
        Key: {
          pk: body.id,
          ...this.createSecondaryKey()
        },
        ...this.createUpdateExpressionParams(body)
      })
      .promise();

    if (this.config.trackIndexes) {
      this.updateIndexesItems(body);
    }

    return { item: body };
  }

  private createStartKey(offset: string, index: string): IItem {
    return {
      ExclusiveStartKey: {
        ...JSON.parse(atob(offset)),
        ...this.createSecondaryKey(index)
      }
    };
  }

  private createQueryParameters(
    options: IDynamoDBCRIIndexOptions
  ): DynamoDB.DocumentClient.QueryInput {
    var KeyCondition: string,
      Filter: string,
      AttributeValues: IExpressionAttributeValues = {},
      AttributeNames: IExpressionAttributeNames = {},
      ScanIndexForward: IItem = {},
      StartKey: IItem = {};

    AttributeValues[':sk'] = this.createSecondaryKey(options.index).sk;
    AttributeNames['#sk'] = 'sk';
    KeyCondition = `#sk = :sk`;

    if (options.keyCondition !== undefined) {
      AttributeValues[':key'] = options.keyCondition.key;
      AttributeNames['#key'] = 'gk';
      KeyCondition = `${KeyCondition} and ${options.keyCondition.expression}`;
    }

    if (options.filter !== undefined){
      Filter = options.filter.expression
      options.filter.values.forEach((value: IItem) => {
        AttributeValues = {
          ...value,
          ...AttributeValues
        }
      })
      options.filter.names.forEach((name: IItem) => {
       AttributeNames = {
         ...name,
         ...AttributeNames
       }
      })
    }

    if (options.scanIndexForward !== undefined)
      ScanIndexForward = { ScanIndexForward: options.scanIndexForward };

    if (options.offset !== undefined)
      StartKey = this.createStartKey(options.offset, options.index);

    return {
      TableName: this.config.tableName,
      IndexName: this.config.indexName,
      KeyConditionExpression: KeyCondition,
      FilterExpression: Filter,
      ExpressionAttributeNames: AttributeNames,
      ExpressionAttributeValues: AttributeValues,
      Limit: options.limit,
      ...StartKey,
      ...ScanIndexForward
    };
  }
  /**
   * Omits the GSIkeys from an item
   * @param item Item to remove keys
   */
  private omitGSIK(item: IItem): any {
    return omit(item, 'pk', 'sk', 'gk', '__v', '__p');
  }

  /**
   * Unwraps an item from the db to the standard item.
   * @param item Item to unwrap
   */
  private unwrapGSIK(item: IItem): any {
    if (item.__v) item[item.__v] = item.gk;

    item.id = item.pk;

    if (item.__p) item = { ...item, ...JSON.parse(item.__p) };

    return this.omitGSIK(item);
  }

  private unwrapGSIKItems(items: IItem[]): IItem[] {
    return items.map(item => this.unwrapGSIK(item));
  }
  /**
   * Transforms primary keys into entities
   * @param items The items to transform
   * @param index The index to search
   */
  async pksToEntities<T>(items: IItem[]) {
    var outputs = await Promise.all(
      items.map(i => i.pk).map(
        (pk: string): Promise<DynamoDB.DocumentClient.GetItemOutput> =>
          this.config.documentClient
            .get({
              TableName: this.config.tableName,
              Key: {
                pk,
                ...this.createSecondaryKey()
              }
            })
            .promise()
      )
    );
    return outputs.map(output => output.Item);
  }

  async query(
    options: IDynamoDBCRIIndexOptions
  ): Promise<IDynamoDBCRIResponseItems> {
    options = { limit: 100, ...options };

    var params = this.createQueryParameters(options);

    var data: any = await this.config.documentClient.query(params).promise();

    var responseItems: IItem[] = data.Items;

    if (options.unwrapIndexItems) {
      responseItems = await this.pksToEntities(data.Items);
    }

    var items: IItem[] = this.unwrapGSIKItems(responseItems);

    return {
      items,
      count: data.Count,
      ...(data.LastEvaluatedKey !== undefined
        ? { offset: btoa(JSON.stringify(data.LastEvaluatedKey)) }
        : {})
    };
  }
}
