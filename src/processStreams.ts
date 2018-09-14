import { unwrapAllAttributeValues } from '../utils/unwrapRecords';
import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda';
import { IDynamoDBCRIModel, IItem } from './types';
import { get, find } from 'lodash';

export async function processStreams(
  models: Array<() => IDynamoDBCRIModel>,
  event: DynamoDBStreamEvent
) {
  for (let record of event.Records) {
    var eventName = record.eventName;
    switch (eventName) {
      case 'INSERT':
        await createIndexesItems(record, models);
        break;
      case 'MODIFY':
        await updateIndexesItems(record, models);
        break;
      case 'REMOVE':
        await deleteIndexesItems(record, models);
        break;
      default:
        break;
    }
  }
}

async function createIndexesItems(
  record: DynamoDBRecord,
  models: Array<() => IDynamoDBCRIModel>
) {
  var entity = get(record, 'dynamodb.Keys.sk.S').split('|')[1];

  var model = findModel(models, entity);

  if (model === undefined) {
    throw new Error('No Model provided for this entity');
  }

  var body = buildBodyFromRecord(record);

  return await model().putIndexItems(body);
}

async function updateIndexesItems(
  record: DynamoDBRecord,
  models: Array<() => IDynamoDBCRIModel>
) {
  var entity = get(record, 'dynamodb.Keys.sk.S').split('|')[1];

  var model = findModel(models, entity);

  if (model === undefined) {
    throw new Error('No Model provided for this entity');
  }

  var body = buildBodyFromRecord(record);

  return await model().updateIndexesItems(body);
}

async function deleteIndexesItems(
  record: DynamoDBRecord,
  models: Array<() => IDynamoDBCRIModel>
) {
  var entity = get(record, 'dynamodb.Keys.sk.S').split('|')[1];

  var model = findModel(models, entity);

  if (model === undefined) {
    throw new Error('No Model provided for this entity');
  }

  var id = get(record, 'dynamodb.Keys.pk.S');

  return await model().deleteIndexItems({ id });
}

function buildBodyFromRecord(record: DynamoDBRecord): IItem {
  var newItem = get(record, 'dynamodb.NewImage');

  return unwrapAllAttributeValues(newItem);
}

function findModel(
  models: Array<() => IDynamoDBCRIModel>,
  key: string
): () => IDynamoDBCRIModel {
  var item = find(models, (elem: () => IDynamoDBCRIModel) => {
    return elem().entity === key;
  });

  return item !== undefined ? item : undefined;
}
