import AWS from './aws';

var TableName = 'dynamodb-cri-test';

export async function deleteAp(pk: string, sk: string) {
  var Key = {
    pk,
    sk
  };
  await AWS.delete({
    TableName,
    Key
  });
}
