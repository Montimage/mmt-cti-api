"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSpecial = exports.isReserved = exports.isIPv4MappedAddress = exports.isLocalhost = exports.isPrivate = exports.createChecker = exports.isInSubnet = exports.extractMappedIpv4 = void 0;
var util = require("./util");
var ipRange_1 = require("./ipRange");
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
    if (!matches || !util.isIPv4(matches[2])) {
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
    if (!matches || !util.isIPv4(matches[2])) {
        throw new Error("not a mapped IPv4 address: " + ip);
    }
    return matches[2];
}
exports.extractMappedIpv4 = extractMappedIpv4;
/**
 * Given an IP address that may have double-colons, expand all segments and return them
 * as an array of 8 segments (16-bit words). As a peformance enhancement (indicated by
 * profiling), for any segment that was missing but should be a '0', returns undefined.
 * @param ip the IPv6 address to expand
 * @throws if the string is not a valid IPv6 address
 */
function getIpv6Segments(ip) {
    if (!util.isIPv6(ip)) {
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
function isInSubnet(address, subnetOrSubnets) {
    return createChecker(subnetOrSubnets)(address);
}
exports.isInSubnet = isInSubnet;
/**
 * Create a function to test if a given IPv6 address is contained in the specified subnet.
 * @param subnet the IPv6 CIDR to test (or an array of them)
 * @throws if the subnet(s) are not valid IP addresses, or the CIDR prefix lengths
 *  are not valid
 */
function createChecker(subnetOrSubnets) {
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
exports.createChecker = createChecker;
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
var specialNetsCache = {};
/** Test if the given IP address is a private/internal IP address. */
function isPrivate(address) {
    if ('private' in specialNetsCache === false) {
        specialNetsCache['private'] = createChecker(ipRange_1.default.private.ipv6);
    }
    return specialNetsCache['private'](address);
}
exports.isPrivate = isPrivate;
/** Test if the given IP address is a localhost address. */
function isLocalhost(address) {
    if ('localhost' in specialNetsCache === false) {
        specialNetsCache['localhost'] = createChecker(ipRange_1.default.localhost.ipv6);
    }
    return specialNetsCache['localhost'](address);
}
exports.isLocalhost = isLocalhost;
/** Test if the given IP address is an IPv4 address mapped onto IPv6 */
function isIPv4MappedAddress(address) {
    if ('mapped' in specialNetsCache === false) {
        specialNetsCache['mapped'] = createChecker('::ffff:0:0/96');
    }
    if (specialNetsCache['mapped'](address)) {
        var matches = address.match(mappedIpv4);
        return Boolean(matches && util.isIPv4(matches[2]));
    }
    return false;
}
exports.isIPv4MappedAddress = isIPv4MappedAddress;
/** Test if the given IP address is in a known reserved range and not a normal host IP */
function isReserved(address) {
    if ('reserved' in specialNetsCache === false) {
        specialNetsCache['reserved'] = createChecker(ipRange_1.default.reserved.ipv6);
    }
    return specialNetsCache['reserved'](address);
}
exports.isReserved = isReserved;
/**
 * Test if the given IP address is a special address of any kind (private, reserved,
 * localhost)
 */
function isSpecial(address) {
    if ('special' in specialNetsCache === false) {
        specialNetsCache['special'] = createChecker(__spreadArrays(ipRange_1.default.private.ipv6, ipRange_1.default.localhost.ipv6, ipRange_1.default.reserved.ipv6));
    }
    return specialNetsCache['special'](address);
}
exports.isSpecial = isSpecial;
//# sourceMappingURL=ipv6.js.map