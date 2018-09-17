import * as sinon from 'sinon';
import { DynamoDB } from 'aws-sdk';
import { DynamoDBCRI } from '../src';
import {
  IDynamoDBCRIModelConfig,
  IDynamoDBCRIGlobalConfig
} from '../src/types';
import {
  insertStream,
  removeStream,
  modifyStream,
  NewImage,
  Keys
} from '../utils/dynamoDBStream';

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

var TestModel = new DynamoDBCRI.Model(config);

describe('Model', () => {
  test('should be a function', () => {
    expect(typeof DynamoDBCRI.hookDynamoDBStreams).toBe('function');
  });

  describe('#INSERT', () => {
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

    test('should call the `documentClient.put` two times', async () => {
      await DynamoDBCRI.hookDynamoDBStreams([TestModel], insertStream);

      expect(putStub.called).toBe(true);
      expect(putStub.callCount).toBe(2);
    });

    test('should throw an error if model not defined', async () => {
      await DynamoDBCRI.hookDynamoDBStreams([], insertStream).catch(error => {
        expect(error).not.toBe(null);
        expect(error.message).toBe('No Model provided for this entity');
      });
    });

    test('should call the `documentClient.put` function with appropriate params', async () => {
      await DynamoDBCRI.hookDynamoDBStreams([TestModel], insertStream);

      expect(putStub.args[0][0]).toEqual({
        TableName: tableName,
        Item: {
          pk: NewImage.pk.S,
          sk: `${NewImage.sk.S}|email`,
          gk: NewImage.email.S,
          __v: 'email',
          __p: '{"document":"123.456.7-9"}'
        }
      });
      expect(putStub.args[1][0]).toEqual({
        TableName: tableName,
        Item: {
          pk: NewImage.pk.S,
          sk: `${NewImage.sk.S}|document`,
          gk: NewImage.document.S,
          __v: 'document'
        }
      });
    });

    test('should call the `documentClient.put` function with appropriate params if you have more than one model', async () => {
      var entity = 'secondTestEntity';
      var indexes = [{ indexName: 'email' }];
      var gsik = 'name';

      var config: IDynamoDBCRIModelConfig = {
        entity,
        indexes,
        gsik
      };

      var NewModel = new DynamoDBCRI.Model(config);

      await DynamoDBCRI.hookDynamoDBStreams(
        [NewModel, TestModel],
        insertStream
      );

      expect(putStub.args[0][0]).toEqual({
        TableName: tableName,
        Item: {
          pk: NewImage.pk.S,
          sk: `${NewImage.sk.S}|email`,
          gk: NewImage.email.S,
          __v: 'email',
          __p: '{"document":"123.456.7-9"}'
        }
      });
      expect(putStub.args[1][0]).toEqual({
        TableName: tableName,
        Item: {
          pk: NewImage.pk.S,
          sk: `${NewImage.sk.S}|document`,
          gk: NewImage.document.S,
          __v: 'document'
        }
      });
    });

    test('should handle an error with the `documentClient.put` method', async () => {
      putStub.restore();
      putStub = sinon.stub(db, 'put');
      putStub.callsFake(() => {
        throw new Error('Error with `documentClient.put` method');
      });

      await DynamoDBCRI.hookDynamoDBStreams([TestModel], insertStream).catch(
        error => {
          expect(error).not.toBe(null);
          expect(error.message).toBe('Error with `documentClient.put` method');
        }
      );

      try {
        await DynamoDBCRI.hookDynamoDBStreams([TestModel], insertStream);
      } catch (error) {
        expect(error).not.toBe(null);
        expect(error.message).toBe('Error with `documentClient.put` method');
      }
    });
  });

  describe('#REMOVE', () => {
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

    test('should call the `documentClient.put` two times', async () => {
      await DynamoDBCRI.hookDynamoDBStreams([TestModel], removeStream);

      expect(deleteStub.called).toBe(true);
      expect(deleteStub.callCount).toBe(2);
    });

    test('should call the `documentClient.delete` function with appropriate params', async () => {
      await DynamoDBCRI.hookDynamoDBStreams([TestModel], removeStream);

      expect(deleteStub.args[0][0]).toEqual({
        TableName: tableName,
        Key: {
          pk: Keys.pk.S,
          sk: `${Keys.sk.S}|email`
        }
      });

      expect(deleteStub.args[1][0]).toEqual({
        TableName: tableName,
        Key: {
          pk: Keys.pk.S,
          sk: `${Keys.sk.S}|document`
        }
      });
    });

    test('should handle an error with the `documentClient.delete` method', async () => {
      deleteStub.restore();
      deleteStub = sinon.stub(db, 'delete');
      deleteStub.callsFake(() => {
        throw new Error('Error with `documentClient.delete` method');
      });

      await DynamoDBCRI.hookDynamoDBStreams([TestModel], removeStream).catch(
        error => {
          expect(error).not.toBe(null);
          expect(error.message).toBe(
            'Error with `documentClient.delete` method'
          );
        }
      );

      try {
        await DynamoDBCRI.hookDynamoDBStreams([TestModel], removeStream);
      } catch (error) {
        expect(error).not.toBe(null);
        expect(error.message).toBe('Error with `documentClient.delete` method');
      }
    });
  });

  describe('#MODIFY', () => {
    var getStub: sinon.SinonStub;
    var putStub: sinon.SinonStub;

    beforeEach(() => {
      getStub = sinon.stub(db, 'get');
      putStub = sinon.stub(db, 'put');
      getStub.returns({
        promise: () =>
          Promise.resolve({
            Item: {
              pk: NewImage.pk.S,
              sk: NewImage.sk.S,
              gk: NewImage.gk.S,
              __v: NewImage.__v.S,
              email: NewImage.email.S,
              document: NewImage.document.S
            }
          })
      });
      putStub.returns({
        promise: () => Promise.resolve({})
      });
    });

    afterEach(() => {
      getStub.restore();
      putStub.restore();
    });

    test('should call the `documentClient.put` twice and `documentClient.get` once', async () => {
      await DynamoDBCRI.hookDynamoDBStreams([TestModel], modifyStream);
      expect(getStub.called).toBe(true);
      expect(getStub.callCount).toBe(1);
      expect(putStub.called).toBe(true);
      expect(putStub.callCount).toBe(2);
    });

    test('should call the `documentClient.get` and `documentClient.put` functions with appropriate params', async () => {
      await DynamoDBCRI.hookDynamoDBStreams([TestModel], modifyStream);

      expect(getStub.args[0][0]).toEqual({
        TableName: tableName,
        Key: {
          pk: Keys.pk.S,
          sk: `${Keys.sk.S}`
        }
      });

      expect(putStub.args[0][0]).toEqual({
        TableName: tableName,
        Item: {
          pk: NewImage.pk.S,
          sk: `${NewImage.sk.S}|email`,
          gk: NewImage.email.S,
          __v: 'email',
          __p: '{"document":"123.456.7-9"}'
        }
      });

      expect(putStub.args[1][0]).toEqual({
        TableName: tableName,
        Item: {
          pk: NewImage.pk.S,
          sk: `${NewImage.sk.S}|document`,
          gk: NewImage.document.S,
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

      await DynamoDBCRI.hookDynamoDBStreams([TestModel], modifyStream).catch(
        error => {
          expect(error).not.toBe(null);
          expect(error.message).toBe('Error with `documentClient.get` method');
        }
      );

      try {
        await DynamoDBCRI.hookDynamoDBStreams([TestModel], modifyStream);
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

      await DynamoDBCRI.hookDynamoDBStreams([TestModel], modifyStream).catch(
        error => {
          expect(error).not.toBe(null);
          expect(error.message).toBe('Error with `documentClient.put` method');
        }
      );

      try {
        await DynamoDBCRI.hookDynamoDBStreams([TestModel], modifyStream);
      } catch (error) {
        expect(error).not.toBe(null);
        expect(error.message).toBe('Error with `documentClient.put` method');
      }
    });
  });
});
