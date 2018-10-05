import { DynamoDBStreamEvent } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

export interface IDynamoDBCRIGlobalConfig {
  tableName?: string;
  indexName?: string;
  tenant?: string;
  documentClient?: DynamoDB.DocumentClient;
}
export interface IDynamoDBCRIModelConfig {
  tableName?: string;
  indexName?: string;
  tenant?: string;
  documentClient?: DynamoDB.DocumentClient;
  entity: string;
  gsik: string;
  indexes?: IDynamoDBCRIIndexes[];
  trackDates?: boolean;
  trackIndexes?: boolean;
}
export interface IDynamoDBCRIIndexes {
  indexName: string;
  projections?: string[];
}
export interface IDynamoDBKey {
  [key: string]: string;
}
export interface IDynamoDBCRIModel {
  _config: IDynamoDBCRIModelConfig
  get(key: IDynamoDBKey): Promise<IDynamoDBCRIResponseItem>;
  delete(key: IDynamoDBKey): Promise<void>;
  create(body: IDynamoDBCRIItem, index?: string): Promise<IDynamoDBCRIResponseItem>;
  update(body: IDynamoDBCRIItem, index?: string): Promise<IDynamoDBCRIResponseItem>;
  query(options?: IDynamoDBCRIIndexOptions): Promise<IDynamoDBCRIResponseItems>;
  putIndexItems(body: IItem): Promise<void>;
  deleteIndexItems(key: IDynamoDBKey): Promise<void>;
  updateIndexesItems(body: IDynamoDBCRIItem | IItem): Promise<void>;
}
export interface IDynamoDBCRIKeyCondition {
  values: IItem[];
  expression: string;
}
export interface IDynamoDBCRIIndexOptions {
  keyCondition?: IDynamoDBCRIKeyCondition;
  offset?: string;
  index?: string;
  filter?: IItem;
  unwrapIndexItems?: boolean;
  limit?: number;
  scanIndexForward?: boolean;
}
export interface IDynamoDBCRIResponseItem {
  item: IItem;
}
export interface IGSIKItem {
  pk: string;
  sk: string;
  gk: string;
  __v: string;
  [key: string]: any;
}
export interface IDynamoDBCRIResponseItems {
  items: IItem[];
}
export interface IDynamoDBCRIGetOptions {
  id: string;
  index?: string;
}
export interface IItem {
  [key: string]: any;
}
export interface IDynamoDBCRIItem extends IItem {
  id?: string;
}
export interface IDynamoDBCRIModelTrack {
  updatedAt?: string;
  createdAt?: string;
}
export interface IExpressionAttributeValues {
  [key: string]: any;
}
export interface IExpressionAttributeNames {
  [key: string]: string;
}
export interface IUpdateExpressionAttributes {
  UpdateExpression: string;
  ExpressionAttributeNames: IExpressionAttributeNames;
  ExpressionAttributeValues: IExpressionAttributeValues;
}

export declare namespace DynamoDBCRI {
  function getConfig(): IDynamoDBCRIGlobalConfig;
  export function config(options?: IDynamoDBCRIGlobalConfig): IDynamoDBCRIGlobalConfig;
  export class Model extends DynamoDBCRIModel {}
  export function hookDynamoDBStreams(
    models: IDynamoDBCRIModel[],
    event: DynamoDBStreamEvent
  ): Promise<void>;
}

/**
 * Encodes a string using base64.
 * @param string String to encode to base64
 */
export declare function btoa(string: string): string;
/**
 * Decodes a base64 string to ascii
 * @param string String to decode from base64 to ascii.
 */
export declare function atob(string: string): string;

export declare class DynamoDBCRIModel implements IDynamoDBCRIModel {
  _config: IDynamoDBCRIModelConfig
  constructor(config: IDynamoDBCRIModelConfig);
  private handleError;
  /**
   *  Creates secondary key sk with this form:  tenant|entity|index
   * @param index index parameter for sk conformation.
   */
  createSecondaryKey(index?: string): IItem;
  /**
   * Tracks the updatedAt and createdAt values.
   *
   * @param {IItem} atributes Update object body
   * @returns {IDynamoDBModelTrack} Track body object,
   *
   */
  trackChanges(attributes: IDynamoDBCRIItem): IDynamoDBCRIModelTrack;
  /**
   *  Given an index, creates the proyection attribute
   * @param index Index to proyect
   * @param item  Item with attributes to proyect
   */
  private proyectIndexes;
  putIndexItems(body: IItem): Promise<void>;
  private createUpdateExpressionParams;
  create(attributes: IDynamoDBCRIItem): Promise<IDynamoDBCRIResponseItem>;
  /**
   * Deletes the elements created by the idnexes
   * @param key primary key of elements
   */
  deleteIndexItems(key: IDynamoDBKey): Promise<void>;
  delete(key: IDynamoDBKey): Promise<void>;
  get(key: IDynamoDBKey): Promise<IDynamoDBCRIResponseItem>;
  private flattenIndexes;
  private needUpdateIndexes;
  updateIndexesItems(body: IDynamoDBCRIItem | IItem): Promise<void>;
  update(body: IDynamoDBCRIItem): Promise<IDynamoDBCRIResponseItem>;
  private createStartKey;
  private createQueryParameters;
  /**
   * Omits the GSIkeys from an item
   * @param item Item to remove keys
   */
  private omitGSIK;
  /**
   * Unwraps an item from the db to the standard item.
   * @param item Item to unwrap
   */
  private unwrapGSIK;
  private unwrapGSIKItems;
  /**
   * Transforms primary keys into entities
   * @param items The items to transform
   * @param index The index to search
   */
  private pksToEntities;
  query(options: IDynamoDBCRIIndexOptions): Promise<IDynamoDBCRIResponseItems>;
}

/**
 *  Unwrap DynamoDB AttributeValues to values of the appropriate types.
 *  @param {Object} attributeValue The DynamoDb AttributeValue to unwrap.
 *  @return {Object} Unwrapped object with properties.
 */
export declare function unwrapAllAttributeValues(atributeValues: IItem): IItem;
/**
 * Unwrap a single DynamoDB's AttributeValues to a value of the appropriate
 * javascript type.
 * @param {AttributeValue} attributeValue The DynamoDB AttributeValue.
 * @return {String|Number|Array}  The javascript value.
 */
export declare function unwrapOneAttributeValue(attributeValue: IItem): any;
export var Errors: IItem;

export declare function processStreams(
  models: IDynamoDBCRIModel[],
  event: DynamoDBStreamEvent
): Promise<void>;
