/**
 * Returns true if the string represents an IPv4 address. Matches Node.js net.isIPv4
 * functionality.
 */
export declare function isIPv4(s: string): boolean;
/**
 * Returns true if the string represents an IPv6 address. Matches Node.js net.isIPv6
 * functionality.
 */
export declare function isIPv6(s: string): boolean;
export declare function isIP(s: string): 4 | 6 | 0;
