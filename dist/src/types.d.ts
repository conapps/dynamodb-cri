import { DynamoDB } from 'aws-sdk';
import { IDynamoDBCRIItem } from './types';
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
    promise(): Promise<IItem | void>;
    get(key: IDynamoDBKey): IDynamoDBCRIModel;
    delete(key: IDynamoDBKey): IDynamoDBCRIModel;
    create(body: IDynamoDBCRIItem): IDynamoDBCRIModel;
    update(body: IDynamoDBCRIItem): IDynamoDBCRIModel;
    query(options?: IDynamoDBCRIIndexOptions): IDynamoDBCRIModel;
    putIndexItems(body: IItem): void;
    deleteIndexItems(key: IDynamoDBKey): void;
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
