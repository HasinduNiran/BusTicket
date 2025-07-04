import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Chip,
} from '@mui/material';
import { ConfirmationNumber as TicketIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('admin@busticket.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      toast.success('Login successful!');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const fillDemoCredentials = (role) => {
    switch (role) {
      case 'admin':
        setEmail('admin@busticket.com');
        setPassword('admin123');
        break;
      case 'owner':
        setEmail('owner@busticket.com');
        setPassword('owner123');
        break;
      default:
        break;
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <TicketIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography component="h1" variant="h4" gutterBottom>
            Bus Ticket System
          </Typography>
          <Typography component="h2" variant="h6" color="text.secondary" gutterBottom>
            Admin Panel
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
              Demo Credentials:
            </Typography>
            <Grid container spacing={1} justifyContent="center">
              <Grid item>
                <Chip
                  label="Admin"
                  color="primary"
                  variant="outlined"
                  onClick={() => fillDemoCredentials('admin')}
                  clickable
                />
              </Grid>
              <Grid item>
                <Chip
                  label="Bus Owner"
                  color="secondary"
                  variant="outlined"
                  onClick={() => fillDemoCredentials('owner')}
                  clickable
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
