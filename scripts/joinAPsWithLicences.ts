import { DynamoDB } from 'aws-sdk';
import * as cuid from 'cuid';

import AWS from './aws';
import { IGSIKItem } from './interfaces';
import { TableName, IndexName } from './constants';

export interface ILicenceItem extends IGSIKItem {
  apId?: string;
  exp: 'never';
  __v: 'version';
}

export interface ILicenceAPIdItem extends IGSIKItem {
  __v: 'apId';
}

var defaults = (
  entity: string,
  limit: number
): DynamoDB.DocumentClient.QueryInput => ({
  TableName,
  IndexName,
  KeyConditionExpression: 'sk = :sk',
  ExpressionAttributeValues: {
    ':sk': `conatel|${entity}`
  },
  Limit: limit
});

export async function joinAPsWithLicences(limit: number = 100) {
  var { Items: aps } = await AWS.query(defaults('ap', limit));

  var { Items: licences } = await AWS.query(defaults('licence', limit));

  for (let i = 0; i < limit; i++) {
    var ap = aps[i];
    var licence = licences[i];

    if (ap === undefined || licence === undefined) continue;

    await AWS.put({
      TableName,
      Item: {
        pk: ap.pk,
        sk: 'conatel|ap|licenceId',
        gk: licence.pk,
        __v: 'locationId'
      }
    });

    await AWS.put({
      TableName,
      Item: {
        pk: licence.pk,
        sk: 'conatel|licence|apId',
        gk: ap.pk,
        __v: 'apId'
      }
    });

    await AWS.update({
      TableName,
      Key: {
        pk: ap.pk,
        sk: ap.sk
      },
      UpdateExpression: `SET #hasLicence = :hasLicence, #licenceId = :licenceId`,
      ExpressionAttributeNames: {
        '#hasLicence': 'hasLicence',
        '#licenceId': 'licenceId'
      },
      ExpressionAttributeValues: {
        ':hasLicence': true,
        ':licenceId': licence.pk
      }
    });

    await AWS.update({
      TableName,
      Key: {
        pk: licence.pk,
        sk: licence.sk
      },
      UpdateExpression: `SET #apId = :apId`,
      ExpressionAttributeNames: {
        '#apId': 'apId'
      },
      ExpressionAttributeValues: {
        ':apId': ap.pk
      }
    });
  }
}
