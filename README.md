# DynamoDB-CRI [![Build Status](https://travis-ci.org/conapps/dynamodb-cri.svg?branch=master)](https://travis-ci.org/conapps/dynamodb-cri)



## Introduction

There are many advanced design patterns to work with DynamoDB  and not all of them are easy to implement using the AWS JavaScript SDK  that provides access to DynamoDB.

DynamoDB-CRI library takes this into account and chooses one of the many advance design patterns and uses the best practices principles to build all its functionalities, allowing the user to have easy access and maintainability of the schema.

The main concepts that were used to create the access pattern to the database was the [sort-key](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-sort-keys.html) and global secondary index design. Specifically we used[ overloading of GSI ](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-gsi-overloading.html). 

With a good design in the sort-key you can accomplish these two benefits:

- Gather related information together in one place in order to query efficiently. 
- The composition of sort-key let you define relationships between your data where you can query for any level of specificity.

When we talk about GSI overloading, we are saying that in Dynamo a table can hold many different types of data items at one time. In addition, the same attribute in different items can contain entirely different types of information. 

Mixing these two concepts is that the design pattern implemented for this library was born.

Lets look at an example of top level schema you can accomplish with our library:

| entity   | pk                        | sk                      | data(gsik) | Attributes |           |             |
| -------- | ------------------------- | ----------------------- | ---------- | ---------- | --------- | ----------- |
| Employee | cji0brylf0009whvm6afgahfs | tenant\|employee        | name       | email      | document  | picture     |
|          | cji0brylf0009whvm6afgahfs | tenant\|employee\|email | email      |            |           |             |
|          | cji0brylf0009whvm6afgahfs | tenant\|employee\|store | storeId    |            |           |             |
| Job      | cji0brylf2209whv12zqsmvae | tenant\|job             | position   | storeId    | storeName | isAvailable |
|          | cji0brylf2209whv12zqsmvae | tenant\|job\|storeId    | storeId    |            |           |             |
| Store    | cji0brylfw009aaseqwe1pdas | tenant\|degree          | name       | address    | type      |             |



So here we have three entities, an employee, a job and a store. Each of the entities have a main row where where you have all the information about the entities. There are also additional rows with duplicate information about these entities that we will call indexes.

In this example we use the benefits of defining a good sort-key schema in order to define what's the information that is present in each row.  We have prefixed a tenant, after that comes the entity and when useful we have a index referring to the data why we're gonna be able to do a query or want to store information about.

Also, we have used the GSI overloading because  each gsik have a different data type. 

Using this schema some of the benefits are:

- Look up an employee by email in the global secondary index, by searching on the `email` attribute value.
- Use the global secondary index to find all employees working in a particular store by searching on `tenant|employee|store`
- Build relationships between the three entities and searching them as easy as doing one query to the DB.

## Implementation

So now that we have a view of what the design pattern is, here are the details of implementation.

- The schema in the DB is the following:

  ​	

  - ```json
    // For the main ROW
    {
        "pk": "string",
        "sk": "string",
        "gk": "any",
        "__v": "string",
        "attribute1": "any",
        "attribute2": "any"
    }
    ```

  - ```
    // For the extended ROWs
    {
        "pk": "string",
        "sk": "string",
        "gk": "any",
        "__v": "string",
        "__p": "Object"
    }
    ```



- **pk**: Is the partition-key, in our case we defined as a string 
- **sk**: Is the sort-key composed by `tenant|entity` or `tenant|entity|index`
- **gk**: Is the global secondary index, it can be anything you want.
- **__v**: Reference which attribute is in the gsik
- **__p**: For the extended rows, instead of having many attributes, `__p` is the projection of the attributes.

This is how the library store data behind the scenes in Dynamo, but you don't have to be aware of it because it abstracts you from this complexity.  You will only have to put an object as this example:

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



And the library will put in dynamo as follows:

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



If you have an index for store with the name projected:

```json
{
    "pk": "cccccecewdcowmcw234fcw",
    "sk": "tenant|employee|store",
    "gk": "casofqeonfqowefd",
    "__v": "storeId",
    "__p": "{'storeName': 'SueprStore'}"
}
```



One of the complexity of having this structure is having the data up to date in all the rows. In order to mitigate this the library provides methods to keep up to date the rows only by updating the main rows of the schema. You just have to worry about doing the CRUD methods for the main entities and the library updates the index rows by itself.

We also we provide a method to perform the index update actions decoupled from the basic functions. This method is for those who work with lambda functions. Simply by adding this function to a lambda function the library will take care of keeping all the index information up to date in a decoupled way.

So, this library aims to help you build this design pattern by providing a framework that provides:

- A simplified way to implement an advanced design pattern.
- CRUD methods for easy access.
- Have all of your entities in one table and benefit from balancing the Read Capacity Units and Write Capacity Units
- The ability to handle a `tenant` attribute that would allow to segment the information of multiple clients on the same table.
- Options to track all indexes and update them when updating the main entity.
- An option to track indexes via lambda.

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
  indexName: process.env.INDEX // the Index of the table created.
  tenant: process.env.TENANT,
  documentClient: new AWS.DynamoDB.DocumentClient(),
  tableName: process.env.TABLE_NAME
});
```



Creating the model: 

```typescript
var EmployeeModel = new DynamoDBCRI.Model({
  entity: 'employee'
  indexes: [ { indexName: 'storeId', proyections: ['storeName'] },
  { indexName: 'email' }]
  gsik: 'name', // the global secondary key for the model
  track: true,// Tracks `createdAt` and `updatedAt` attributes
  trackIndexes: true // Tracks changes and updates secondary indexes entities
});

/** This will create three rows with these sk:
* tenant|employee
* tenant|employee|storeId
* tenant|employee|email 
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

// Quering the main row, the expression can be any of Dynamo's query expressions
// such as starts-with, between, >, <, and so on.
EmployeeModel.index({
  keyCondition: {
  	key: 'Joe Doe',
    expression: '#key = :key'
  },
  offset: btoa(JSON.stringify({0: {id: 'cwdhcaecwpsdc'}})),
  limit: 10
});

// Quering the index rows
EmployeeModel.index({
  keyCondition: {
  	key: '123',
    expression: 'begins_with(#key,:key)'
  },
  index: 'document',
  unwrapIndexItems: true // Option to bring all the information from the main row also
  offset: btoa(JSON.stringify({0: {id: 'cwdhcaecwpsdc'}})),
  limit: 10
});


// Lambda option to hook all changes in the main rows

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
