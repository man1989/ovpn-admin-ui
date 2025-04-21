import React, { useEffect, useState } from 'react';
import { Typography, Paper } from '@mui/material';
import axios from 'axios';
import { getToken } from '../utils/auth';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';


export default function Dashboard() {
  const token = getToken();
  const [traffic, setTraffic] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/traffic', {
      headers: {
        "authorization": `bearer ${token}`
      }
    }).then(res => {
      console.log(res);
      // Assume res.data is an array of clients with their traffic stats
      const topClients = res.data
        .sort((a: any, b: any) => (b.bytesIn + b.bytesOut) - (a.bytesIn + a.bytesOut))
        .slice(0, 10)
      console.log(topClients);
      setTraffic(topClients);
    });
  }, []);

  return (
    <Paper elevation={2} sx={{ p: 4 }}>
      <Typography variant="h6" gutterBottom>Top 10 Clients by Traffic</Typography>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={traffic}>
          <XAxis dataKey="clientName" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="bytesIn" stroke="#8884d8" name="Bytes In" />
          <Line type="monotone" dataKey="bytesOut" stroke="#82ca9d" name="Bytes Out" />
        </LineChart>
      </ResponsiveContainer>

    </Paper>
  );
}
