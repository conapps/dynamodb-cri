# DynamoDB-CRI

The AWS JavaScript SDK provides access to DynamoDB without restrains. But sometimes creating a model or defining one for the tables to reduce costs is difficult. With this library we take a one table model design pattern and we build a library around that model to easy the access of data and maintenance of all indexes and data updated.

This library aims to help with this problems by providing a framework that provides:

- CRUD methods for easy access.
- The ability to handle a `tenant` attribute that would allow to segment the information of multiple clients on the same table.
- Options to track all indexes
- An option to track indexes via lambda 

## Install

You can get the code through `npm` or `yarn`.

```bash
yarn add dynamodb-cri

npm install dynamodb-cri
```

[Here is the link to the NPM site.](http://google.com)

## Getting started

Before we can start defining our models, we should configure the library:

```typescript
var { DynamoDBCRI } = require('dynamodb-cri');

DynamoDBCRI.config({
  indexName: process.env.INDEX
  tenant: process.env.TENANT,
  documentClient: new AWS.DynamoDB.DocumentClient(),
  table: process.env.TABLE_NAME
});
```



Creating the model: 

```typescript
var UserModel = DynamoDBCRI.create({
  entity: 'user'
  indexes: [ { indexName: 'email', proyections: ['document'] },
  { indexName: 'document' }]
  gsik: 'name', // the global secondary key for the model
  track: true,// Tracks `createdAt` and `updatedAt` attributes
  trackIndexes: true // Tracks changes and updates secondary indexes entities
});

// Get
UserModel.get({ id: 'abc' });

// Create
UserModel.create({ id: 'abcd', name: 'John Doe' });

// Update
UserModel.update({
  id: 'abcd',
  name: 'Jane Doe',
  email: 'JaneDoe@mail.com'
});

// Delete
UserModel().delete({id: 'abc'});

// Query
/**
 * Offset values are handled as base64 encoded DynamoDB.DocumentClient keys.
 * This is to simplify the handling of the offset values. There are some helper
 * functions that can be taken from this library that can encode and decode
 * base64 strings on NodeJS.
 */
UserModel.index({
  offset: btoa(JSON.stringify({0: {id: 'abc'}})),
  limit: 10
});

// All the methods described before are lazily evaluated. Meaning they won't run
// until you call the `promise()` methods on them.

// Promise
model.get({id: 'abc'}).promise()
  .then((data) => {
    /* ... */
  })
  .catch((err) => {
    /* ... */
  });;
// or the async/await approach
await model.get({id}).promise()

```

