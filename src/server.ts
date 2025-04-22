import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

import clientRoutes from './routes/clients';
import statusRoutes from './routes/status';
import authRoutes from './routes/auth';
import authenticateToken from './middleware/auth';
import path from 'node:path';
import { DB } from './db';
import { syncMissingClients } from './services/worker';

// console.log(process.env);

(async () => {
  const db = new DB();
  await db.connect();
  await syncMissingClients();

  const app = express();
  const PORT = process.env.PORT || 3000;
  
  app.use(cors());
  app.use(bodyParser.json());
  
  app.use('/api', authRoutes);
  app.use('/api/clients', authenticateToken, clientRoutes);
  app.use('/api', authenticateToken, statusRoutes);
  
  if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../build/ui')));
    
      // All other routes should return the index.html file from the React app
      app.get(["/clients", "/dashboard", "/"], (_, res) => {
        res.sendFile(path.join(__dirname, '../build/ui/index.html'));
      });
    }
  
  app.listen(PORT, () => {
      console.log(`VPN Manager API running on http://localhost:${PORT}`);
  });
  
})()