const express = require("express")
const dns = require('dns');
const { MongoClient } = require('mongodb')
const { isInSubnet } = require('is-in-subnet');
const router = express.Router()

const url = 'mongodb://localhost:27017/CTI';


//defining route to check if an IP is in the database 
router.get('/ip/:address', async (req, res) => {
    let { address } = req.params;

    // Regular Expression to check IP IPv4 format
    const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    let dataResponse

    if (ipPattern.test(address)) {
        try {
            //opening connections
            const client = new MongoClient(url);
            await client.connect();
            const db = client.db();
            const collection = db.collection('dangerousIPs');
            
            // Using 'find' to 'toArray' to obtain results
            const c = await collection.countDocuments()
            dataResponse = await collection.find({
                "type":"IP", 
                "data": {$elemMatch: {$eq: address}}
            }).toArray();
            
            for(let obj of dataResponse){
                obj.data = address
            }
            
            // Closing Conection
            await client.close();
            
            
        } catch (error) {
            console.error('Error in conecting to MongoDB server', error);
        }

        res.json(dataResponse)
    } else {
        res.status(400).json({ error: 'bad input parameter' });
    }
});


//defining route to check if a given subnet is in the database
router.get('/subnet/:address', async (req, res) => {
    const { address } = req.params;

    // Regular Expression to check IP IPv4 format
    const subnetPattern = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(3[0-2]|[12]?[0-9])$/;

    let dataResponse

    if (subnetPattern.test(address)) {
        try {
            //opening connections
            const client = new MongoClient(url);
            await client.connect();
            const db = client.db();
            const collection = db.collection('dangerousIPs');
            
            // Using 'find' to 'toArray' to obtain results
            const c = await collection.countDocuments()
            dataResponse = await collection.find({
                "type":"SUBNET", 
                "data": {$elemMatch: {$eq: address}}
            }).toArray();
            
            for(let obj of dataResponse){
                obj.data = address
            }
            
            // Closing Conection
            await client.close();
            
            
        } catch (error) {
            console.error('Error in conecting to MongoDB server', error);
        }

        res.json(dataResponse)
    } else {
        res.status(400).json({ error: 'bad input parameter' });
    }  
});

//takes the object of the database and checks in the list of subnets if an IP is inside of any subnet
function checkIPInSubnets(objects, ip) {
    let responseObjects = []
    for (const doc of objects) {    
        for (const subnet of doc.data){
            if(isInSubnet(ip, subnet)){
                doc.data = subnet
                responseObjects.push(doc)
            }            
        }
    }
    return responseObjects;
}

//DNS resolution async function
async function resolveDNS(address) {
    return new Promise((resolve, reject) => {
    dns.lookup(address, (err, ip, family) => {
        if (err) {
        reject(err);
        } else {
        resolve(ip);
        }
    });
    });
}

//general function that handles IPs, SUBNETs, domain names and also checks for the IP inside a subnet
router.get('/address/:address', async (req, res) => {
    let { address } = req.params;
    let dataResponse = [];
    
    // Regular Expression to check IP IPv4 format
    const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // Regular Expression to check SUBNET format
    const subnetPattern = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(3[0-2]|[12]?[0-9])$/;
    
    // Regular expression for domains
    const domainPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]+$/;

    //waits for DNS resolution
    try {
        
        if(domainPattern.test(address)){
            address = await resolveDNS(address);
        }
        
        //checks for IPv4 pattern
        if(ipPattern.test(address)) {
            try {
                //opening connections
                const client = new MongoClient(url);
                await client.connect();
                const db = client.db();
                const collection = db.collection('dangerousIPs');
                
                //looking for the exact IP in the database 
                dataResponse = await collection.find({
                    "type":"IP", 
                    "data": {$elemMatch: {$eq: address}}
                }).toArray();
                
                for(let obj of dataResponse){
                    obj.data = address
                }
                
                //TODO -> CHECKING IF A SPECIALIZED QUERY
                //looking for the IP inside a subnet in the database
                let allSubnets = await collection.find({
                    "type":"SUBNET", 
                }).toArray();

                const matchedSubnets = checkIPInSubnets(allSubnets, address)
                dataResponse = dataResponse.concat(matchedSubnets)

                // Closing Conection
                await client.close();
                res.json(dataResponse)
                
            } catch (error) {
                console.error('Error in conecting to MongoDB server', error);
                res.status(400).json({ error: 'Database connection error' });
            }
        }

        // Handle subnet
        else if(subnetPattern.test(address)) {
            
            try {
                //opening connections
                const client = new MongoClient(url);
                await client.connect();
                const db = client.db();
                const collection = db.collection('dangerousIPs');
                
                // Using 'find' to 'toArray' to obtain results
                const c = await collection.countDocuments()
                dataResponse = await collection.find({
                    "type":"SUBNET", 
                    "data": {$elemMatch: {$eq: address}}
                }).toArray();
                
                for(let obj of dataResponse){
                    obj.data = address
                }
                
                // Closing Conection
                await client.close();
                
                
            } catch (error) {
                console.error('Error in conecting to MongoDB server', error);
            }
    
            res.json(dataResponse)
        }
        else{
            
            res.status(400).json({ error: 'bad input parameter', "Returned address": address });
        }
        
    } catch (error) {
        res.status(400).json({ "Internal server error": error });
    }
});


module.exports = router;
