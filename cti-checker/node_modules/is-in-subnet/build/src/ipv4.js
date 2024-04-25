"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSpecial = exports.isReserved = exports.isLocalhost = exports.isPrivate = exports.createChecker = exports.isInSubnet = void 0;
var util = require("./util");
var ipRange_1 = require("./ipRange");
/**
 * Given an IPv4 address, convert it to a 32-bit long integer.
 * @param ip the IPv4 address to expand
 * @throws if the string is not a valid IPv4 address
 */
function ipv4ToLong(ip) {
    if (!util.isIPv4(ip)) {
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
exports.isInSubnet = isInSubnet;
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
exports.createChecker = createChecker;
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
        specialNetsCache['private'] = createChecker(ipRange_1.default.private.ipv4);
    }
    return specialNetsCache['private'](address);
}
exports.isPrivate = isPrivate;
/** Test if the given IP address is a localhost address. */
function isLocalhost(address) {
    if ('localhost' in specialNetsCache === false) {
        specialNetsCache['localhost'] = createChecker(ipRange_1.default.localhost.ipv4);
    }
    return specialNetsCache['localhost'](address);
}
exports.isLocalhost = isLocalhost;
/** Test if the given IP address is in a known reserved range and not a normal host IP */
function isReserved(address) {
    if ('reserved' in specialNetsCache === false) {
        specialNetsCache['reserved'] = createChecker(ipRange_1.default.reserved.ipv4);
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
        specialNetsCache['special'] = createChecker(__spreadArrays(ipRange_1.default.private.ipv4, ipRange_1.default.localhost.ipv4, ipRange_1.default.reserved.ipv4));
    }
    return specialNetsCache['special'](address);
}
exports.isSpecial = isSpecial;
//# sourceMappingURL=ipv4.js.map