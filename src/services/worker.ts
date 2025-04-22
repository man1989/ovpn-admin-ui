import { readdir, readFile } from "node:fs/promises";
// import path from "node:path";
import { vpnManager } from "./vpnManager";
import { Client } from "../db/Client";
import { AppConfig } from "../db/AppConfig";

// import { EventEmitter } from "node:events";

console.log(process.env.OPENVPN_PKI_PATH);

const PKI_PATH = process.env.OPENVPN_PKI_PATH || "/etc/openvpn/server/pki"
// const INDEX_FILE = path.resolve(`${PKI_PATH}/index.txt`);
// const CERT_PATH = path.resolve(`${PKI_PATH}/issued`);

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

// function parseContent(content: string): any[] {
//   const Status_Map = {
//     V: "active",
//     R: "revoked",
//     E: "expired"
//   };
// //   const data = readFileSync(INDEX_FILE, 'utf-8');
//   const lines = content.split('\n').filter(Boolean);
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

export async function resyncClients(){
    const files = await readdir(`${PKI_PATH}/issued`);
    for(const file of files) {
        const cert = await readFile(`${PKI_PATH}/issued/${file}`, "utf-8");
        const certinfo = await vpnManager.getCertInfo(cert);
        const client = new Client({
            id: certinfo.id,
            name: certinfo.name,
            expiryDate: certinfo.expiresAt.toISOString(),
            issuedDate: certinfo.issuedAt.toISOString(),
        });
        // console.log(client.toJSON());
        await client.upsert();
    }

}

export async function syncMissingClients(){
    const files = await readdir(`${PKI_PATH}/issued`);
    const configVal = await AppConfig.findByName("alreadySynced");
    const alreadySynced = configVal ? "true" === configVal : false
    if(alreadySynced) {
        return;
    }
    for(const file of files) {
        if(["server.crt"].includes(file)){
            continue;
        }
        const cert = await readFile(`${PKI_PATH}/issued/${file}`, "utf-8");
        const certinfo = await vpnManager.getCertInfo(cert);
        // console.log(certinfo);
        const client = new Client({
            id: certinfo.id,
            name: certinfo.name,
            expiryDate: certinfo.expiresAt.toISOString(),
            issuedDate: certinfo.issuedAt.toISOString(),
        });
        await client.save();
    }
    const appConfig = new AppConfig({
        name: "alreadySynced",
        value: "true"
    });
    appConfig.save();
}

// (async () => {
//     const watcher = watch(INDEX_FILE);
//     for await (const event of watcher) {
//         if(!["rename"].includes(event.eventType)){
//             const file = await readFile(INDEX_FILE);
//             console.log(event)
//         }
//     }
// })();

