import { DynamoDB } from 'aws-sdk';
import { omit, isObject } from 'lodash';

import AWS from './aws';
import { IGSIKItem } from './interfaces';

var TableName = 'dynamodb-cri';
var IndexName = 'gsik';

export function omitGSIK(item: IGSIKItem): any {
  return omit(item, 'gk', '__v', '__p');
}

export function unwrapGSIK(item: IGSIKItem): any {
  if (item.__v) item[item.__v] = item.gk;

  if (item.__p) item = { ...item, ...JSON.parse(item.__p) };

  return omitGSIK(item);
}

export async function pksToEntities<T>(pks: string[], entity: string) {
  var outputs = await Promise.all(
    pks.map(
      (pk: string): Promise<DynamoDB.DocumentClient.GetItemOutput> =>
        AWS.get({
          TableName,
          Key: {
            pk,
            sk: entity
          }
        })
    )
  );

  return outputs.map(
    (data: DynamoDB.DocumentClient.GetItemOutput) =>
      <T>unwrapGSIK(data.Item as IGSIKItem)
  );
}

export function pickOne<T>(list: T[]): T {
  var length = list.length;

  return list[random(length)];
}

export function random(max: number): number {
  return Math.floor(Math.random() * max);
}

var hexDigits = '0123456789abcdef';

export function randomMac(): string {
  let macAddress = '';

  for (let i = 0; i < 6; i++) {
    macAddress += hexDigits.charAt(Math.round(Math.random() * 15));
    macAddress += hexDigits.charAt(Math.round(Math.random() * 15));
    if (i !== 5) macAddress += ':';
  }

  return macAddress;
}
