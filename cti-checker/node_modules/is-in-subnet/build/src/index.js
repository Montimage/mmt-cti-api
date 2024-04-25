"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.check = exports.isSpecial = exports.isReserved = exports.isIPv4MappedAddress = exports.isLocalhost = exports.isPrivate = exports.createChecker = exports.isInSubnet = exports.IPv6 = exports.IPv4 = exports.isIPv6 = exports.isIPv4 = exports.isIP = void 0;
var IPv4 = require("./ipv4");
exports.IPv4 = IPv4;
var IPv6 = require("./ipv6");
exports.IPv6 = IPv6;
var util = require("./util");
var util_1 = require("./util");
Object.defineProperty(exports, "isIP", { enumerable: true, get: function () { return util_1.isIP; } });
Object.defineProperty(exports, "isIPv4", { enumerable: true, get: function () { return util_1.isIPv4; } });
Object.defineProperty(exports, "isIPv6", { enumerable: true, get: function () { return util_1.isIPv6; } });
/**
 * Test if the given IP address is contained in the specified subnet.
 * @param address the IPv4 or IPv6 address to check
 * @param subnet the IPv4 or IPv6 CIDR to test (or an array of them)
 * @throws if any of the address or subnet(s) are not valid IP addresses, or the CIDR
 *  prefix length is not valid
 */
function isInSubnet(address, subnetOrSubnets) {
    return createChecker(subnetOrSubnets)(address);
}
exports.isInSubnet = isInSubnet;
/**
 * Create a function to test if the given IP address is contained in the specified subnet.
 * @param subnet the IPv4 or IPv6 CIDR to test (or an array of them)
 * @throws if any of the subnet(s) are not valid IP addresses, or the CIDR
 *  prefix length is not valid
 */
function createChecker(subnetOrSubnets) {
    if (!Array.isArray(subnetOrSubnets)) {
        return createChecker([subnetOrSubnets]);
    }
    var subnetsByVersion = subnetOrSubnets.reduce(function (acc, subnet) {
        var ip = subnet.split('/')[0];
        acc[util.isIP(ip)].push(subnet);
        return acc;
    }, { 0: [], 4: [], 6: [] });
    if (subnetsByVersion[0].length !== 0) {
        throw new Error("some subnets are not valid IP addresses: " + subnetsByVersion[0]);
    }
    var check4 = IPv4.createChecker(subnetsByVersion[4]);
    var check6 = IPv6.createChecker(subnetsByVersion[6]);
    return function (address) {
        if (!util.isIP(address)) {
            throw new Error("not a valid IPv4 or IPv6 address: " + address);
        }
        // for mapped IPv4 addresses, compare against both IPv6 and IPv4 subnets
        if (util.isIPv6(address) && IPv6.isIPv4MappedAddress(address)) {
            return check6(address) || check4(IPv6.extractMappedIpv4(address));
        }
        if (util.isIPv6(address)) {
            return check6(address);
        }
        else {
            return check4(address);
        }
    };
}
exports.createChecker = createChecker;
/** Test if the given IP address is a private/internal IP address. */
function isPrivate(address) {
    if (util.isIPv6(address)) {
        if (IPv6.isIPv4MappedAddress(address)) {
            return IPv4.isPrivate(IPv6.extractMappedIpv4(address));
        }
        return IPv6.isPrivate(address);
    }
    else {
        return IPv4.isPrivate(address);
    }
}
exports.isPrivate = isPrivate;
/** Test if the given IP address is a localhost address. */
function isLocalhost(address) {
    if (util.isIPv6(address)) {
        if (IPv6.isIPv4MappedAddress(address)) {
            return IPv4.isLocalhost(IPv6.extractMappedIpv4(address));
        }
        return IPv6.isLocalhost(address);
    }
    else {
        return IPv4.isLocalhost(address);
    }
}
exports.isLocalhost = isLocalhost;
/** Test if the given IP address is an IPv4 address mapped onto IPv6 */
function isIPv4MappedAddress(address) {
    if (util.isIPv6(address)) {
        return IPv6.isIPv4MappedAddress(address);
    }
    else {
        return false;
    }
}
exports.isIPv4MappedAddress = isIPv4MappedAddress;
/** Test if the given IP address is in a known reserved range and not a normal host IP */
function isReserved(address) {
    if (util.isIPv6(address)) {
        if (IPv6.isIPv4MappedAddress(address)) {
            return IPv4.isReserved(IPv6.extractMappedIpv4(address));
        }
        return IPv6.isReserved(address);
    }
    else {
        return IPv4.isReserved(address);
    }
}
exports.isReserved = isReserved;
/**
 * Test if the given IP address is a special address of any kind (private, reserved,
 * localhost)
 */
function isSpecial(address) {
    if (util.isIPv6(address)) {
        if (IPv6.isIPv4MappedAddress(address)) {
            return IPv4.isSpecial(IPv6.extractMappedIpv4(address));
        }
        return IPv6.isSpecial(address);
    }
    else {
        return IPv4.isSpecial(address);
    }
}
exports.isSpecial = isSpecial;
exports.check = isInSubnet;
//# sourceMappingURL=index.js.map