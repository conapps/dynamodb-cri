import { DynamoDBStreamEvent } from 'aws-lambda';
import { IDynamoDBCRIGlobalConfig, IDynamoDBCRIModelConfig, IDynamoDBCRIModel } from './types';
export declare namespace DynamoDBCRI {
    function getConfig(): IDynamoDBCRIGlobalConfig;
    function config(options: IDynamoDBCRIGlobalConfig): void;
    function create(config: IDynamoDBCRIModelConfig): IDynamoDBCRIModel;
    function createModel(config: IDynamoDBCRIModelConfig): any;
    function hookDynamoDBStreams(models: IDynamoDBCRIModel[], event: DynamoDBStreamEvent): Promise<void>;
}
