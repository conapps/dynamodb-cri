import { DynamoDBCRIModel } from './model';
import { DynamoDBStreamEvent } from 'aws-lambda';
import {
  IDynamoDBCRIGlobalConfig,
  IDynamoDBCRIModelConfig,
  IDynamoDBCRIModel
} from './types';
import { processStreams } from './processStreams';

var globalConfig: IDynamoDBCRIGlobalConfig = {};

export namespace DynamoDBCRI {

  export function getConfig() {
    return Object.assign({}, globalConfig);
  }
  export function config(options: IDynamoDBCRIGlobalConfig): void {
    globalConfig = Object.assign({}, globalConfig, options);
  }
  export function create(config: IDynamoDBCRIModelConfig): IDynamoDBCRIModel {
    return createModel(config);
  }

  export function createModel(config: IDynamoDBCRIModelConfig): any {
    class Model extends DynamoDBCRIModel {
      constructor() {
        super({ ...globalConfig, ...config });
      }
    }
    return new Model();
  }

  export async function hookDynamoDBStreams(
    models: IDynamoDBCRIModel[],
    event: DynamoDBStreamEvent
  ) {
    try {
      await processStreams(models, event);
    } catch (err) {
      throw err;
    }
  }
}
