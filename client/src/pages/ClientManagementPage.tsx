import React, { useEffect, useState } from 'react';
import {
  Typography, Button, TextField, Paper, Stack, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, Chip, Box, Divider
} from '@mui/material';
import axios from 'axios';
import EmailIcon from '@mui/icons-material/Email';
import DownloadIcon from '@mui/icons-material/Download';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { format } from 'date-fns';
import { getToken } from '../utils/auth';

type Client = {
  name: string;
  status: 'active' | 'revoked';
  createdAt: string;
  revokedAt?: string | null;
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState('');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailClient, setEmailClient] = useState('');
  const [email, setEmail] = useState('');

  const token = getToken();
  const fetchClients = async () => {
    const res = await axios.get('/api/clients/all', {
      headers: {
        "authorization": `bearer ${token}`
      }
    });
    setClients(res.data.clients);
  };
  
  const handleAdd = async () => {
    await axios.post('/api/clients/create', { name });
    setName('');
    fetchClients();
  };

  const handleRevoke = async (client: string) => {
    await axios.post('/api/clients/revoke', { name: client });
    fetchClients();
  };

  const handleDelete = async (client: string) => {
    await axios.post('/api/clients/delete', { name: client });
    fetchClients();
  };

  const handleDownload = (client: string) => {
    window.open(`/api/clients/${client}/download`, '_blank');
  };

  const handleEmailDialogOpen = (client: string) => {
    setEmailClient(client);
    setEmailDialogOpen(true);
  };

  const handleEmailSend = async () => {
    await axios.post(`/api/clients/${emailClient}/email`, { email });
    setEmailDialogOpen(false);
    setEmail('');
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const renderStatusIcon = (status: 'active' | 'revoked') => (
    <FiberManualRecordIcon
      fontSize="small"
      sx={{ color: status === 'active' ? 'green' : 'grey', mr: 1 }}
    />
  );

  return (
    <Paper elevation={2} sx={{ p: 4 }}>
      <Typography variant="h6">Manage Clients</Typography>
      <Stack direction="row" spacing={2} mt={2} mb={4}>
        <TextField label="Client Name" value={name} onChange={e => setName(e.target.value)} />
        <Button variant="contained" onClick={handleAdd}>Add</Button>
      </Stack>

      <Stack spacing={2}>
        {clients.map(client => (
          <Paper key={client.name} sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center">
                {renderStatusIcon(client.status)}
                <Typography variant="subtitle1">{client.name}</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <IconButton onClick={() => handleDownload(client.name)}><DownloadIcon /></IconButton>
                <IconButton onClick={() => handleEmailDialogOpen(client.name)}><EmailIcon /></IconButton>
                <Button variant="outlined" color="warning" onClick={() => handleRevoke(client.name)}>Revoke</Button>
                <Button variant="outlined" color="error" onClick={() => handleDelete(client.name)}>Delete</Button>
              </Stack>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={4}>
              <Chip
                label={`Created: ${format(new Date(client.createdAt), 'PPPp')}`}
                variant="outlined"
              />
              {client.revokedAt && (
                <Chip
                  label={`Revoked: ${format(new Date(client.revokedAt), 'PPPp')}`}
                  variant="outlined"
                  color="warning"
                />
              )}
            </Stack>
          </Paper>
        ))}
      </Stack>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)}>
        <DialogTitle>Email Config to User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Recipient Email"
            type="email"
            fullWidth
            variant="standard"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEmailSend} disabled={!email}>Send</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
