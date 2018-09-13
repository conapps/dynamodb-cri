import { DynamoDB } from 'aws-sdk';

import AWS from './aws';

export async function deleteTable() {
  var params: DynamoDB.DeleteTableInput = {
    TableName: 'dynamodb-cri'
  };

  var result = await AWS.deleteTable(params);

  console.log(JSON.stringify(result, null, 2));
}
