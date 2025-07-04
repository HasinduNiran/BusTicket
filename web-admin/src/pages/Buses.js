import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DirectionsBus as BusIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import API_CONFIG from '../config/api';

const Buses = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    busNumber: '',
    routeId: '',
    category: 'normal',
    capacity: '50',
    driverName: '',
    conductorId: '',
    notes: '',
  });

  const categories = [
    { value: 'normal', label: 'Normal', color: 'default' },
    { value: 'semi-luxury', label: 'Semi-Luxury', color: 'primary' },
    { value: 'luxury', label: 'Luxury', color: 'secondary' },
    { value: 'super-luxury', label: 'Super Luxury', color: 'error' },
  ];

  useEffect(() => {
    fetchBuses();
    fetchRoutes();
  }, []);

  const fetchBuses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/buses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBuses(response.data.buses);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching buses:', error);
      toast.error('Failed to fetch buses');
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/routes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoutes(response.data.routes || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to fetch routes');
    }
  };

  const fetchAvailableConductors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/buses/conductors/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConductors(response.data.conductors || []);
    } catch (error) {
      console.error('Error fetching conductors:', error);
      toast.error('Failed to fetch conductors');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const busData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        conductorId: formData.conductorId || null,
      };

      if (editingBus) {
        const token = localStorage.getItem('token');
        await axios.put(`${API_CONFIG.BASE_URL}/buses/${editingBus._id}`, busData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Bus updated successfully');
      } else {
        const token = localStorage.getItem('token');
        await axios.post(`${API_CONFIG.BASE_URL}/buses`, busData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Bus created successfully');
      }
      handleClose();
      fetchBuses();
    } catch (error) {
      console.error('Error saving bus:', error);
      toast.error(error.response?.data?.message || 'Failed to save bus');
    }
  };

  const handleEdit = (bus) => {
    setEditingBus(bus);
    setFormData({
      busNumber: bus.busNumber,
      routeId: bus.routeId._id,
      category: bus.category,
      capacity: bus.capacity.toString(),
      driverName: bus.driverName || '',
      conductorId: bus.conductorId?._id || '',
      notes: bus.notes || '',
    });
    fetchAvailableConductors();
    setOpen(true);
  };

  const handleDelete = async (busId) => {
    if (window.confirm('Are you sure you want to delete this bus?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_CONFIG.BASE_URL}/buses/${busId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Bus deleted successfully');
        fetchBuses();
      } catch (error) {
        console.error('Error deleting bus:', error);
        toast.error('Failed to delete bus');
      }
    }
  };

  const handleAdd = () => {
    setEditingBus(null);
    setFormData({
      busNumber: '',
      routeId: '',
      category: 'normal',
      capacity: '50',
      driverName: '',
      conductorId: '',
      notes: '',
    });
    fetchAvailableConductors();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingBus(null);
    setFormData({
      busNumber: '',
      routeId: '',
      category: 'normal',
      capacity: '50',
      driverName: '',
      conductorId: '',
      notes: '',
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getCategoryColor = (category) => {
    const categoryInfo = categories.find(c => c.value === category);
    return categoryInfo?.color || 'default';
  };

  const getCategoryLabel = (category) => {
    const categoryInfo = categories.find(c => c.value === category);
    return categoryInfo?.label || category;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading buses...</Typography>
      </Box>
    );
  }

  const paginatedBuses = buses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box p={3}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h4" gutterBottom>
                Bus Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage buses assigned to routes with different service categories
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
            >
              Add Bus
            </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {buses.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Buses
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {buses.filter(b => b.isActive).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Buses
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    {buses.filter(b => b.conductorId).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assigned Conductors
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {routes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available Routes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Bus Number</TableCell>
              <TableCell>Route</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Conductor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedBuses.map((bus) => (
              <TableRow key={bus._id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <BusIcon sx={{ mr: 1, color: 'primary.main' }} />
                    {bus.busNumber}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {bus.routeId.routeName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {bus.routeId.routeNumber}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={getCategoryLabel(bus.category)} 
                    color={getCategoryColor(bus.category)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{bus.capacity}</TableCell>
                <TableCell>{bus.driverName || '-'}</TableCell>
                <TableCell>
                  {bus.conductorId ? (
                    <Box>
                      <Typography variant="body2">
                        {bus.conductorId.profile?.fullName || bus.conductorId.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {bus.conductorId.email}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Unassigned
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={bus.isActive ? 'Active' : 'Inactive'} 
                    color={bus.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEdit(bus)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(bus._id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={buses.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingBus ? 'Edit Bus' : 'Add New Bus'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="busNumber"
                  label="Bus Number"
                  value={formData.busNumber}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Route</InputLabel>
                  <Select
                    name="routeId"
                    value={formData.routeId}
                    onChange={handleInputChange}
                    label="Route"
                  >
                    {routes.map((route) => (
                      <MenuItem key={route._id} value={route._id}>
                        {route.routeName} ({route.routeNumber})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    label="Category"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.value} value={category.value}>
                        {category.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="capacity"
                  label="Capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="driverName"
                  label="Driver Name"
                  value={formData.driverName}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Conductor</InputLabel>
                  <Select
                    name="conductorId"
                    value={formData.conductorId}
                    onChange={handleInputChange}
                    label="Conductor"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {conductors.map((conductor) => (
                      <MenuItem key={conductor._id} value={conductor._id}>
                        {conductor.profile?.fullName || conductor.username} ({conductor.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingBus ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Buses;
