import net from "node:net";
import { exec } from 'child_process';
import { readFile, unlink, writeFile } from 'fs/promises';
import path, { join } from 'path';
import forge from "node-forge";
import { compile } from "handlebars";
import { pathExists } from '../utils';


const MANAGEMENT_HOST = process.env.MANAGEMENT_HOST || '127.0.0.1';
const MANAGEMENT_PORT = (process.env.MANAGEMENT_PORT && Number(process.env.MANAGEMENT_PORT)) || 7505;

const OPENVPN_PATH = process.env.OPENVPN_PATH || "/etc/openvpn"
const EASYRSA_DIR = process.env.OPENVPN_EASY_RSA_PATH || '/etc/openvpn/easy-rsa';
const OUTPUT_DIR = path.join(__dirname, '../../ovpn/generated');
const BASE_CONFIG = process.env.BASE_COFNIG || '/etc/openvpn/client-base.conf';


class VpnManager {
    async addClient(clientName: string): Promise<string> {
        const buildCmd = `cd ${EASYRSA_DIR} && ./easyrsa build-client-full ${clientName} nopass`;
        const configPath = path.join(OUTPUT_DIR, `${clientName}.ovpn`);
    
        await this.execShell(buildCmd);
        await this.generateOvpnConfig(clientName, configPath);
        return configPath;
    }

    async deleteClient(clientName: string): Promise<void> {
        const revokeCmd = `cd ${EASYRSA_DIR} && ./easyrsa revoke ${clientName} && ./easyrsa gen-crl`;
        await this.execShell(revokeCmd);
    
        const filesToDelete = [
            path.join(EASYRSA_DIR, 'pki/issued', `${clientName}.crt`),
            path.join(EASYRSA_DIR, 'pki/private', `${clientName}.key`),
            path.join(EASYRSA_DIR, 'pki/reqs', `${clientName}.req`),
            path.join(OUTPUT_DIR, `${clientName}.ovpn`)
        ];
    
        for (const file of filesToDelete) {
            if (await pathExists(file)) {
                await unlink(file);
            }
        }
    }
    
    async getCertInfo(certPath: string) {
        const certPem = await readFile(certPath, 'utf8');
        const cert = forge.pki.certificateFromPem(certPem);
    
        const issueDate = cert.validity.notBefore;
        const expireDate = cert.validity.notAfter;
        const serialNumber = cert.serialNumber;
        const cn = cert.subject.getField('CN').value;
    
        return {
            name: cn,
            id: serialNumber,
            issuedAt: issueDate,
            expiresAt: expireDate,
        };
    }
    async sendCommand(command: string): Promise<string> {
        switch (command) {
            case "status":
                return Promise.resolve(`
TITLE,OpenVPN 2.6.3 x86_64-pc-linux-gnu [SSL (OpenSSL)] [LZO] [LZ4] [EPOLL] [PKCS11] [MH/PKTINFO] [AEAD] [DCO]
TIME,2025-04-21 16:25:33,1745232933
HEADER,CLIENT_LIST,Common Name,Real Address,Virtual Address,Virtual IPv6 Address,Bytes Received,Bytes Sent,Connected Since,Connected Since (time_t),Username,Client ID,Peer ID,Data Channel Cipher
CLIENT_LIST,bollineni_mohan,117.202.140.164:59117,10.8.0.6,,61011660,73712683,2025-04-21 13:27:19,1745222239,UNDEF,0,0,AES-256-GCM
HEADER,ROUTING_TABLE,Virtual Address,Common Name,Real Address,Last Ref,Last Ref (time_t)
ROUTING_TABLE,10.8.0.6,bollineni_mohan,117.202.140.164:59117,2025-04-21 16:25:33,1745232933
GLOBAL_STATS,Max bcast/mcast queue length,1
GLOBAL_STATS,dco_enabled,0
END                
`);
            default:
                return Promise.resolve("");
        }
    }
    async xsendCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();
            let buffer = '';

            client.connect(MANAGEMENT_PORT, MANAGEMENT_HOST, () => {
                client.write(command + '\n');
            });

            client.on('data', (data) => {
                console.log(data.toString())
                buffer += data.toString();
                if (buffer.includes('END') || (command === 'status' && buffer.includes('CLIENT_LIST'))) {
                    client.end();
                    resolve(buffer);
                }
            });

            client.on('error', (err) => {
                console.log(err);
                reject(err.message);
            });

            client.on('end', () => {
                resolve(buffer);
            });
        });
    }

    private async execShell(cmd: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(cmd, (err, stdout, stderr) => {
                if (err) return reject(stderr || stdout);
                resolve(stdout);
            });
        });
    }
    
    private async generateOvpnConfig(clientName: string, outputPath: string): Promise<void> {
        const crt = await readFile(`${EASYRSA_DIR}/pki/issued/${clientName}.crt`, 'utf8');
        const key = await readFile(`${EASYRSA_DIR}/pki/private/${clientName}.key`, 'utf8');
        const ca = await readFile(`${EASYRSA_DIR}/pki/ca.crt`, 'utf8');
        const tc = await readFile(`${OPENVPN_PATH}/tc.key`, 'utf8');
        const base = await readFile(BASE_CONFIG, 'utf8');
        const template = await readFile(join("../templates", "default.hbs"))

        const templateFn = compile(template);
        const certificate = templateFn({
            base,
            ca,
            crt,
            key, 
            tc
        });
        await writeFile(outputPath, certificate);
    }    
}

export const vpnManager = new VpnManager();