import { DynamoDB } from 'aws-sdk';
import * as cuid from 'cuid';

import AWS from './aws';
import { IGSIKItem } from './interfaces';
import { TableName, IndexName } from './constants';
import { pksToEntities } from './utils';

export interface ILicenceItem extends IGSIKItem {
  apId?: string;
  exp: 'never';
  __v: 'version';
}

export interface ILicenceAPIdItem extends IGSIKItem {
  __v: 'apId';
}

export async function licences() {
  for (let i = 0; i < 1000; i++) {
    var item: ILicenceItem = {
      pk: cuid(),
      sk: 'conatel|licence',
      gk: `${Date.now()}`,
      exp: 'never',
      __v: 'version'
    };

    var params: DynamoDB.DocumentClient.PutItemInput = {
      TableName,
      Item: item
    };

    await AWS.put(params);

    console.log(`${i}/${1000}`);
  }
}

export async function licencesWithAp() {
  var params: DynamoDB.DocumentClient.QueryInput = {
    TableName,
    IndexName,
    KeyConditionExpression: '#sk = :sk',
    ExpressionAttributeNames: {
      '#sk': 'sk'
    },
    ExpressionAttributeValues: {
      ':sk': 'conatel|licence|apId'
    }
  };

  var result = await AWS.query(params);

  var items = await pksToEntities(
    result.Items.map(i => i.pk),
    'conatel|licence'
  );

  console.log(items);
}
