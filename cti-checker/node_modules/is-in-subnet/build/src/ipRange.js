"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
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
//# sourceMappingURL=ipRange.js.map