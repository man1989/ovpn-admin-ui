import React from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Box display="flex">
      <Sidebar />
      <Box flexGrow={1} p={4}>{children}</Box>
    </Box>
  );
}
