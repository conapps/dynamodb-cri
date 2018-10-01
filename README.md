# DynamoDB-CRI [![Build Status](https://travis-ci.org/conapps/dynamodb-cri.svg?branch=master)](https://travis-ci.org/conapps/dynamodb-cri)



## Introduction

There are many advanced design patterns to work with DynamoDB and not all of them are easy to implement using the AWS JavaScript SDK.

DynamoDB-CRI takes this into consideration by implementing one of the many advanced patterns and best practices detailed on the DynamoDB documentation site. It allows easy access and maintainability of multiple schemas on the same table.

The access pattern used to interact with DynamoDB through this library is called [ GSI overloading ](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-gsi-overloading.html). It uses a Global Secondary Index spanning the [sort-key](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-sort-keys.html) and a special attribute identified as `data`.

By crafting the sort-key in a specific way we obtain the following benefits:

- Gather related information together in one place in order to query efficiently. 
- The composition of sort-key let you define relationships between your data where you can query for any level of specificity.

When we talk about GSI overloading, we are saying that a Dynamo table can hold different types of items at once. Plus, the same attributes may exist on different items and can contain entirely different types of information. 

Lets look at an example of top level schema you can accomplish with our library:

| entity   | pk                        | sk                      | data(gsik) | Attributes |           |             |
| -------- | ------------------------- | ----------------------- | ---------- | ---------- | --------- | ----------- |
| Employee | cji0brylf0009whvm6afgahfs | tenant\|employee        | name       | email      | document  | picture     |
|          | cji0brylf0009whvm6afgahfs | tenant\|employee\|email | email      |            |           |             |
|          | cji0brylf0009whvm6afgahfs | tenant\|employee\|store | storeId    |            |           |             |
| Job      | cji0brylf2209whv12zqsmvae | tenant\|job             | position   | storeId    | storeName | isAvailable |
|          | cji0brylf2209whv12zqsmvae | tenant\|job\|storeId    | storeId    |            |           |             |
| Store    | cji0brylfw009aaseqwe1pdas | tenant\|degree          | name       | address    | type      |             |



So here we have three entities, an employee, a job and a store. Each of the entities have a main row where where you have all the information about each. There are also additional rows with duplicate information about these entities that we will call indexes.

In this example we use the sort-kwy to define what entity is defined at each row, and the tenant who owns it. Some sort-keys are suffixed with the name of one of the attributes store on the main entity row. This are the indexes. They allow us to run complex queries over the entities without having to instantiate more than one GSI.

Every row includes a `data` attribute but it represent a different type of value for each item on the table. For entities it represents the value most likely to be queried; and on indexes, they include the same data stored at the entity attribute referenced by the index name. For example: the `data` attribute of the `email` index row of the `employee` entity, contains the same information stored on the `email` attribute of the same `employee`.

Using this key schema we can:

- Look up an employee by email in the global secondary index, by searching over the `email` index.
- Use the global secondary index to find all employees working in a particular store by searching over the `store` index.
- Build relationships between the three entities.
- Search entities related to others.

## Implementation

So now that we have a view of what the design pattern is, here are implementation details.

- The schema for each type of item on the table are:

  - ```json
    // For the entities
    {
        "pk": "string",
        "sk": "string",
        "gk": "any",
        "__v": "string",
        "attribute1": "any",
        "attribute2": "any",
        // ...
        "attributeN": "any"
    }
    ```

  - ```json
    // For the indexes
    {
        "pk": "string",
        "sk": "string",
        "gk": "any",
        "__v": "string",
        "__p": "Object"
    }
    ```

- **pk**: Is the partition-key, defined as a string. 
- **sk**: Is the sort-key composed as `tenant|entity` for entities, or `tenant|entity|index` for indexes.
- **gk**: Is the global secondary index, it can be anything you want, as long as its stored as text.
- **__v**: Key reference of the value stored at the `gk` value. Ex: `email`.
- **__p**: For the indexes, instead of having many attributes, `__p` includes a projection of some of the attributes stored on its corresponding index.

This is how the library store data behind the scenes in Dynamo, but you don't have to be aware of it because it is abstracted from yoy by the library. 

On the developer side, you'll manipulate items like this:

```json
{
    "id": "cccccecewdcowmcw234fcw",
    "name": "Joe Poe",
    "email": "jpoel@mial.com",
    "document": "123.231.2312",
    "storeId": "casofqeonfqowefd",
    "storeName": "SuperStore"
}
```

And the library will put this item in the DynamoDB table:

```json
{
    "pk":"cccccecewdcowmcw234fcw",
    "sk": "tenant|employee",
    "gk": "Joe Poe",
    "__v": "name",
    "email": "jpoel@mial.com",
    "document": "123.231.2312",
    "storeId": "casofqeonfqowefd",
    "storeName": "SuperStore"
}
```

If you have an index over the `store` attribute with the `name` projected onto it, the library will also save this item:

```json
{
    "pk": "cccccecewdcowmcw234fcw",
    "sk": "tenant|employee|store",
    "gk": "casofqeonfqowefd",
    "__v": "storeId",
    "__p": "{'storeName': 'SueprStore'}"
}
```

One of the complexities introduced by this pattern is maintaining the data store on the indexes up to date. In order to mitigate this the library provides methods to update the indexes whenever an entity gets updated. You just have to worry about using the CRUD methods for the main entities and the library updates the indexes by itself.

The library also provides a method to keep the indexes updated, decoupled from the CRUD methods. It does it by consuming the table's stream inside a Lambda function.

So, this library aims to help you take advantage of this access pattern by providing a framework that provides:

- A simplified way to handle the overloaded gsi pattern.
- CRUD methods to handle entities.
- Have all of your entities in one table, balancing the Read Capacity Units and Write Capacity Units required to handle them.
- The ability to handle a `tenant` attribute that allows to separate entities from multiple users.
- Options to track all indexes and update them when updating the main entity.
- An option to track indexes via Lambda and DynamoDB streams.

## Install

You can get the code through `npm` or `yarn`.

```bash
yarn add dynamodb-cri

npm install dynamodb-cri
```

[Here is the link to the NPM site.](https://www.npmjs.com/package/dynamodb-cri)

## Getting started

Before we can start defining our models, we should configure the library:

```typescript
var { DynamoDBCRI } = require('dynamodb-cri');
// or using TypeScript
import { DynamoDBCRI } from 'dynamodb-cri'

DynamoDBCRI.config({
  indexName: process.env.INDEX // the Index name of the created table.
  tenant: process.env.TENANT,
  documentClient: new AWS.DynamoDB.DocumentClient(),
  tableName: process.env.TABLE_NAME
});
```

Creating the models: 

```typescript
var EmployeeModel = new DynamoDBCRI.Model({
  entity: 'employee'
  indexes: [{
    indexName: 'storeId',
    projections: ['storeName']
  },{
    indexName: 'email' 
  }],
  gsik: 'name', // the global secondary key for the model
  track: true, // Tracks `createdAt` and `updatedAt` attributes
  trackIndexes: true // Tracks changes and updates secondary indexes entities
});

/** 
 * This will create items on the table with the following sk values:
 * - tenant|employee
 * - tenant|employee|storeId
 * - tenant|employee|email 
*/

// Get
EmployeeModel.get({ id: 'cfjasdasdm2oqwedas' });

// Create
EmployeeModel.create({ 
    id: 'abcd', 
    name: 'John Doe', 
    email: 'jd@mail.com', 
    storeId: 'csajdas',
    storeName: 'Store N1'
});

// Create
EmployeeModel.create({ 
    id: 'abcd', 
    storeName: 'Store N1'
}, 'storeId');

// Update
EmployeeModel.update({
  id: 'abcd',
  name: 'Jane Doe',
  email: 'JaneDoe@mail.com'
});

// Delete
EmployeeModel.delete({id: 'cfjasdasdm2oqwedas'});

// Query
/**
 * Offset values are handled as base64 encoded DynamoDB.DocumentClient keys.
 * This is to simplify the handling of the offset values. There are some helper
 * functions that can be taken from this library that can encode and decode
 * base64 strings on NodeJS.
 */

/**
 * Query the employees entities by its main value: `name`. 
 * The expression can use any of Dynamo's query expression operators like: 
 * starts-with, between, >, <, and so on.
 */
EmployeeModel.index({
  keyCondition: {
  	key: 'Joe Doe',
    expression: '#key = :key'
  },
  offset: btoa(JSON.stringify({0: {id: 'cwdhcaecwpsdc'}})),
  limit: 10
});

/**
 * Query the employees entities by its `document` index.
 */
EmployeeModel.index({
  keyCondition: {
  	key: '123',
    expression: 'begins_with(#key,:key)'
  },
  index: 'document',
  unwrapIndexItems: true // Gets all the information from the entity
  offset: btoa(JSON.stringify({0: {id: 'cwdhcaecwpsdc'}})),
  limit: 10
});

/**
 * Lambda function handler to maintain all the indexes by consuming the table's
 * stream.
 */
exports.handler = async (event) => {
  await DynamoDBCRI.hookDynamoDBStreams([EmployeeModel], event);
}
```

## Examples

On the examples folder you can see how you can interact with the library. I recommend you run the examples using [Dynalite](https://github.com/mhart/dynalite) which is a great tool to run DynamoDB locally.

Running the `setup.js` script will create the example table on the DynamoDB instance you provide. By default, it will try to get a Dynalite instance working on port 8989.

```bash
ts-node examples/setup.ts
```

You can then see the library in action by running:

```bash
ts-node examples/model.ts
```

If you would like to see or offer more examples let me know.

## Tests

To run the tests you must have [`jest`](https://facebook.github.io/jest/) installed globally or run `yarn install` to install it locally.

Then run `yarn test` or `npm test` to see the results.

## LICENCE

MIT
