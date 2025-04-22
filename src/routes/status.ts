import express from 'express';
import { vpnManager } from '../services/vpnManager';

const router = express.Router();

interface Client {
    name: string;
    realAddress: string;
    bytesReceived: string;
    bytesSent: string;
    connectedSince: string;
}

function parseStatus(output: string): Client[] {
    const lines = output.split('\n');
    const clients: Client[] = [];

    for (const line of lines) {
        if (line.startsWith('CLIENT_LIST')) {
            const parts = line.split(',');
            clients.push({
                name: parts[1],
                realAddress: parts[2],
                bytesReceived: parts[5],
                bytesSent: parts[6],
                connectedSince: parts[7]
            });
        }
    }

    return clients;
}

router.get('/status', async (_req, res) => {
    try {
        const output = await vpnManager.sendCommand('status');
        const clients = parseStatus(output);
        const data = clients.reduce((result, client) => {
            result[client.name] = client;
            return result;
        }, {} as Record<string, Client>)
        res.json( data );
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

router.get('/traffic', async (_req, res) => {
    try {
        const output = await vpnManager.sendCommand('status');
        const traffic = parseStatus(output).map(client => ({
            clientName: client.name,
            bytesOut: client.bytesSent,
            bytesIn: client.bytesReceived
        }));
        res.json( traffic );
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

export default router;
