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

export class DynamoDBCRIModel implements IDynamoDBCRIModel {
  documentClient: DynamoDB.DocumentClient;

  tableName: string;

  tenant: string;

  indexName: string = 'byGSIK';

  entity: string;

  gsik: string;

  indexes: IDynamoDBCRIIndexes[];

  trackDates: boolean = false;

  trackIndexes: boolean = false;

  constructor(config: IDynamoDBCRIModelConfig) {
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

  createSecondaryKey(index?: string): IItem {
    if (this.tenant !== undefined && this.tenant !== '') {
      return index === undefined
        ? { sk: this.tenant + '|' + this.entity }
        : { sk: this.tenant + '|' + this.entity + '|' + index };
    } else {
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
  trackChanges(attributes: IDynamoDBCRIItem): IDynamoDBCRIModelTrack {
    if (this.trackDates === false) return {} as IDynamoDBCRIModelTrack;
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
    for (let index of this.indexes) {
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
        TableName: this.tableName,
        Item: item
      };

      await this.documentClient.put(params).promise();
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
      expressions.push(`#${key} = :${key}`);
      attributeNames[`#${key}`] = key;
      attributeValues[`:${key}`] = body[key];
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
      gk: attributes[this.gsik],
      __v: this.gsik,
      ...omit(attributes, ['id', this.gsik]),
      ...track
    };

    var params: DynamoDB.DocumentClient.PutItemInput = {
      TableName: this.tableName,
      Item: body
    };

    await this.documentClient.put(params).promise();

    if (this.trackIndexes) {
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
    for (let index of this.indexes) {
      var Key = {
        pk: key.id,
        ...this.createSecondaryKey(index.indexName)
      };
      await this.documentClient
        .delete({
          TableName: this.tableName,
          Key
        })
        .promise();
    }
  }

  async delete(key: IDynamoDBKey): Promise<void> {
    await this.documentClient
      .delete({
        TableName: this.tableName,
        Key: {
          pk: key.id,
          ...this.createSecondaryKey()
        }
      })
      .promise();

    if (this.trackIndexes) {
      this.deleteIndexItems(key);
    }
  }

  async get(key: IDynamoDBKey): Promise<IDynamoDBCRIResponseItem> {
    var data: any = await this.documentClient
      .get({
        TableName: this.tableName,
        Key: {
          pk: key.id,
          ...this.createSecondaryKey(key.index)
        }
      })
      .promise();

    return data.Item;
  }

  private flattenIndexes(): string[] {
    var indexes: string[] = [];

    this.indexes.forEach(index => {
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
    var response = await this.documentClient
      .get({
        TableName: this.tableName,
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

    if (this.trackDates === true)
      body = { ...body, ...this.trackChanges(body) };

    await this.documentClient
      .update({
        TableName: this.tableName,
        Key: {
          pk: body.id,
          sk: `${this.tenant}|${this.entity}`
        },
        ...this.createUpdateExpressionParams(body)
      })
      .promise();

    if (this.trackIndexes) {
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
    if (options.scanIndexForward !== undefined)
      ScanIndexForward = { ScanIndexForward: options.scanIndexForward };

    if (options.offset !== undefined)
      StartKey = this.createStartKey(options.offset, options.index);

    return {
      TableName: this.tableName,
      IndexName: this.indexName,
      KeyConditionExpression: KeyCondition,
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
          this.documentClient
            .get({
              TableName: this.tableName,
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

    var data: any = await this.documentClient.query(params).promise();

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
