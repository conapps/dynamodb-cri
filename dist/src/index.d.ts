import { DynamoDBStreamEvent } from 'aws-lambda';
import { IDynamoDBCRIGlobalConfig, IDynamoDBCRIModelConfig, IDynamoDBCRIModel } from './types';
export declare namespace DynamoDBCRI {
    function getConfig(): IDynamoDBCRIGlobalConfig;
    function config(options: IDynamoDBCRIGlobalConfig): void;
    function createModel(config: IDynamoDBCRIModelConfig): () => IDynamoDBCRIModel;
    function hookDynamoDBStreams(models: Array<() => IDynamoDBCRIModel>, event: DynamoDBStreamEvent): Promise<void>;
}
