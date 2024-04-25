(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, (function () {
        var current = global.isInSubnet;
        var exports = global.isInSubnet = {};
        factory(exports);
        exports.noConflict = function () { global.isInSubnet = current; return exports; };
    }()));
}(this, (function (exports) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    // RegExp for testing if a string represents an IPv4 address
    var v4Seg = '(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])';
    var v4Str = "(" + v4Seg + "[.]){3}" + v4Seg;
    var IPv4Reg = new RegExp("^" + v4Str + "$");
    // RegExp for testing if a string represents an IPv6 address
    var v6Seg = '(?:[0-9a-fA-F]{1,4})';
    var IPv6Reg = new RegExp('^(' +
        ("(?:" + v6Seg + ":){7}(?:" + v6Seg + "|:)|") +
        ("(?:" + v6Seg + ":){6}(?:" + v4Str + "|:" + v6Seg + "|:)|") +
        ("(?:" + v6Seg + ":){5}(?::" + v4Str + "|(:" + v6Seg + "){1,2}|:)|") +
        ("(?:" + v6Seg + ":){4}(?:(:" + v6Seg + "){0,1}:" + v4Str + "|(:" + v6Seg + "){1,3}|:)|") +
        ("(?:" + v6Seg + ":){3}(?:(:" + v6Seg + "){0,2}:" + v4Str + "|(:" + v6Seg + "){1,4}|:)|") +
        ("(?:" + v6Seg + ":){2}(?:(:" + v6Seg + "){0,3}:" + v4Str + "|(:" + v6Seg + "){1,5}|:)|") +
        ("(?:" + v6Seg + ":){1}(?:(:" + v6Seg + "){0,4}:" + v4Str + "|(:" + v6Seg + "){1,6}|:)|") +
        ("(?::((?::" + v6Seg + "){0,5}:" + v4Str + "|(?::" + v6Seg + "){1,7}|:))") +
        ')(%[0-9a-zA-Z]{1,})?$');
    /**
     * Returns true if the string represents an IPv4 address. Matches Node.js net.isIPv4
     * functionality.
     */
    function isIPv4(s) {
        return IPv4Reg.test(s);
    }
    /**
     * Returns true if the string represents an IPv6 address. Matches Node.js net.isIPv6
     * functionality.
     */
    function isIPv6(s) {
        return IPv6Reg.test(s);
    }
    function isIP(s) {
        if (isIPv4(s))
            return 4;
        if (isIPv6(s))
            return 6;
        return 0;
    }

    var ipRange = {
        /** localhost IP ranges */
        localhost: {
            /** the localhost address ranges for IPv4 */
            ipv4: ['127.0.0.0/8'],
            /** the localhost address ranges for IPv6 */
            ipv6: ['::1/128']
        },
        /** private IP ranges */
        private: {
            /** private address ranges for IPv4 */
            ipv4: [
                '10.0.0.0/8',
                '172.16.0.0/12',
                '192.168.0.0/16' // RFC 1918
            ],
            /** private address ranges for IPv6 */
            ipv6: [
                'fe80::/10',
                'fc00::/7' // unique local address (ULA)
            ]
        },
        /** reserved IP ranges */
        reserved: {
            /** reserved address ranges for IPv4 */
            ipv4: [
                '0.0.0.0/8',
                '100.64.0.0/10',
                '169.254.0.0/16',
                '192.0.0.0/24',
                '192.0.2.0/24',
                '192.88.99.0/24',
                '198.18.0.0/15',
                '198.51.100.0/24',
                '203.0.113.0/24',
                '224.0.0.0/4',
                '240.0.0.0/4',
                '255.255.255.255/32' // limited broadcast address
            ],
            /** reserved address ranges for IPv6 */
            ipv6: [
                '::/128',
                '64:ff9b::/96',
                '100::/64',
                '2001::/32',
                '2001:10::/28',
                '2001:20::/28',
                '2001:db8::/32',
                '2002::/16',
                'ff00::/8' // multicast
            ]
        }
    };

    /**
     * Given an IPv4 address, convert it to a 32-bit long integer.
     * @param ip the IPv4 address to expand
     * @throws if the string is not a valid IPv4 address
     */
    function ipv4ToLong(ip) {
        if (!isIPv4(ip)) {
            throw new Error("not a valid IPv4 address: " + ip);
        }
        var octets = ip.split('.');
        return (((parseInt(octets[0], 10) << 24) +
            (parseInt(octets[1], 10) << 16) +
            (parseInt(octets[2], 10) << 8) +
            parseInt(octets[3], 10)) >>>
            0);
    }
    /**
     * Test if the given IPv4 address is contained in the specified subnet.
     * @param address the IPv4 address to check
     * @param subnet the IPv4 CIDR to test (or an array of them)
     * @throws if the address or subnet are not valid IP addresses, or the CIDR prefix length
     *  is not valid
     */
    function isInSubnet(address, subnetOrSubnets) {
        return createChecker(subnetOrSubnets)(address);
    }
    /**
     * The functional version, creates a checking function that takes an IPv4 Address and
     * returns whether or not it is contained in (one of) the subnet(s).
     * @param subnet the IPv4 CIDR to test (or an array of them)
     * @throws if the subnet is not a valid IP addresses, or the CIDR prefix length
     *  is not valid
     */
    function createChecker(subnetOrSubnets) {
        if (Array.isArray(subnetOrSubnets)) {
            var checks_1 = subnetOrSubnets.map(function (subnet) { return createLongChecker(subnet); });
            return function (address) {
                var addressLong = ipv4ToLong(address);
                return checks_1.some(function (check) { return check(addressLong); });
            };
        }
        var check = createLongChecker(subnetOrSubnets);
        return function (address) {
            var addressLong = ipv4ToLong(address);
            return check(addressLong);
        };
    }
    // this is the most optimised checker.
    function createLongChecker(subnet) {
        var _a = subnet.split('/'), subnetAddress = _a[0], prefixLengthString = _a[1];
        var prefixLength = parseInt(prefixLengthString, 10);
        if (!subnetAddress || !Number.isInteger(prefixLength)) {
            throw new Error("not a valid IPv4 subnet: " + subnet);
        }
        if (prefixLength < 0 || prefixLength > 32) {
            throw new Error("not a valid IPv4 prefix length: " + prefixLength + " (from " + subnet + ")");
        }
        var subnetLong = ipv4ToLong(subnetAddress);
        return function (addressLong) {
            if (prefixLength === 0) {
                return true;
            }
            var subnetPrefix = subnetLong >> (32 - prefixLength);
            var addressPrefix = addressLong >> (32 - prefixLength);
            return subnetPrefix === addressPrefix;
        };
    }
    // cache these special subnet checkers
    var specialNetsCache = {};
    /** Test if the given IP address is a private/internal IP address. */
    function isPrivate(address) {
        if ('private' in specialNetsCache === false) {
            specialNetsCache['private'] = createChecker(ipRange.private.ipv4);
        }
        return specialNetsCache['private'](address);
    }
    /** Test if the given IP address is a localhost address. */
    function isLocalhost(address) {
        if ('localhost' in specialNetsCache === false) {
            specialNetsCache['localhost'] = createChecker(ipRange.localhost.ipv4);
        }
        return specialNetsCache['localhost'](address);
    }
    /** Test if the given IP address is in a known reserved range and not a normal host IP */
    function isReserved(address) {
        if ('reserved' in specialNetsCache === false) {
            specialNetsCache['reserved'] = createChecker(ipRange.reserved.ipv4);
        }
        return specialNetsCache['reserved'](address);
    }
    /**
     * Test if the given IP address is a special address of any kind (private, reserved,
     * localhost)
     */
    function isSpecial(address) {
        if ('special' in specialNetsCache === false) {
            specialNetsCache['special'] = createChecker(__spreadArrays(ipRange.private.ipv4, ipRange.localhost.ipv4, ipRange.reserved.ipv4));
        }
        return specialNetsCache['special'](address);
    }

    var ipv4 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        isInSubnet: isInSubnet,
        createChecker: createChecker,
        isPrivate: isPrivate,
        isLocalhost: isLocalhost,
        isReserved: isReserved,
        isSpecial: isSpecial
    });

    // Note: Profiling shows that on recent versions of Node, string.split(RegExp) is faster
    // than string.split(string).
    var dot = /\./;
    var mappedIpv4 = /^(.+:ffff:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?:%.+)?$/;
    var colon = /:/;
    var doubleColon = /::/;
    /**
     * Given a mapped IPv4 address (e.g. ::ffff:203.0.113.38 or similar), convert it to the
     * equivalent standard IPv6 address.
     * @param ip the IPv4-to-IPv6 mapped address
     */
    function mappedIpv4ToIpv6(ip) {
        var matches = ip.match(mappedIpv4);
        if (!matches || !isIPv4(matches[2])) {
            throw new Error("not a mapped IPv4 address: " + ip);
        }
        // mapped IPv4 address
        var prefix = matches[1];
        var ipv4 = matches[2];
        var parts = ipv4.split(dot).map(function (x) { return parseInt(x, 10); });
        var segment7 = ((parts[0] << 8) + parts[1]).toString(16);
        var segment8 = ((parts[2] << 8) + parts[3]).toString(16);
        return "" + prefix + segment7 + ":" + segment8;
    }
    /**
     * Given a mapped IPv4 address, return the bare IPv4 equivalent.
     */
    function extractMappedIpv4(ip) {
        var matches = ip.match(mappedIpv4);
        if (!matches || !isIPv4(matches[2])) {
            throw new Error("not a mapped IPv4 address: " + ip);
        }
        return matches[2];
    }
    /**
     * Given an IP address that may have double-colons, expand all segments and return them
     * as an array of 8 segments (16-bit words). As a peformance enhancement (indicated by
     * profiling), for any segment that was missing but should be a '0', returns undefined.
     * @param ip the IPv6 address to expand
     * @throws if the string is not a valid IPv6 address
     */
    function getIpv6Segments(ip) {
        if (!isIPv6(ip)) {
            throw new Error("not a valid IPv6 address: " + ip);
        }
        if (dot.test(ip)) {
            return getIpv6Segments(mappedIpv4ToIpv6(ip));
        }
        // break it into an array, including missing "::" segments
        var _a = ip.split(doubleColon), beforeChunk = _a[0], afterChunk = _a[1];
        var beforeParts = (beforeChunk && beforeChunk.split(colon)) || [];
        var afterParts = (afterChunk && afterChunk.split(colon)) || [];
        var missingSegments = new Array(8 - (beforeParts.length + afterParts.length));
        return beforeParts.concat(missingSegments, afterParts);
    }
    /**
     * Test if the given IPv6 address is contained in the specified subnet.
     * @param address the IPv6 address to check
     * @param subnet the IPv6 CIDR to test (or an array of them)
     * @throws if the address or subnet are not valid IP addresses, or the CIDR prefix length
     *  is not valid
     */
    function isInSubnet$1(address, subnetOrSubnets) {
        return createChecker$1(subnetOrSubnets)(address);
    }
    /**
     * Create a function to test if a given IPv6 address is contained in the specified subnet.
     * @param subnet the IPv6 CIDR to test (or an array of them)
     * @throws if the subnet(s) are not valid IP addresses, or the CIDR prefix lengths
     *  are not valid
     */
    function createChecker$1(subnetOrSubnets) {
        if (Array.isArray(subnetOrSubnets)) {
            var checks_1 = subnetOrSubnets.map(function (subnet) { return createSegmentChecker(subnet); });
            return function (address) {
                var segments = getIpv6Segments(address);
                return checks_1.some(function (check) { return check(segments); });
            };
        }
        var check = createSegmentChecker(subnetOrSubnets);
        return function (address) {
            var segments = getIpv6Segments(address);
            return check(segments);
        };
    }
    // This creates the last function that works on the most deconstructed data
    function createSegmentChecker(subnet) {
        var _a = subnet.split('/'), subnetAddress = _a[0], prefixLengthString = _a[1];
        var prefixLength = parseInt(prefixLengthString, 10);
        if (!subnetAddress || !Number.isInteger(prefixLength)) {
            throw new Error("not a valid IPv6 CIDR subnet: " + subnet);
        }
        if (prefixLength < 0 || prefixLength > 128) {
            throw new Error("not a valid IPv6 prefix length: " + prefixLength + " (from " + subnet + ")");
        }
        // the next line throws if the address is not a valid IPv6 addresse
        var subnetSegments = getIpv6Segments(subnetAddress);
        return function (addressSegments) {
            for (var i = 0; i < 8; ++i) {
                var bitCount = Math.min(prefixLength - i * 16, 16);
                if (bitCount <= 0) {
                    break;
                }
                var subnetPrefix = ((subnetSegments[i] && parseInt(subnetSegments[i], 16)) || 0) >> (16 - bitCount);
                var addressPrefix = ((addressSegments[i] && parseInt(addressSegments[i], 16)) || 0) >>
                    (16 - bitCount);
                if (subnetPrefix !== addressPrefix) {
                    return false;
                }
            }
            return true;
        };
    }
    // cache these special subnet checkers
    var specialNetsCache$1 = {};
    /** Test if the given IP address is a private/internal IP address. */
    function isPrivate$1(address) {
        if ('private' in specialNetsCache$1 === false) {
            specialNetsCache$1['private'] = createChecker$1(ipRange.private.ipv6);
        }
        return specialNetsCache$1['private'](address);
    }
    /** Test if the given IP address is a localhost address. */
    function isLocalhost$1(address) {
        if ('localhost' in specialNetsCache$1 === false) {
            specialNetsCache$1['localhost'] = createChecker$1(ipRange.localhost.ipv6);
        }
        return specialNetsCache$1['localhost'](address);
    }
    /** Test if the given IP address is an IPv4 address mapped onto IPv6 */
    function isIPv4MappedAddress(address) {
        if ('mapped' in specialNetsCache$1 === false) {
            specialNetsCache$1['mapped'] = createChecker$1('::ffff:0:0/96');
        }
        if (specialNetsCache$1['mapped'](address)) {
            var matches = address.match(mappedIpv4);
            return Boolean(matches && isIPv4(matches[2]));
        }
        return false;
    }
    /** Test if the given IP address is in a known reserved range and not a normal host IP */
    function isReserved$1(address) {
        if ('reserved' in specialNetsCache$1 === false) {
            specialNetsCache$1['reserved'] = createChecker$1(ipRange.reserved.ipv6);
        }
        return specialNetsCache$1['reserved'](address);
    }
    /**
     * Test if the given IP address is a special address of any kind (private, reserved,
     * localhost)
     */
    function isSpecial$1(address) {
        if ('special' in specialNetsCache$1 === false) {
            specialNetsCache$1['special'] = createChecker$1(__spreadArrays(ipRange.private.ipv6, ipRange.localhost.ipv6, ipRange.reserved.ipv6));
        }
        return specialNetsCache$1['special'](address);
    }

    var ipv6 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        extractMappedIpv4: extractMappedIpv4,
        isInSubnet: isInSubnet$1,
        createChecker: createChecker$1,
        isPrivate: isPrivate$1,
        isLocalhost: isLocalhost$1,
        isIPv4MappedAddress: isIPv4MappedAddress,
        isReserved: isReserved$1,
        isSpecial: isSpecial$1
    });

    /**
     * Test if the given IP address is contained in the specified subnet.
     * @param address the IPv4 or IPv6 address to check
     * @param subnet the IPv4 or IPv6 CIDR to test (or an array of them)
     * @throws if any of the address or subnet(s) are not valid IP addresses, or the CIDR
     *  prefix length is not valid
     */
    function isInSubnet$2(address, subnetOrSubnets) {
        return createChecker$2(subnetOrSubnets)(address);
    }
    /**
     * Create a function to test if the given IP address is contained in the specified subnet.
     * @param subnet the IPv4 or IPv6 CIDR to test (or an array of them)
     * @throws if any of the subnet(s) are not valid IP addresses, or the CIDR
     *  prefix length is not valid
     */
    function createChecker$2(subnetOrSubnets) {
        if (!Array.isArray(subnetOrSubnets)) {
            return createChecker$2([subnetOrSubnets]);
        }
        var subnetsByVersion = subnetOrSubnets.reduce(function (acc, subnet) {
            var ip = subnet.split('/')[0];
            acc[isIP(ip)].push(subnet);
            return acc;
        }, { 0: [], 4: [], 6: [] });
        if (subnetsByVersion[0].length !== 0) {
            throw new Error("some subnets are not valid IP addresses: " + subnetsByVersion[0]);
        }
        var check4 = createChecker(subnetsByVersion[4]);
        var check6 = createChecker$1(subnetsByVersion[6]);
        return function (address) {
            if (!isIP(address)) {
                throw new Error("not a valid IPv4 or IPv6 address: " + address);
            }
            // for mapped IPv4 addresses, compare against both IPv6 and IPv4 subnets
            if (isIPv6(address) && isIPv4MappedAddress(address)) {
                return check6(address) || check4(extractMappedIpv4(address));
            }
            if (isIPv6(address)) {
                return check6(address);
            }
            else {
                return check4(address);
            }
        };
    }
    /** Test if the given IP address is a private/internal IP address. */
    function isPrivate$2(address) {
        if (isIPv6(address)) {
            if (isIPv4MappedAddress(address)) {
                return isPrivate(extractMappedIpv4(address));
            }
            return isPrivate$1(address);
        }
        else {
            return isPrivate(address);
        }
    }
    /** Test if the given IP address is a localhost address. */
    function isLocalhost$2(address) {
        if (isIPv6(address)) {
            if (isIPv4MappedAddress(address)) {
                return isLocalhost(extractMappedIpv4(address));
            }
            return isLocalhost$1(address);
        }
        else {
            return isLocalhost(address);
        }
    }
    /** Test if the given IP address is an IPv4 address mapped onto IPv6 */
    function isIPv4MappedAddress$1(address) {
        if (isIPv6(address)) {
            return isIPv4MappedAddress(address);
        }
        else {
            return false;
        }
    }
    /** Test if the given IP address is in a known reserved range and not a normal host IP */
    function isReserved$2(address) {
        if (isIPv6(address)) {
            if (isIPv4MappedAddress(address)) {
                return isReserved(extractMappedIpv4(address));
            }
            return isReserved$1(address);
        }
        else {
            return isReserved(address);
        }
    }
    /**
     * Test if the given IP address is a special address of any kind (private, reserved,
     * localhost)
     */
    function isSpecial$2(address) {
        if (isIPv6(address)) {
            if (isIPv4MappedAddress(address)) {
                return isSpecial(extractMappedIpv4(address));
            }
            return isSpecial$1(address);
        }
        else {
            return isSpecial(address);
        }
    }
    var check = isInSubnet$2;

    exports.IPv4 = ipv4;
    exports.IPv6 = ipv6;
    exports.check = check;
    exports.createChecker = createChecker$2;
    exports.isIP = isIP;
    exports.isIPv4 = isIPv4;
    exports.isIPv4MappedAddress = isIPv4MappedAddress$1;
    exports.isIPv6 = isIPv6;
    exports.isInSubnet = isInSubnet$2;
    exports.isLocalhost = isLocalhost$2;
    exports.isPrivate = isPrivate$2;
    exports.isReserved = isReserved$2;
    exports.isSpecial = isSpecial$2;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=isInSubnet.js.map
