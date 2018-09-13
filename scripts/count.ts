import { DynamoDB } from 'aws-sdk';
import { toString } from 'lodash';
import * as cuid from 'cuid';

import AWS from './aws';

export async function count() {
  for (let i = 0; i <= 1000; i++) {
    var params: DynamoDB.DocumentClient.PutItemInput = {
      TableName: 'dynamodb-cri',
      Item: {
        pk: cuid(),
        sk: 'conatel|count',
        gk: toString(Date.now() + 1000 * 60 * 60 * i),
        __v: 'value'
      }
    };

    await AWS.put(params);

    console.log(`${i}/${1000}`);
  }
}
