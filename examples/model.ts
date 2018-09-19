import * as cuid from 'cuid';
import { DocumentClient } from './aws';
import { DynamoDBCRI } from '../dist/src';
import { IDynamoDBCRIModel, IDynamoDBCRIGlobalConfig } from '../dynamodb-cri.d';

var params: IDynamoDBCRIGlobalConfig = {
  indexName: 'gsik',
  tableName: 'dynamodb-cri',
  tenant: 'tenant',
  documentClient: DocumentClient
};

DynamoDBCRI.config(params);

var EmployeeModel: IDynamoDBCRIModel = new DynamoDBCRI.Model({
  entity: 'employee',
  gsik: 'name',
  trackDates: true
});

async function main() {
  try {
    var result = await EmployeeModel.create({ email: 'JDoe@mail.com' });
    var id = result.item.id;
    console.log('Creating a new user', JSON.stringify(result, null, 2));
    console.log(
      `\nGetting the user`,
      JSON.stringify(await EmployeeModel.get({ id }), null, 2)
    );
    console.log(
      `\nUpdating the user`,
      JSON.stringify(
        await EmployeeModel.update({ id, name: 'John Doe' }),
        null,
        2
      )
    );
    console.log(
      `\nGetting list of users`,
      JSON.stringify(await EmployeeModel.query(), null, 2)
    );
    console.log(
      `\nDeleting the user`,
      JSON.stringify(await EmployeeModel.delete({ id }), null, 2)
    );
  } catch (error) {
    console.log(error);
  }
}

main();
