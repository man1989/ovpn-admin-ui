import React, { useState } from 'react';
import { Container, TextField, Button, Typography, Paper } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const login = async () => {
    try {
      const res = await axios.post('/api/login', { username, password });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch {
      alert('Invalid credentials');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 10 }}>
        <Typography variant="h5">Login</Typography>
        <TextField fullWidth label="Username" value={username} onChange={e => setUsername(e.target.value)} margin="normal" />
        <TextField fullWidth label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} margin="normal" />
        <Button variant="contained" fullWidth onClick={login} sx={{ mt: 2 }}>Login</Button>
      </Paper>
    </Container>
  );
}
