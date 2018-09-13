"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *  Unwrap DynamoDB AttributeValues to values of the appropriate types.
 *  @param {Object} attributeValue The DynamoDb AttributeValue to unwrap.
 *  @return {Object} Unwrapped object with properties.
 */
function unwrapAllAttributeValues(atributeValues) {
    var result = {};
    for (var key in atributeValues) {
        if (atributeValues.hasOwnProperty(key)) {
            var value = atributeValues[key];
            if (value !== null && typeof value !== 'undefined')
                result[key] = unwrapOneAttributeValue(atributeValues[key]);
        }
    }
    return result;
}
exports.unwrapAllAttributeValues = unwrapAllAttributeValues;
/**
 * Unwrap a single DynamoDB's AttributeValues to a value of the appropriate
 * javascript type.
 * @param {AttributeValue} attributeValue The DynamoDB AttributeValue.
 * @return {String|Number|Array}  The javascript value.
 */
function unwrapOneAttributeValue(attributeValue) {
    var keys = Object.keys(attributeValue);
    if (keys.length !== 1)
        throw new Error('Unexpected DynamoDB AttributeValue');
    var typeStr = keys[0];
    if (!unwrapFns.hasOwnProperty(typeStr))
        throw exports.Errors.NoDatatype;
    var val = attributeValue[typeStr];
    return unwrapFns[typeStr] ? unwrapFns[typeStr](val) : val;
}
exports.unwrapOneAttributeValue = unwrapOneAttributeValue;
function isArray(input) {
    return Object.prototype.toString.call(input) === '[object Array]';
}
function isNumber(attribute) {
    return typeof attribute === 'number' || attribute instanceof Number;
}
function isString(attribute) {
    return typeof attribute === 'string' || attribute instanceof String;
}
function isBinary(attribute) {
    if (attribute instanceof Buffer)
        return true;
    return false;
}
function testAttributes(attribute, fn) {
    for (var i = 0; i < attribute.length; i++) {
        if (!fn(attribute[i]))
            return false;
    }
    return true;
}
function detectType(val) {
    if (isArray(val)) {
        var arr = val;
        if (testAttributes(arr, isNumber))
            return 'NS';
        if (testAttributes(arr, isString))
            return 'SS';
        if (testAttributes(arr, isBinary))
            return 'BS';
        return 'L';
    }
    if (isString(val))
        return 'S';
    if (isNumber(val))
        return 'N';
    if (isBinary(val))
        return 'B';
    if (val === null)
        return 'NULL';
    if (typeof val === 'boolean')
        return 'BOOL';
    if (typeof val === 'object') {
        return 'M';
    }
}
exports.Errors = {
    NoDatatype: new Error('No data type (B, BS, N, NS, S, SS).'),
    NoData: new Error('No data')
};
var unwrapFns = {
    B: undefined,
    BS: undefined,
    N: function (o) {
        return Number(o);
    },
    NS: function (array) {
        return array.map(function (o) {
            return Number(o);
        });
    },
    S: undefined,
    SS: undefined,
    BOOL: undefined,
    L: function (value) {
        return value.map(unwrapOneAttributeValue);
    },
    M: function (value) {
        return unwrapAllAttributeValues(value);
    },
    NULL: function () {
        return null;
    }
};
//# sourceMappingURL=unwrapRecords.js.map