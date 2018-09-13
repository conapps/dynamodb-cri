/**
 * Encodes a string using base64.
 * @param string String to encode to base64
 */
export function btoa(string: string): string {
  return new Buffer(string).toString('base64');
}

/**
 * Decodes a base64 string to ascii
 * @param string String to decode from base64 to ascii.
 */
export function atob(string: string): string {
  return new Buffer(string, 'base64').toString('ascii');
}
