import { IItem } from '../src/types';
/**
 *  Unwrap DynamoDB AttributeValues to values of the appropriate types.
 *  @param {Object} attributeValue The DynamoDb AttributeValue to unwrap.
 *  @return {Object} Unwrapped object with properties.
 */
export declare function unwrapAllAttributeValues(atributeValues: IItem): IItem;
/**
 * Unwrap a single DynamoDB's AttributeValues to a value of the appropriate
 * javascript type.
 * @param {AttributeValue} attributeValue The DynamoDB AttributeValue.
 * @return {String|Number|Array}  The javascript value.
 */
export declare function unwrapOneAttributeValue(attributeValue: IItem): any;
export declare var Errors: IItem;
