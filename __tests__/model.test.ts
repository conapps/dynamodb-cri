import * as sinon from 'sinon';
import * as cuid from 'cuid';
import { omit } from 'lodash';
import { DynamoDB, config as AWSConfig } from 'aws-sdk';
import { DynamoDBCRI } from '../src';
import { DynamoDBCRIModel } from '../src/model';
import {
  IDynamoDBCRIModelConfig,
  IDynamoDBCRIGlobalConfig
} from '../src/types';
AWSConfig.update({
  region: 'us-east-1'
});

var db = new DynamoDB.DocumentClient({
  region: 'us-east-1'
});

var indexName = 'TestIndex';
var tableName = 'TestTable';
var tenant = 'TestTenant';

var params: IDynamoDBCRIGlobalConfig = {
  indexName,
  tableName,
  tenant,
  documentClient: db
};

DynamoDBCRI.config(params);

var entity = 'testEntity';
var indexes = [
  { indexName: 'email', proyections: ['document'] },
  { indexName: 'document' }
];
var gsik = 'name';

var config: IDynamoDBCRIModelConfig = {
  entity,
  indexes,
  gsik
};

var TestModel = DynamoDBCRI.createModel(config);

var id = cuid();
var name = 'SomeName';
var email = 'Test@mail.com';
var document = '123.456.789-9';

describe('Model', () => {
  test('should be a function', () => {
    expect(typeof DynamoDBCRIModel).toBe('function');
  });

  test('should be an instance of DynamoDBCRIModel', () => {
    expect(TestModel() instanceof DynamoDBCRIModel).toBe(true);
  });

  describe('#promise()', () => {
    test('should be a function', () => {
      expect(typeof TestModel().promise).toBe('function');
    });

    test('should return a promise', () => {
      expect(TestModel().promise() instanceof Promise).toBe(true);
    });
  });
  describe('#get()', () => {
    var getStub: sinon.SinonStub;

    beforeEach(() => {
      getStub = sinon.stub(db, 'get');
      getStub.returns({
        promise: () => Promise.resolve({ Item: { id, name } })
      });
    });

    afterEach(() => {
      getStub.restore();
    });

    test('should be a function', () => {
      expect(typeof TestModel().get).toBe('function');
    });

    test('should configure a call to the `documentClient.get` function', async () => {
      await TestModel()
        .get({ id })
        .promise();

      expect(getStub.calledOnce).toBe(true);
    });

    test('should call the `documentClient.get` function with appropriate params', async () => {
      await TestModel()
        .get({ id })
        .promise();

      expect(getStub.args[0][0]).toEqual({
        TableName: tableName,
        Key: {
          pk: id,
          sk: `${tenant}|${entity}`
        }
      });
    });

    test('should call the `documentClient.get` function with appropriate params', async () => {
      await TestModel()
        .get({ id, index: 'mail' })
        .promise();

      expect(getStub.args[0][0]).toEqual({
        TableName: tableName,
        Key: {
          pk: id,
          sk: `${tenant}|${entity}|mail`
        }
      });
    });

    test('should handle an error with the `documentClient.get` method', async () => {
      getStub.restore();
      getStub = sinon.stub(db, 'get');
      getStub.callsFake(() => {
        throw new Error('Error with `documentClient.get` method');
      });

      await TestModel()
        .get({ id })
        .promise()
        .catch(error => {
          expect(error).not.toBe(null);
          expect(error.message).toBe('Error with `documentClient.get` method');
        });

      try {
        await TestModel()
          .get({ id })
          .promise();
      } catch (error) {
        expect(error).not.toBe(null);
        expect(error.message).toBe('Error with `documentClient.get` method');
      }
    });
  });
  describe('#delete()', () => {
    var deleteStub: sinon.SinonStub;

    beforeEach(() => {
      deleteStub = sinon.stub(db, 'delete');
      deleteStub.returns({
        promise: () => Promise.resolve({})
      });
    });

    afterEach(() => {
      deleteStub.restore();
    });

    test('should be a function', () => {
      expect(typeof TestModel().delete).toBe('function');
    });

    /***************** Tests for models without index tracking *****************/
    test('should configure a call to the `documentClient.delete` function', async () => {
      await TestModel()
        .delete({ id })
        .promise();

      return expect(deleteStub.calledOnce).toBe(true);
    });

    test('should call the `documentClient.delete` method with appropriate params', async () => {
      await TestModel()
        .delete({ id })
        .promise();

      expect(deleteStub.args[0][0]).toEqual({
        TableName: tableName,
        Key: {
          pk: id,
          sk: `${tenant}|${entity}`
        }
      });
    });

    test('should handle an error with the `documentClient.delete` method', async () => {
      deleteStub.restore();
      deleteStub = sinon.stub(db, 'delete');
      deleteStub.callsFake(() => {
        throw new Error('Error with `documentClient.delete` method');
      });

      await TestModel()
        .delete({ id })
        .promise()
        .catch(error => {
          expect(error).not.toBe(null);
          expect(error.message).toBe(
            'Error with `documentClient.delete` method'
          );
        });

      try {
        await TestModel()
          .delete({ id })
          .promise();
      } catch (error) {
        expect(error).not.toBe(null);
        expect(error.message).toBe('Error with `documentClient.delete` method');
      }
    });

    /***************** Tests for models with index tracking *****************/
    var TestModelWithTrack = DynamoDBCRI.createModel({
      ...config,
      trackIndexes: true
    });

    test('should configure a calls to the `documentClient.delete` function', async () => {
      await TestModelWithTrack()
        .delete({ id })
        .promise();

      return expect(deleteStub.callCount).toBe(3);
    });

    test('should call the `documentClient.delete` method with appropriate params', async () => {
      await TestModelWithTrack()
        .delete({ id })
        .promise();

      expect(deleteStub.args[0][0]).toEqual({
        TableName: tableName,
        Key: {
          pk: id,
          sk: `${tenant}|${entity}`
        }
      });

      expect(deleteStub.args[1][0]).toEqual({
        TableName: tableName,
        Key: {
          pk: id,
          sk: `${tenant}|${entity}|email`
        }
      });

      expect(deleteStub.args[2][0]).toEqual({
        TableName: tableName,
        Key: {
          pk: id,
          sk: `${tenant}|${entity}|document`
        }
      });
    });
  });

  describe('#create()', () => {
    var putStub: sinon.SinonStub;

    beforeEach(() => {
      putStub = sinon.stub(db, 'put');
      putStub.returns({
        promise: () => Promise.resolve({})
      });
    });

    afterEach(() => {
      putStub.restore();
    });

    test('should be a function', () => {
      expect(typeof TestModel().create).toBe('function');
    });

    /******* Tests for Model without indexes ********/
    var TestModelWOIndexes = DynamoDBCRI.createModel(omit(config, ['indexes']));

    test('should configure a call to the `documentClient.put` function', async () => {
      await TestModelWOIndexes()
        .create({ id, name, email, document })
        .promise();

      return expect(putStub.calledOnce).toBe(true);
    });

    test('should return the created item', async () => {
      var data = await TestModelWOIndexes()
        .create({ id, name })
        .promise();

      expect(data).toEqual({ item: { id, name } });
    });

    test('should add a random id value if undefined', async () => {
      var data = await TestModelWOIndexes()
        .create({ name })
        .promise();
      expect(data && !!data.item.id).toEqual(true);
    });

    test('should add a `createdAt` and `updatedAt` values if `track` is true', async () => {
      var TestModelWOIndexes = DynamoDBCRI.createModel({
        ...omit(config, ['indexes']),
        trackDates: true
      });
      var data = await TestModelWOIndexes()
        .create({ name })
        .promise();

      data || (data = {});
      expect(!!data.item.createdAt).toEqual(true);
      expect(!!data.item.updatedAt).toEqual(true);
      expect(data.item.createdAt === data.item.updatedAt).toEqual(true);
    });

    test('should call the `documentClient.put` function with appropriate params', async () => {
      await TestModelWOIndexes()
        .create({ id, name, email, document })
        .promise();

      expect(putStub.args[0][0]).toEqual({
        TableName: tableName,
        Item: {
          pk: id,
          sk: `${tenant}|${entity}`,
          gk: name,
          document,
          email,
          __v: 'name'
        }
      });
    });

    /******* Tests for Model with indexes without tracking ********/

    test('should configure a call to the `documentClient.put` function', async () => {
      await TestModel()
        .create({ id, name, email, document })
        .promise();

      return expect(putStub.calledOnce).toBe(true);
    });

    test('should call the `documentClient.put` function with appropriate params', async () => {
      await TestModel()
        .create({ id, name, email, document })
        .promise();

      expect(putStub.args[0][0]).toEqual({
        TableName: tableName,
        Item: {
          pk: id,
          sk: `${tenant}|${entity}`,
          gk: name,
          document,
          email,
          __v: 'name'
        }
      });
    });

    test('should return the created item', async () => {
      var data = await TestModel()
        .create({ id, name })
        .promise();

      expect(data).toEqual({ item: { id, name } });
    });

    /******* Tests for Model with indexes with tracking ********/
    var TestModelWithTrack = DynamoDBCRI.createModel({
      ...config,
      trackIndexes: true
    });

    test('should configure a call to the `documentClient.put` function', async () => {
      await TestModelWithTrack()
        .create({ id, name, email, document })
        .promise();

      return expect(putStub.callCount).toBe(3);
    });

    test('should call the `documentClient.put` function with appropriate params', async () => {
      await TestModelWithTrack()
        .create({ id, name, email, document })
        .promise();

      expect(putStub.args[0][0]).toEqual({
        TableName: tableName,
        Item: {
          pk: id,
          sk: `${tenant}|${entity}`,
          gk: name,
          document,
          email,
          __v: 'name'
        }
      });

      expect(putStub.args[1][0]).toEqual({
        TableName: tableName,
        Item: {
          pk: id,
          sk: `${tenant}|${entity}|email`,
          gk: email,
          __v: 'email',
          __p: '{"document":"123.456.789-9"}'
        }
      });

      return expect(putStub.args[2][0]).toEqual({
        TableName: tableName,
        Item: {
          pk: id,
          sk: `${tenant}|${entity}|document`,
          gk: document,
          __v: 'document'
        }
      });
    });

    test('should return the created item', async () => {
      var data = await TestModelWithTrack()
        .create({
          id,
          name,
          email,
          document
        })
        .promise();

      expect(data).toEqual({ item: { id, name, email, document } });
    });
    test('should handle an error with the `documentClient.put` method', async () => {
      putStub.restore();
      putStub = sinon.stub(db, 'put');
      putStub.callsFake(() => {
        throw new Error('Error with `documentClient.put` method');
      });

      await TestModel()
        .create({ id, name })
        .promise()
        .catch(error => {
          expect(error).not.toBe(null);
          expect(error.message).toBe('Error with `documentClient.put` method');
        });

      try {
        await TestModel()
          .create({ id, name })
          .promise();
      } catch (error) {
        expect(error).not.toBe(null);
        expect(error.message).toBe('Error with `documentClient.put` method');
      }
    });
  });

  describe('#update()', () => {
    var updateStub: sinon.SinonStub;
    var getStub: sinon.SinonStub;
    var putStub: sinon.SinonStub;

    beforeEach(() => {
      updateStub = sinon.stub(db, 'update');
      updateStub.returns({
        promise: () => Promise.resolve({})
      });
      getStub = sinon.stub(db, 'get');
      getStub.returns({
        promise: () =>
          Promise.resolve({
            Item: {
              id,
              name: 'newName',
              email: 'newm@mail.com',
              document: '1.234.567-8'
            }
          })
      });
      putStub = sinon.stub(db, 'put');
      putStub.returns({
        promise: () => Promise.resolve({})
      });
    });

    afterEach(() => {
      updateStub.restore();
      getStub.restore();
      putStub.restore();
    });

    test('should be a function', () => {
      expect(typeof TestModel().update).toBe('function');
    });

    /******* Tests for Model with indexes without tracking ********/

    test('should call the `documentClient.update` function', async () => {
      await TestModel()
        .update({ id, name: 'newName' })
        .promise();

      expect(updateStub.calledOnce).toBe(true);
    });

    test('should call the `documentClient.update` with valid params', async () => {
      var name = 'newName';
      await TestModel()
        .update({ id, name })
        .promise();

      expect(updateStub.args[0][0]).toEqual({
        TableName: tableName,
        Key: {
          pk: id,
          sk: `${tenant}|${entity}`
        },
        UpdateExpression: 'SET #name = :name',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ExpressionAttributeValues: {
          ':name': name
        }
      });
    });

    test('should add an `updatedAt` value if `track` is `true`', async () => {
      var _config = { ...config, trackDates: true };
      var TestModel = DynamoDBCRI.createModel(_config);

      var data = await TestModel()
        .update({ id, name })
        .promise();

      expect(data).not.toBe(undefined);
      expect(data && typeof data.item.updatedAt).toBe('string');
    });

    test('should fail if the hash key is missing', async () => {
      await TestModel()
        .update({ name })
        .promise()
        .catch(error => {
          expect(error).not.toBe(null);
          expect(error.message).toBe("The value of id can't be undefined");
        });
    });

    test('should construct the `UpdateExpression` param correctly', async () => {
      await TestModel()
        .update({ id, name, email })
        .promise();

      var params = updateStub.args[0][0];
      expect(params.UpdateExpression).toEqual(
        'SET #name = :name, #email = :email'
      );
    });

    test('should construct the `ExpressionAttributeValues` correctly', async () => {
      await TestModel()
        .update({ id, name, email })
        .promise();

      var params = updateStub.args[0][0];
      expect(params.ExpressionAttributeNames).toEqual({
        '#name': 'name',
        '#email': 'email'
      });
    });

    test('should construct the `ExpressionAttributeNames` correctly', async () => {
      await TestModel()
        .update({ id, name, email })
        .promise();

      var params = updateStub.args[0][0];
      expect(params.ExpressionAttributeValues).toEqual({
        ':name': name,
        ':email': email
      });
    });

    /******* Tests for Model with indexes without tracking ********/

    var TestModelWithTrack = DynamoDBCRI.createModel({
      ...config,
      trackIndexes: true
    });

    test('should call the `documentClient.update` function but not update the indexes', async () => {
      await TestModelWithTrack()
        .update({ id, name: 'newName' })
        .promise();

      expect(updateStub.calledOnce).toBe(true);
      expect(getStub.called).toBe(false);
      expect(putStub.called).toBe(false);
    });

    test('should call the `documentClient.update` with valid params', async () => {
      var name = 'newName';
      await TestModelWithTrack()
        .update({ id, name })
        .promise();

      expect(updateStub.args[0][0]).toEqual({
        TableName: tableName,
        Key: {
          pk: id,
          sk: `${tenant}|${entity}`
        },
        UpdateExpression: 'SET #name = :name',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ExpressionAttributeValues: {
          ':name': name
        }
      });
    });

    test('should call the `documentClient.update` function and update the indexes', async () => {
      await TestModelWithTrack()
        .update({
          id,
          name: 'newName',
          email: 'newm@mail.com',
          document: '1.234.567-8'
        })
        .promise();

      expect(updateStub.calledOnce).toBe(true);
      expect(getStub.calledOnce).toBe(true);
      expect(putStub.callCount).toBe(2);
    });

    test('should call the `documentClient.update` with valid params', async () => {
      var name = 'newName';
      await TestModelWithTrack()
        .update({
          id,
          name,
          email: 'newm@mail.com',
          document: '1.234.567-8'
        })
        .promise();

      expect(updateStub.args[0][0]).toEqual({
        TableName: tableName,
        Key: {
          pk: id,
          sk: `${tenant}|${entity}`
        },
        UpdateExpression:
          'SET #name = :name, #email = :email, #document = :document',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#document': 'document',
          '#email': 'email'
        },
        ExpressionAttributeValues: {
          ':name': name,
          ':email': 'newm@mail.com',
          ':document': '1.234.567-8'
        }
      });

      expect(getStub.args[0][0]).toEqual({
        TableName: tableName,
        Key: {
          pk: id,
          sk: `${tenant}|${entity}`
        }
      });

      expect(putStub.args[0][0]).toEqual({
        TableName: tableName,
        Item: {
          pk: id,
          sk: `${tenant}|${entity}|email`,
          gk: 'newm@mail.com',
          __v: 'email',
          __p: JSON.stringify({ document: '1.234.567-8' })
        }
      });

      expect(putStub.args[1][0]).toEqual({
        TableName: tableName,
        Item: {
          pk: id,
          sk: `${tenant}|${entity}|document`,
          gk: '1.234.567-8',
          __v: 'document'
        }
      });
    });

    test('should handle an error with the `documentClient.get` method', async () => {
      getStub.restore();
      getStub = sinon.stub(db, 'get');
      getStub.callsFake(() => {
        throw new Error('Error with `documentClient.get` method');
      });

      await TestModel()
        .update({ id, name })
        .promise()
        .catch(error => {
          expect(error).not.toBe(null);
          expect(error.message).toBe('Error with `documentClient.get` method');
        });

      try {
        await TestModel()
          .update({ id, name })
          .promise();
      } catch (error) {
        expect(error).not.toBe(null);
        expect(error.message).toBe('Error with `documentClient.get` method');
      }
    });

    test('should handle an error with the `documentClient.put` method', async () => {
      putStub.restore();
      putStub = sinon.stub(db, 'put');
      putStub.callsFake(() => {
        throw new Error('Error with `documentClient.put` method');
      });

      await TestModel()
        .update({ id, name })
        .promise()
        .catch(error => {
          expect(error).not.toBe(null);
          expect(error.message).toBe('Error with `documentClient.put` method');
        });

      try {
        await TestModel()
          .update({ id, name })
          .promise();
      } catch (error) {
        expect(error).not.toBe(null);
        expect(error.message).toBe('Error with `documentClient.put` method');
      }
    });

    test('should handle an error with the `documentClient.update` method', async () => {
      updateStub.restore();
      updateStub = sinon.stub(db, 'update');
      updateStub.callsFake(() => {
        throw new Error('Error with `documentClient.update` method');
      });

      await TestModel()
        .update({ id, name })
        .promise()
        .catch(error => {
          expect(error).not.toBe(null);
          expect(error.message).toBe(
            'Error with `documentClient.update` method'
          );
        });

      try {
        await TestModel()
          .update({ id, name })
          .promise();
      } catch (error) {
        expect(error).not.toBe(null);
        expect(error.message).toBe('Error with `documentClient.update` method');
      }
    });
  });

  describe('#index()', () => {
    var queryStub: sinon.SinonStub;
    var getStub: sinon.SinonStub;

    beforeEach(() => {
      getStub = sinon.stub(db, 'get');
      getStub.returns({
        promise: () =>
          Promise.resolve({
            Item: {
              pk: id,
              sk: `${tenant}|${entity}`,
              gk: name,
              __v: 'name',
              document,
              email
            }
          })
      });
      queryStub = sinon.stub(db, 'query');
      queryStub.callsFake(() => {
        return {
          promise: () =>
            Promise.resolve({
              Items: [
                {
                  pk: id,
                  sk: `${tenant}|${entity}`,
                  gk: name,
                  __v: 'name',
                  document,
                  email
                }
              ],
              LastEvaluatedKey: {
                pk: id
              },
              Count: 1
            })
        };
      });
    });

    afterEach(() => {
      queryStub.restore();
      getStub.restore();
    });

    test('should be a function', () => {
      expect(typeof TestModel().query).toBe('function');
    });

    test('should call the `documentClient.query` method, but not `documentClient.get` ', async () => {
      await TestModel()
        .query({})
        .promise();

      expect(queryStub.callCount).toBe(1);
      expect(getStub.callCount).toBe(0);
    });

    test('should call the `documentClient.query` method, but not `documentClient.get` ', async () => {
      await TestModel()
        .query({
          keyCondition: {
            key: 'TestName',
            expression: '#key = :key'
          },
          index: 'document',
          unwrapIndexItems: true
        })
        .promise();

      expect(queryStub.callCount).toBe(1);
      expect(getStub.callCount).toBe(1);
    });

    test('should query the table without `tenant` ', async () => {
      var NoTentantModel = DynamoDBCRI.createModel({
        ...config,
        tenant: undefined
      });
      await NoTentantModel()
        .query({})
        .promise();
      expect(queryStub.args[0][0]).toEqual({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: '#sk = :sk',
        ExpressionAttributeNames: { '#sk': 'sk' },
        ExpressionAttributeValues: { ':sk': `${entity}` },
        Limit: 100
      });
    });

    test('should query only with the `secondary`', async () => {
      await TestModel()
        .query({})
        .promise();
      expect(queryStub.args[0][0]).toEqual({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: '#sk = :sk',
        ExpressionAttributeNames: { '#sk': 'sk' },
        ExpressionAttributeValues: { ':sk': `${tenant}|${entity}` },
        Limit: 100
      });
    });

    test('should allow to configure the `Limit` value', async () => {
      var limit = 200;
      await TestModel()
        .query({ limit })
        .promise();
      expect(queryStub.args[0][0]).toEqual({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: '#sk = :sk',
        ExpressionAttributeNames: { '#sk': 'sk' },
        ExpressionAttributeValues: { ':sk': `${tenant}|${entity}` },
        Limit: 200
      });
    });

    test('should call the `documentClient.query` method with appropiate params', async () => {
      await TestModel()
        .query({
          keyCondition: {
            key: 'TestName',
            expression: '#key = :key'
          }
        })
        .promise();

      expect(queryStub.args[0][0]).toEqual({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: '#sk = :sk and #key = :key',
        ExpressionAttributeNames: {
          '#sk': 'sk',
          '#key': 'gk'
        },
        ExpressionAttributeValues: {
          ':sk': 'TestTenant|testEntity',
          ':key': 'TestName'
        },
        Limit: 100
      });
    });

    test('should return the items with normalized information', async () => {
      var data: any = await TestModel()
        .query({})
        .promise();

      expect(data).toEqual({
        count: 1,
        items: [
          {
            id,
            name,
            document,
            email
          }
        ],
        offset: btoa(JSON.stringify({ pk: id }))
      });
    });

    test('should return the items of index normalized', async () => {
      queryStub.restore();
      queryStub = sinon.stub(db, 'query');
      queryStub.callsFake(() => {
        return {
          promise: () =>
            Promise.resolve({
              Items: [
                {
                  pk: id,
                  sk: `${tenant}|${entity}|document`,
                  gk: document,
                  __v: 'document'
                }
              ],
              Count: 1
            })
        };
      });
      var data: any = await TestModel()
        .query({ index: document })
        .promise();

      expect(data).toEqual({
        count: 1,
        items: [
          {
            id,
            document
          }
        ]
      });
    });

    test('should return the items of index unwraped in a normalized shema', async () => {
      queryStub.restore();
      queryStub = sinon.stub(db, 'query');
      queryStub.callsFake(() => {
        return {
          promise: () =>
            Promise.resolve({
              Items: [
                {
                  pk: id,
                  sk: `${tenant}|${entity}|document`,
                  gk: document,
                  __v: 'document'
                }
              ],
              Count: 1
            })
        };
      });
      var data: any = await TestModel()
        .query({
          keyCondition: {
            key: 'TestName',
            expression: '#key = :key'
          },
          index: document,
          unwrapIndexItems: true
        })
        .promise();

      expect(data).toEqual({
        count: 1,
        items: [
          {
            id,
            name,
            document,
            email
          }
        ]
      });
    });

    test('should convert the offset from base64 to a DynamoDBKey when tenant is not undefined', async () => {
      await TestModel()
        .query({
          offset: btoa(JSON.stringify({ pk: id }))
        })
        .promise();

      expect(queryStub.args[0][0]).toEqual({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: '#sk = :sk',
        ExpressionAttributeNames: { '#sk': 'sk' },
        ExpressionAttributeValues: { ':sk': `${tenant}|${entity}` },
        Limit: 100,
        ExclusiveStartKey: {
          pk: id,
          sk: `${tenant}|${entity}`
        }
      });
    });

    test('should return a valid offset value', async () => {
      var data = await TestModel()
        .query({
          offset: btoa(JSON.stringify({ pk: id }))
        })
        .promise();

      expect(data && data.offset).toEqual(
        btoa(
          JSON.stringify({
            pk: id
          })
        )
      );
    });

    test('should handle a real offset value', async () => {
      await TestModel()
        .query({
          offset: 'eyJwayI6InFkcWV3ZWYzcHVpZnFvZjNwbzRmcW4zNGY5MiJ9'
        })
        .promise();

      expect(queryStub.args[0][0]).toEqual({
        TableName: tableName,
        IndexName: indexName,
        KeyConditionExpression: '#sk = :sk',
        ExpressionAttributeNames: { '#sk': 'sk' },
        ExpressionAttributeValues: { ':sk': `${tenant}|${entity}` },
        Limit: 100,
        ExclusiveStartKey: {
          pk: 'qdqewef3puifqof3po4fqn34f92',
          sk: `${tenant}|${entity}`
        }
      });
    });

    function isBase64(str) {
      try {
        return btoa(atob(str)) == str;
      } catch (err) {
        return false;
      }
    }

    test('should return a base64 encoded offset value', async () => {
      var data = await TestModel()
        .query({
          limit: 200,
          offset: btoa(JSON.stringify({ 0: { id } }))
        })
        .promise();

      expect(isBase64(data && data.offset)).toBe(true);
    });
  });
});
