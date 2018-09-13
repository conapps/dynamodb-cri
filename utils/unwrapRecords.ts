import { AttributeValue } from 'aws-lambda';
import { IItem } from '../src/types';

/**
 *  Unwrap DynamoDB AttributeValues to values of the appropriate types.
 *  @param {Object} attributeValue The DynamoDb AttributeValue to unwrap.
 *  @return {Object} Unwrapped object with properties.
 */
export function unwrapAllAttributeValues(atributeValues: IItem): IItem {
  var result: IItem = {};
  for (var key in atributeValues) {
    if (atributeValues.hasOwnProperty(key)) {
      var value: IItem = atributeValues[key];
      if (value !== null && typeof value !== 'undefined')
        result[key] = unwrapOneAttributeValue(atributeValues[key]);
    }
  }
  return result;
}

/**
 * Unwrap a single DynamoDB's AttributeValues to a value of the appropriate
 * javascript type.
 * @param {AttributeValue} attributeValue The DynamoDB AttributeValue.
 * @return {String|Number|Array}  The javascript value.
 */
export function unwrapOneAttributeValue(attributeValue: IItem) {
  var keys = Object.keys(attributeValue);
  if (keys.length !== 1) throw new Error('Unexpected DynamoDB AttributeValue');
  var typeStr = keys[0];
  if (!unwrapFns.hasOwnProperty(typeStr)) throw Errors.NoDatatype;
  var val = attributeValue[typeStr];
  return unwrapFns[typeStr] ? unwrapFns[typeStr](val) : val;
}

function isArray(input: any): boolean {
  return Object.prototype.toString.call(input) === '[object Array]';
}

function isNumber(attribute: any): boolean {
  return typeof attribute === 'number' || attribute instanceof Number;
}

function isString(attribute: any): boolean {
  return typeof attribute === 'string' || attribute instanceof String;
}

function isBinary(attribute: any): boolean {
  if (attribute instanceof Buffer) return true;
  return false;
}

function testAttributes(attribute: [], fn: (arg: any) => any) {
  for (var i = 0; i < attribute.length; i++) {
    if (!fn(attribute[i])) return false;
  }
  return true;
}

function detectType(val: any): string {
  if (isArray(val)) {
    var arr = val;
    if (testAttributes(arr, isNumber)) return 'NS';

    if (testAttributes(arr, isString)) return 'SS';

    if (testAttributes(arr, isBinary)) return 'BS';

    return 'L';
  }

  if (isString(val)) return 'S';

  if (isNumber(val)) return 'N';

  if (isBinary(val)) return 'B';

  if (val === null) return 'NULL';

  if (typeof val === 'boolean') return 'BOOL';

  if (typeof val === 'object') {
    return 'M';
  }
}

export var Errors: IItem = {
  NoDatatype: new Error('No data type (B, BS, N, NS, S, SS).'),
  NoData: new Error('No data')
};

var unwrapFns: IItem = {
  B: undefined,
  BS: undefined,
  N: function(o: any) {
    return Number(o);
  },
  NS: function(array: []) {
    return array.map(function(o) {
      return Number(o);
    });
  },
  S: undefined,
  SS: undefined,
  BOOL: undefined,
  L: function(value: any) {
    return value.map(unwrapOneAttributeValue);
  },
  M: function(value: IItem) {
    return unwrapAllAttributeValues(value);
  },
  NULL: function(): null {
    return null;
  }
};
