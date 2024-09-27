/**
 * Utility class for Base64 encoding and decoding.
 * Works in both Node.js and browser environments.
 */
export class Base64 {
    /**
     * Encodes a string or Buffer to Base64.
     * @param data - The input string or Buffer to encode.
     * @returns The Base64 encoded string.
     */
    static encode(data: string | Buffer): string {
      if (typeof data === 'string') {
        // If input is a string, convert to Buffer first
        data = Buffer.from(data, 'utf-8');
      }
      
      if (typeof btoa === 'function') {
        // Browser environment
        return btoa(String.fromCharCode.apply(null, [...new Uint8Array(data)]));
      } else if (typeof Buffer !== 'undefined') {
        // Node.js environment
        return data.toString('base64');
      } else {
        throw new Error('Base64 encoding is not supported in this environment');
      }
    }
  
    /**
     * Decodes a Base64 string to a UTF-8 string.
     * @param encodedData - The Base64 encoded string to decode.
     * @returns The decoded UTF-8 string.
     */
    static decode(encodedData: string): string {
      if (typeof atob === 'function') {
        // Browser environment
        return decodeURIComponent(escape(atob(encodedData)));
      } else if (typeof Buffer !== 'undefined') {
        // Node.js environment
        return Buffer.from(encodedData, 'base64').toString('utf-8');
      } else {
        throw new Error('Base64 decoding is not supported in this environment');
      }
    }
  
    /**
     * Checks if a string is valid Base64.
     * @param str - The string to check.
     * @returns True if the string is valid Base64, false otherwise.
     */
    static isBase64(str: string): boolean {
      if (str === '' || str.trim() === '') {
        return false;
      }
      try {
        return btoa(atob(str)) === str;
      } catch (err) {
        return false;
      }
    }
  }
  
  // Example usage:
  // const encoded = Base64.encode('Hello, World!');
  // console.log(encoded); // SGVsbG8sIFdvcmxkIQ==
  // const decoded = Base64.decode(encoded);
  // console.log(decoded); // Hello, World!
  // console.log(Base64.isBase64(encoded)); // true
  // console.log(Base64.isBase64('not base64')); // false