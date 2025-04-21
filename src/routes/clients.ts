import express from 'express';
import { vpnManager } from '../services/vpnManager';
// import path from 'node:path';
// import { readFile, readdir, stat } from "node:fs/promises";
// import { readdirSync, readFileSync } from 'node:fs';
import { Client } from '../db/Client';
// import { readdir } from 'node:fs';
// const forge = require('node-forge');


const router = express.Router();
// const PKI_PATH = process.env.OPENVPN_EASY_RSA_PATH + "/pki" || "/etc/openvpn/server/pki"
// const INDEX_FILE = path.resolve(`${PKI_PATH}/index.txt`);
// const CERT_PATH = path.resolve(`${PKI_PATH}/issued`);

// type Client = {
//   id: string,
//   name: string,
//   status: string,
//   expiryDate?: string,
//   revokedAt?: string
// }


// async function getCertInfo(certPath: string) {
//   const certPem = readFile(certPath, 'utf8');
//   const cert = forge.pki.certificateFromPem(certPem);

//   const issueDate = cert.validity.notBefore;
//   const expireDate = cert.validity.notAfter;
//   const serialNumber = cert.serialNumber;
//   const cn = cert.subject.getField('CN').value;

//   return {
//     name: cn,
//     id: serialNumber,
//     issuedAt: issueDate,
//     expiresAt: expireDate,
//   };
// }

// let clientCertPaths: string[] = [];

// function getExistingClients(): any[] {
//   const Status_Map = {
//     V: "active",
//     R: "revoked",
//     E: "expired"
//   };
//   const data = readFileSync(INDEX_FILE, 'utf-8');
//   const lines = data.split('\n').filter(Boolean);
//   const clients = lines.map((line) => {
//     const parts = line.split('\t');
//     const status = parts[0] as keyof typeof Status_Map; // V (valid) or R (revoked) OR E (Expired)
//     const expiryDate = parseEasyRSAdate(parts[1]);
//     const revokedAt = parseEasyRSAdate(parts[2]);
//     const sno = parts[3];
//     const nameField = (parts[parts.length - 1]).replace("\/CN=", "");
//     return {
//       id: sno,
//       name: nameField,
//       status: Status_Map[status],
//       expiryDate: expiryDate,
//       revokedAt: revokedAt
//     };
//   });
//   return clients;
// }

// function loadCerts(){
//   const files = readdirSync(CERT_PATH);
//   for(let file of files){
//     if(file.includes(".crt")){
//       const filePath  = `${CERT_PATH}/${file}`;
//       clientCertPaths.push(filePath);
//     }     
//   }  
// }

// async function getNCerts(offset: number, limit: number){
//   const clients: = 
//   const certPaths = clientCertPaths.slice(offset, limit);
//   for(const certPath of certPaths) {
//     await getCertInfo(certPath);
//   }

// }
// Example usage
// const info = getCertInfo('./pki/issued/client1.crt');
// console.log(info);
// function parseEasyRSAdate(easyDate: string): string | undefined {
//   if (!!easyDate) {
//     return;
//   }
//   const yearPrefix = parseInt(easyDate.slice(0, 2)) < 50 ? '20' : '19';
//   const year = yearPrefix + easyDate.slice(0, 2);
//   const month = easyDate.slice(2, 4);
//   const day = easyDate.slice(4, 6);
//   const hour = easyDate.slice(6, 8);
//   const minute = easyDate.slice(8, 10);
//   const second = easyDate.slice(10, 12);

//   return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
// }

//TODO: needs to update the AllClients
router.post('/create', async (req, res) => {
  const { clientName } = req.body;
  try {
    const path = await vpnManager.addClient(clientName);
    const client = new Client({
      id: new Date().getTime().toString(),
      name: clientName,
      status: "Active",
      certPath: path
    });
    await client.save();
    res.json(client.toJSON());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/delete', async (req, res) => {
  const { clientName } = req.body;
  try {
    await vpnManager.deleteClient(clientName);
    res.json({ message: `Client ${clientName} revoked and deleted.` });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/', async (_, res) => {
  const clients = await Client.find({})
  res.json({ clients });
});

router.get("/:name/download", async (req, res) => {
  const clientName = req.params.name;
  const client = await Client.findByName(clientName);
  if(client && client.certPath) {
    res.download(client.certPath);
  }
});

// router.get('/:name/download', async (req, res) => {
//   const clientName = req.params.name;
//   const filePath = path.join(CERT_PATH, `${clientName}.ovpn`);
//   try {
//     await stat(filePath)
//     res.download(filePath, `${clientName}.ovpn`);
//   } catch (err) {
//     return res.status(404).json({ message: 'Client config not found.' });
//   }
// });

// let AllClients: Client[] = []

// try {
//   AllClients = getExistingClients();
// } catch (err) {
//   console.error(err);
// }

export default router;
