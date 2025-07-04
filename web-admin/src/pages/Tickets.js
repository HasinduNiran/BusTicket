import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Print as PrintIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import moment from 'moment';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    routeId: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchRoutes();
    fetchTickets();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTickets();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('/routes');
      setRoutes(response.data.routes || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.routeId) params.append('routeId', filters.routeId);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`/tickets/all?${params.toString()}`);
      setTickets(response.data.tickets?.docs || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTicket = async (ticketId) => {
    if (window.confirm('Are you sure you want to cancel this ticket?')) {
      try {
        await axios.patch(`/tickets/${ticketId}/cancel`);
        toast.success('Ticket cancelled successfully');
        fetchTickets();
      } catch (error) {
        console.error('Error cancelling ticket:', error);
        toast.error('Failed to cancel ticket');
      }
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'used':
        return 'info';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <Typography>Loading tickets...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ticket Management
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Route</InputLabel>
              <Select
                value={filters.routeId}
                onChange={(e) => handleFilterChange('routeId', e.target.value)}
                label="Route"
              >
                <MenuItem value="">All Routes</MenuItem>
                {routes.map((route) => (
                  <MenuItem key={route._id} value={route._id}>
                    {route.routeName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="used">Used</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tickets Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ticket Number</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Fare</TableCell>
              <TableCell>Passengers</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Conductor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket._id}>
                <TableCell>{ticket.ticketNumber}</TableCell>
                <TableCell>{ticket.routeId?.routeName || 'N/A'}</TableCell>
                <TableCell>{ticket.fromStop.stopName}</TableCell>
                <TableCell>{ticket.toStop.stopName}</TableCell>
                <TableCell>Rs. {ticket.fare.toFixed(2)}</TableCell>
                <TableCell>{ticket.passengerCount}</TableCell>
                <TableCell>
                  {moment(ticket.issueDate).format('YYYY-MM-DD HH:mm')}
                </TableCell>
                <TableCell>{ticket.conductorId?.username || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={ticket.status}
                    color={getStatusColor(ticket.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton color="primary" size="small">
                    <ViewIcon />
                  </IconButton>
                  <IconButton color="secondary" size="small">
                    <PrintIcon />
                  </IconButton>
                  {ticket.status === 'active' && (
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleCancelTicket(ticket._id)}
                    >
                      <CancelIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {tickets.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography variant="h6" color="text.secondary">
            No tickets found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tickets will appear here once conductors start generating them
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Tickets;
