import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Typography } from '@mui/material';

type TrafficData = {
  timestamp: string;
  received: number;
  sent: number;
};

interface Props {
  data: TrafficData[];
}

export default function TrafficChart({ data }: Props) {
  return (
    <div>
      <Typography variant="h6" sx={{ mb: 2 }}>Traffic Usage</Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} />
          <YAxis />
          <Tooltip formatter={(value: any) => `${(value / 1024 / 1024).toFixed(2)} MB`} />
          <Legend />
          <Line type="monotone" dataKey="received" stroke="#8884d8" name="Received (B)" />
          <Line type="monotone" dataKey="sent" stroke="#82ca9d" name="Sent (B)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
