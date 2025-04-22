import express from 'express';
import { vpnManager } from '../services/vpnManager';
// import path from 'node:path';
// import { readFile, readdir, stat } from "node:fs/promises";
// import { readdirSync, readFileSync } from 'node:fs';
import { Client } from '../db/Client';
import { resyncClients } from '../services/worker';
import { readFile } from 'fs/promises';
import { sendFileByEmail } from '../services/emailManager';
// import { readdir } from 'node:fs';
// const forge = require('node-forge');


const router = express.Router();
const PKI_PATH = process.env.OPENVPN_PKI_PATH || "/etc/openvpn/server/pki"
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
  console.log("req.body", req.body);
  const { name: clientName } = req.body;
  try {
    await vpnManager.addClient(clientName);
    const certContent = await readFile(`${PKI_PATH}/issued/${clientName}.crt`, "utf-8");
    const cert = await vpnManager.getCertInfo(certContent);
    const client = new Client({
      id: cert.id,
      name: clientName,
      expiryDate: cert.expiresAt.toISOString(),
      issuedDate: cert.issuedAt.toISOString()
    });
    await client.save();
    res.json(client.toJSON());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/revoke', async (req, res) => {
  const { name: clientName } = req.body;
  try {
    await vpnManager.revokeClient(clientName);
    await Client.update({ name: clientName }, {
      revokedAt: new Date().toISOString()
    });
    res.json({ message: `Client ${clientName} revoked` });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/delete', async (req, res) => {
  const { name: clientName } = req.body;
  try {
    await vpnManager.deleteClient(clientName);
    await Client.removeByName(clientName);
    res.json({ message: `Client ${clientName} deleted.` });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/', async (_, res) => {
  const clients = await Client.find({})
  const data = clients.map(c=>c.toJSON()).sort((a, b)=> {
    if(a.issuedDate && b.issuedDate) {
      return new Date(a.issuedDate).getTime() > new Date(b.issuedDate).getTime() ? -1 : 1
    }
    return 0;
  });
  console.log(data);
  res.json({ clients: data });
});

router.get('/sync', async (_, res) => {
  await resyncClients();
  res.json({
    message: "success"
  });
});

router.post("/:name/email", async (req, res) => {
  const clientName = req.params.name;
  const email = req.body.email;
  const client = await Client.findByName(clientName);
  if(client) {
    try {
      const cert = await vpnManager.generateOvpnConfig(clientName);
      await sendFileByEmail(email, cert);
      res.send({
        message: "success"
      });
    } catch(err: unknown) {
      console.error(err);
      if(err instanceof Error) {
        res.status(400).send({
          message: err.message
        });
      }
    }
  }else{
    res.status(400).json({
      message: `${clientName} does not exists`
    });
  }
});

router.get("/:name/download", async (req, res) => {
  const clientName = req.params.name;
  const client = await Client.findByName(clientName);
  if(client) {
    const cert = await vpnManager.generateOvpnConfig(clientName);
    res.send(cert);
  }
});


export default router;
