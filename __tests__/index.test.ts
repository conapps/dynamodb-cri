import { DynamoDBCRI } from '../src';
import { IDynamoDBCRIModelConfig } from '../src/types';

describe('DynamoDBCRI', () => {
  test('should be an object', () => {
    expect(typeof DynamoDBCRI).toEqual('object');
  });
  describe('.config()', () => {
    test('should be a function', () => {
      expect(typeof DynamoDBCRI.config).toEqual('function');
    });

    test('should configure the DynamoDBCRI options', () => {
      expect(DynamoDBCRI.config().indexName).toBe(undefined);
      expect(DynamoDBCRI.config().tableName).toBe(undefined);
      expect(DynamoDBCRI.config().tenant).toBe(undefined);
      var tenant = 'SomeTenant';
      var table = 'SomeTable';
      var index = 'SomeIndex';
      DynamoDBCRI.config({
        tableName: 'SomeTable',
        indexName: 'SomeIndex',
        tenant: 'SomeTenant'
      });
      expect(DynamoDBCRI.config().tableName).toBe(table);
      expect(DynamoDBCRI.config().indexName).toBe(index);
      expect(DynamoDBCRI.config().tenant).toBe(tenant);
    });

    var config: IDynamoDBCRIModelConfig = {
      entity: 'TestEntity',
      indexes: [{ indexName: 'TestIndex1' }, { indexName: 'TestIndex2' }],
      gsik: 'testGsik'
    };

    describe('.create()', () => {
      test('should be a function', () => {
        expect(typeof DynamoDBCRI.Model).toEqual('function');
      });

      test('should return a Object', () => {
        expect(typeof new DynamoDBCRI.Model(config)).toEqual('object');
      });
    });
  });
});
