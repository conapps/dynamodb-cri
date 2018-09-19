import * as aws from 'aws-sdk';

export var db = new aws.DynamoDB({
  region: 'us-east-1',
  endpoint: 'http://localhost:8989'
});

export var DocumentClient = new aws.DynamoDB.DocumentClient({
  service: db
});
