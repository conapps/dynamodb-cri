import { DynamoDB } from 'aws-sdk';
import { range, uniq } from 'lodash';
import * as cuid from 'cuid';

import AWS from './aws';
import { IGSIKItem } from './interfaces';
import { pksToEntities, random, randomMac, pickOne, unwrapGSIK } from './utils';

var AMOUNT = 10;
var LOCATIONS = range(AMOUNT).map((i: number): string => cuid());
var TAGS = ['montevideo', 'interior', 'central', 'tata', 'bas', 'mhogar'];

export interface IAPItem {
  pk: string;
  sk: string;
  gk: string;
  locationId: string;
  tags: string[];
  hasLicence: boolean;
  licenceId?: string;
  createdAt: string;
  updatedAt: string;
  __v: 'mac';
}

export interface IAPLocationIDItem extends IGSIKItem {
  __v: 'locationId';
}

var TableName = 'dynamodb-cri';
var IndexName = 'gsik';

export async function aps() {
  for (let i = 0; i < 1000; i++) {
    var item: IAPItem = {
      pk: cuid(),
      sk: 'conatel|ap',
      gk: randomMac(),
      locationId: pickOne(LOCATIONS),
      tags: uniq(range(2).map((i: number): string => pickOne(TAGS))),
      hasLicence: false,
      createdAt: new Date(
        Date.now() - 1000 * 60 * 60 * random(100)
      ).toISOString(),
      updatedAt: new Date().toISOString(),
      __v: 'mac'
    };

    var params: DynamoDB.DocumentClient.PutItemInput = {
      TableName,
      Item: item
    };

    await AWS.put(params);

    await AWS.put({
      ...params,
      Item: {
        pk: item.pk,
        sk: 'conatel|ap|locationId',
        gk: item.locationId,
        __v: 'locationId',
        __p: JSON.stringify({ mac: item.gk })
      }
    });

    console.log(`${i}/${1000}`);
  }
}

export async function apsByLocationId(locationId: string) {
  var TableName = 'dynamodb-cri';

  var params: DynamoDB.DocumentClient.QueryInput = {
    TableName,
    IndexName,
    KeyConditionExpression: '#sk = :sk and #gk = :gk',
    ExpressionAttributeNames: {
      '#gk': 'gk',
      '#sk': 'sk'
    },
    ExpressionAttributeValues: {
      ':sk': 'conatel|ap|locationId',
      ':gk': locationId
    }
  };

  var result = await AWS.query(params);

  //var items = await pksToEntities(result.Items.map(i => i.pk), 'conatel|ap');

  var items = result.Items.map(item => unwrapGSIK(item as IGSIKItem));

  console.log(items);
}

export async function apsWithLicence() {
  var params: DynamoDB.DocumentClient.QueryInput = {
    TableName,
    IndexName,
    KeyConditionExpression: '#sk = :sk',
    ExpressionAttributeNames: {
      '#sk': 'sk'
    },
    ExpressionAttributeValues: {
      ':sk': 'conatel|ap|licenceId'
    }
  };

  var result = await AWS.query(params);

  var items = await pksToEntities(result.Items.map(i => i.pk), 'conatel|ap');

  console.log(items);
}
