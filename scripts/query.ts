import { DynamoDB } from 'aws-sdk';

import AWS from './aws';

export async function query(
  options?: Partial<DynamoDB.DocumentClient.QueryInput>
) {
  var result = await AWS.query({
    ...options,
    TableName: 'dynamodb-cri',
    IndexName: 'gsik'
  });

  result.Items.forEach(item => {
    item[item.__v] = item.gk;
  });

  console.log(result);
}
