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

  export class Model extends DynamoDBCRIModel {
    constructor(config: IDynamoDBCRIModelConfig) {
      super({ ...globalConfig, ...config });
    }
  }
  export async function hookDynamoDBStreams(
    models: Array<IDynamoDBCRIModel>,
    event: DynamoDBStreamEvent
  ) {
    try {
      await processStreams(models, event);
    } catch (err) {
      throw err;
    }
  }
}
