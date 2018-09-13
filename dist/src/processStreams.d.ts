import { DynamoDBStreamEvent } from 'aws-lambda';
import { IDynamoDBCRIModel } from './types';
export declare function processStreams(models: IDynamoDBCRIModel[], event: DynamoDBStreamEvent): Promise<void>;
