import { DynamoDBCRIModel } from './model';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { IDynamoDBCRIGlobalConfig, IDynamoDBCRIModelConfig, IDynamoDBCRIModel } from './types';
export declare var globalConfig: IDynamoDBCRIGlobalConfig;
export declare namespace DynamoDBCRI {
    function config(options?: IDynamoDBCRIGlobalConfig): IDynamoDBCRIGlobalConfig;
    class Model extends DynamoDBCRIModel {
        constructor(config: IDynamoDBCRIModelConfig);
    }
    function hookDynamoDBStreams(models: Array<IDynamoDBCRIModel>, event: DynamoDBStreamEvent): Promise<void>;
}
