import { DynamoDB } from 'aws-sdk';
import { db } from './aws';

export async function createTable() {
  var params: DynamoDB.CreateTableInput = {
    AttributeDefinitions: [
      {
        AttributeName: 'pk',
        AttributeType: 'S'
      },
      {
        AttributeName: 'sk',
        AttributeType: 'S'
      },
      {
        AttributeName: 'gk',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'pk',
        KeyType: 'HASH'
      },
      {
        AttributeName: 'sk',
        KeyType: 'RANGE'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    },
    GlobalSecondaryIndexes: [
      {
        IndexName: 'gsik',
        KeySchema: [
          {
            AttributeName: 'sk',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'gk',
            KeyType: 'RANGE'
          }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1
        }
      }
    ],
    TableName: 'dynamodb-cri'
  };

  var result = await db.createTable(params).promise();

  console.log(JSON.stringify(result, null, 2));
}

async function create() {
  await createTable();
}

create();
