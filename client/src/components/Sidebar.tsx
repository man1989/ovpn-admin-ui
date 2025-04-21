import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemText, Toolbar, Typography, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/auth';

const drawerWidth = 200;

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Drawer variant="permanent" sx={{ width: drawerWidth, [`& .MuiDrawer-paper`]: { width: drawerWidth } }}>
      <Toolbar />
      <Box p={2}>
        <Typography variant="h6">VPN Admin</Typography>
      </Box>
      <List>
        {['Dashboard', 'Clients'].map((text) => (
          <ListItem key={text} disablePadding>
            <ListItemButton onClick={() => navigate(`/${text.toLowerCase()}`)}>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box p={2}>
        <Button variant="outlined" color="error" fullWidth onClick={handleLogout}>Logout</Button>
      </Box>
    </Drawer>
  );
}
