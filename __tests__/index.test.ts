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
      expect(DynamoDBCRI.getConfig().indexName).toBe(undefined);
      expect(DynamoDBCRI.getConfig().tableName).toBe(undefined);
      expect(DynamoDBCRI.getConfig().tenant).toBe(undefined);
      var tenant = 'SomeTenant';
      var table = 'SomeTable';
      var index = 'SomeIndex';
      DynamoDBCRI.config({
        tableName: 'SomeTable',
        indexName: 'SomeIndex',
        tenant: 'SomeTenant'
      });
      expect(DynamoDBCRI.getConfig().tableName).toBe(table);
      expect(DynamoDBCRI.getConfig().indexName).toBe(index);
      expect(DynamoDBCRI.getConfig().tenant).toBe(tenant);
    });

    var config: IDynamoDBCRIModelConfig = {
      entity: 'TestEntity',
      indexes: [{ indexName: 'TestIndex1' }, { indexName: 'TestIndex2' }],
      gsik: 'testGsik'
    };

    describe('.create()', () => {
      test('should be a function', () => {
        expect(typeof DynamoDBCRI.createModel).toEqual('function');
      });

      test('should return a function', () => {
        expect(typeof DynamoDBCRI.createModel(config)).toEqual('function');
      });
    });
  });
});
