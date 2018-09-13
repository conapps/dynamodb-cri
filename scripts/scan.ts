import { DynamoDB } from 'aws-sdk';

import AWS from './aws';

export async function scan(
  options?: Partial<DynamoDB.DocumentClient.ScanInput>
) {
  var result = await AWS.scan({
    ...options,
    TableName: 'dynamodb-cri'
  });

  console.log(result);
}
