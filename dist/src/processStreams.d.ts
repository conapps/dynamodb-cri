import { DynamoDBStreamEvent } from 'aws-lambda';
import { IDynamoDBCRIModel } from './types';
export declare function processStreams(models: Array<IDynamoDBCRIModel>, event: DynamoDBStreamEvent): Promise<void>;
