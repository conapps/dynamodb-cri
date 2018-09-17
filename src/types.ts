import { DynamoDB } from 'aws-sdk';

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
  proyections?: string[];
  enforceProyection?: boolean;
}

export interface IDynamoDBKey {
  [key: string]: string;
}

export interface IDynamoDBCRIModel {
  entity: string;
  tableName: string;
  indexName: string;
  tenant: string;
  documentClient?: DynamoDB.DocumentClient;
  indexes?: IDynamoDBCRIIndexes[];
  trackDates?: boolean;
  trackIndexes?: boolean;
  get(key: IDynamoDBKey): Promise<IDynamoDBCRIResponseItem>;
  delete(key: IDynamoDBKey): Promise<void>;
  create(body: IDynamoDBCRIItem): Promise<IDynamoDBCRIResponseItem>;
  update(body: IDynamoDBCRIItem): Promise<IDynamoDBCRIResponseItem>;
  query(options?: IDynamoDBCRIIndexOptions): Promise<IDynamoDBCRIResponseItems>;
  putIndexItems(body: IItem): Promise<void>;
  deleteIndexItems(key: IDynamoDBKey): Promise<void>;
  updateIndexesItems(body: IDynamoDBCRIItem | IItem): Promise<void>;
}

export interface IDynamoDBCRIKeyCondition {
  key: string;
  expression: string;
}

export interface IDynamoDBCRIIndexOptions {
  keyCondition?: IDynamoDBCRIKeyCondition;
  offset?: string;
  index?: string;
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
  [key: string]: any;
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
