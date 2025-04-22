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
  status?: 'active' | 'revoked'
  issuedDate: string;
  expiryDate?: string | null;
  revokedAt?: string | null;
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [reTrigger, setTrigger] = useState(false);
  const [name, setName] = useState('');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailClient, setEmailClient] = useState('');
  const [email, setEmail] = useState('');

  const token = getToken();
  
  const fetchClients = async (name?:  string) => {
    console.log("Called: ", name);
    const res = await axios.get<Record<"clients", Client[]>>('/api/clients', {
      headers: {
        "authorization": `bearer ${token}`
      }
    });
    setClients(res.data.clients);
  };
  
  const handleAdd = async () => {
    console.log("handleAdd: ", name);
    await axios.post('/api/clients/create', { name }, {
      headers: {
        "authorization": `bearer ${token}`
      }
    });
    setName('');
    fetchClients();
  };

  const handleSync = async () => {
    await axios.get('/api/clients/sync', {
      headers: {
        "authorization": `bearer ${token}`
      }
    }); 
    fetchClients();
  };

  const handleRevoke = async (client: string) => {
    await axios.post('/api/clients/revoke', { name: client }, {
      headers: {
        "authorization": `bearer ${token}`
      }
    });
    fetchClients();
  };

  const handleDelete = async (client: string) => {
    await axios.post('/api/clients/delete', { name: client }, {
      headers: {
        "authorization": `bearer ${token}`
      }
    });
    fetchClients();
  };

  const handleDownload = async (client: string) => {
    const res = await axios.get(`/api/clients/${client}/download`, {
      headers: {
        "authorization": `bearer ${token}`
      }
    });
    let blob = new Blob([res.data], {type: 'application/octet-stream'})
    const href = URL.createObjectURL(blob);

    // create "a" HTML element with href to file & click
    const link = document.createElement('a');
    link.href = href;
    link.setAttribute('download', `${client}.ovpn`); //or any other extension
    document.body.appendChild(link);
    link.click();

    // clean up "a" element & remove ObjectURL
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
    // window.open(`/api/clients/${client}/download`, '_blank');
  };

  const handleEmailDialogOpen = (client: string) => {
    setEmailClient(client);
    setEmailDialogOpen(true);
  };

  const handleEmailSend = async () => {
    await axios.post(`/api/clients/${emailClient}/email`, { email }, {
      headers: {
        "authorization": `bearer ${token}`
      }
    });
    setEmailDialogOpen(false);
    setEmail('');
  };

  useEffect(() => {
    fetchClients("global");
  }, []);

  useEffect(() => {
    let timerId = setTimeout(async () => {
      const res = await axios.get("/api/status", {
        headers: {
          "Authorization": `bearer ${token}`
        }
      });
      const activeClients = res.data as Record<string, Client>;
      const udpatedClients = clients.map((client) => {
        let status: "active" | "revoked" = "revoked";
        if(activeClients[client.name]){
          status = "active"
        }
        return {...client, status: status};
      });
      setClients(udpatedClients);
    }, 2000);
    return () => clearTimeout(timerId);
  }, [clients]);

  return (
    <Paper elevation={2} sx={{ p: 4 }}>
      <Typography variant="h6">Manage Clients</Typography>
      <Stack direction="row" spacing={2} mt={2} mb={4}>
        <TextField label="Client Name" value={name} onChange={e => {
          console.log(e.target.value)
          setName(e.target.value);
        }} />
        <Button variant="contained" onClick={handleAdd}>Add</Button>
        <Button variant="contained" onClick={handleSync}>Resync</Button>
      </Stack>

      <Stack spacing={2}>
        {clients.map(client => (
          <Paper key={client.name} sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center">
                <FiberManualRecordIcon fontSize="small" sx={{ color: client.status === 'active' ? '#40ee12' : 'grey', mr: 1 }} />
                <Typography variant="subtitle1">{client.name}</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <IconButton onClick={() => handleDownload(client.name)}><DownloadIcon /></IconButton>
                <IconButton onClick={() => handleEmailDialogOpen(client.name)}><EmailIcon /></IconButton>
                {
                  !client.revokedAt ? <Button variant="outlined" color="warning" onClick={() => handleRevoke(client.name)}>Revoke</Button>
                  : <Button variant="outlined" color="error" onClick={() => handleDelete(client.name)}>Delete</Button>
                }
              </Stack>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label={`Issued: ${format(new Date(client.issuedDate), "dd-mm-yyyy HH:mm:ss")}`}
                variant="outlined"
              />
              {client.expiryDate && (
                <Chip
                  label={`Expiry: ${ format(new Date(client.expiryDate), "dd-mm-yyyy HH:mm:ss") }`}
                  variant="outlined"
                />
              )}
              {client.revokedAt && (
                <Chip
                  label={`Revoked: ${format(new Date(client.revokedAt), "dd-mm-yyyy HH:mm:ss")}`}
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
