import { DynamoDBCRIModel } from './model';
import { DynamoDBStreamEvent } from 'aws-lambda';
import {
  IDynamoDBCRIGlobalConfig,
  IDynamoDBCRIModelConfig,
  IDynamoDBCRIModel
} from './types';
import { processStreams } from './processStreams';

export var globalConfig: IDynamoDBCRIGlobalConfig = {};

export namespace DynamoDBCRI {
  function getConfig(): IDynamoDBCRIGlobalConfig {
    return Object.assign({}, globalConfig);
  }
  export function config(
    options?: IDynamoDBCRIGlobalConfig
  ): IDynamoDBCRIGlobalConfig {
    if (options !== undefined) {
      globalConfig = Object.assign({}, globalConfig, options);
    }

    return getConfig();
  }

  export class Model extends DynamoDBCRIModel {
    constructor(config: IDynamoDBCRIModelConfig) {
      super({ ...config });
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
