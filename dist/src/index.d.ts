import { DynamoDBCRIModel } from './model';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { IDynamoDBCRIGlobalConfig, IDynamoDBCRIModelConfig, IDynamoDBCRIModel } from './types';
export declare namespace DynamoDBCRI {
    function getConfig(): IDynamoDBCRIGlobalConfig;
    function config(options: IDynamoDBCRIGlobalConfig): void;
    class Model extends DynamoDBCRIModel {
        constructor(config: IDynamoDBCRIModelConfig);
    }
    function hookDynamoDBStreams(models: Array<IDynamoDBCRIModel>, event: DynamoDBStreamEvent): Promise<void>;
}
