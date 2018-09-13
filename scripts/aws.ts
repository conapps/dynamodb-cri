import * as aws from 'aws-sdk';

var DynamoDB = new aws.DynamoDB({
  region: 'us-east-1'
});
var DocumentClient = new aws.DynamoDB.DocumentClient({
  service: DynamoDB
});

class AWS {
  createTable(
    input: aws.DynamoDB.CreateTableInput
  ): Promise<aws.DynamoDB.CreateTableOutput> {
    return DynamoDB.createTable(input).promise();
  }

  deleteTable(
    input: aws.DynamoDB.DeleteTableInput
  ): Promise<aws.DynamoDB.CreateTableOutput> {
    return DynamoDB.deleteTable(input).promise();
  }

  put(
    input: aws.DynamoDB.DocumentClient.PutItemInput
  ): Promise<aws.DynamoDB.DocumentClient.PutItemOutput> {
    return DocumentClient.put(input).promise();
  }

  scan(
    input: aws.DynamoDB.DocumentClient.ScanInput
  ): Promise<aws.DynamoDB.DocumentClient.ScanOutput> {
    return DocumentClient.scan(input).promise();
  }

  query(
    input: aws.DynamoDB.DocumentClient.QueryInput
  ): Promise<aws.DynamoDB.DocumentClient.QueryOutput> {
    return DocumentClient.query(input).promise();
  }

  get(
    input: aws.DynamoDB.DocumentClient.GetItemInput
  ): Promise<aws.DynamoDB.DocumentClient.GetItemOutput> {
    return DocumentClient.get(input).promise();
  }

  update(
    input: aws.DynamoDB.DocumentClient.UpdateItemInput
  ): Promise<aws.DynamoDB.DocumentClient.UpdateItemOutput> {
    return DocumentClient.update(input).promise();
  }

  delete(
    input: aws.DynamoDB.DocumentClient.DeleteItemInput
  ): Promise<aws.DynamoDB.DocumentClient.DeleteItemOutput> {
    return DocumentClient.delete(input).promise();
  }
}

export default new AWS();
