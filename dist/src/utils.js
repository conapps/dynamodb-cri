"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Encodes a string using base64.
 * @param string String to encode to base64
 */
function btoa(string) {
    return new Buffer(string).toString('base64');
}
exports.btoa = btoa;
/**
 * Decodes a base64 string to ascii
 * @param string String to decode from base64 to ascii.
 */
function atob(string) {
    return new Buffer(string, 'base64').toString('ascii');
}
exports.atob = atob;
//# sourceMappingURL=utils.js.map