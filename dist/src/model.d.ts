import { DynamoDB } from 'aws-sdk';
import { IDynamoDBCRIModelConfig, IDynamoDBCRIModel, IItem, IDynamoDBCRIItem, IDynamoDBCRIModelTrack, IDynamoDBCRIIndexes, IDynamoDBKey, IDynamoDBCRIIndexOptions, IDynamoDBCRIResponseItem, IDynamoDBCRIResponseItems } from './types';
export declare class DynamoDBCRIModel implements IDynamoDBCRIModel {
    documentClient: DynamoDB.DocumentClient;
    tableName: string;
    tenant: string;
    indexName: string;
    entity: string;
    gsik: string;
    indexes: IDynamoDBCRIIndexes[];
    trackDates: boolean;
    trackIndexes: boolean;
    constructor(config: IDynamoDBCRIModelConfig);
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
    proyectIndexes(index: IDynamoDBCRIIndexes, item: IItem): IItem;
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
    pksToEntities<T>(items: IItem[]): Promise<DynamoDB.DocumentClient.AttributeMap[]>;
    query(options: IDynamoDBCRIIndexOptions): Promise<IDynamoDBCRIResponseItems>;
}
