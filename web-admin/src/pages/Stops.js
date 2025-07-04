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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const Stops = () => {
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingStop, setEditingStop] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    stopName: '',
    sectionNumber: '',
    fare: '',
    routeId: '',
    order: '',
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (selectedRoute) {
      fetchStops();
    }
  }, [selectedRoute]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('/routes');
      const routeList = response.data.routes || [];
      setRoutes(routeList);
      if (routeList.length > 0) {
        setSelectedRoute(routeList[0]._id);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStops = async () => {
    if (!selectedRoute) return;
    try {
      const response = await axios.get(`/stops/route/${selectedRoute}`);
      setStops(response.data.stops || []);
    } catch (error) {
      console.error('Error fetching stops:', error);
      toast.error('Failed to load stops');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const stopData = {
        ...formData,
        sectionNumber: parseInt(formData.sectionNumber),
        fare: parseFloat(formData.fare),
        order: parseInt(formData.order),
        routeId: selectedRoute,
      };

      if (editingStop) {
        await axios.put(`/stops/${editingStop._id}`, stopData);
        toast.success('Stop updated successfully');
      } else {
        await axios.post('/stops', stopData);
        toast.success('Stop created successfully');
      }
      handleClose();
      fetchStops();
    } catch (error) {
      console.error('Error saving stop:', error);
      toast.error(error.response?.data?.message || 'Failed to save stop');
    }
  };

  const handleEdit = (stop) => {
    setEditingStop(stop);
    setFormData({
      code: stop.code,
      stopName: stop.stopName,
      sectionNumber: stop.sectionNumber.toString(),
      fare: stop.fare.toString(),
      routeId: stop.routeId,
      order: stop.order.toString(),
    });
    setOpen(true);
  };

  const handleDelete = async (stopId) => {
    if (window.confirm('Are you sure you want to delete this stop?')) {
      try {
        await axios.delete(`/stops/${stopId}`);
        toast.success('Stop deleted successfully');
        fetchStops();
      } catch (error) {
        console.error('Error deleting stop:', error);
        toast.error('Failed to delete stop');
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingStop(null);
    setFormData({
      code: '',
      stopName: '',
      sectionNumber: '',
      fare: '',
      routeId: '',
      order: '',
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const selectedRouteData = routes.find(r => r._id === selectedRoute);

  if (loading) {
    return <Typography>Loading stops...</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Bus Stops
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          disabled={!selectedRoute}
        >
          Add Stop
        </Button>
      </Box>

      {routes.length > 0 && (
        <FormControl sx={{ mb: 3, minWidth: 300 }}>
          <InputLabel>Select Route</InputLabel>
          <Select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            label="Select Route"
          >
            {routes.map((route) => (
              <MenuItem key={route._id} value={route._id}>
                {route.routeName} (#{route.routeNumber})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {selectedRouteData && (
        <Paper sx={{ mb: 2, p: 2 }}>
          <Typography variant="h6">
            {selectedRouteData.routeName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedRouteData.startPoint} → {selectedRouteData.endPoint}
          </Typography>
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Stop Name</TableCell>
              <TableCell>Section No.</TableCell>
              <TableCell>Fare (Rs.)</TableCell>
              <TableCell>Order</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stops.map((stop) => (
              <TableRow key={stop._id}>
                <TableCell>{stop.code}</TableCell>
                <TableCell>{stop.stopName}</TableCell>
                <TableCell>{stop.sectionNumber}</TableCell>
                <TableCell>{stop.fare.toFixed(2)}</TableCell>
                <TableCell>{stop.order}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEdit(stop)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(stop._id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {stops.length === 0 && selectedRoute && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
          <Typography variant="h6" color="text.secondary">
            No stops found for this route
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Add stops to define the route sections and fares
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Add Stop
          </Button>
        </Paper>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStop ? 'Edit Stop' : 'Add New Stop'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="code"
                  label="Stop Code"
                  value={formData.code}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="stopName"
                  label="Stop Name"
                  value={formData.stopName}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="sectionNumber"
                  label="Section Number"
                  type="number"
                  value={formData.sectionNumber}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="fare"
                  label="Fare (Rs.)"
                  type="number"
                  step="0.01"
                  value={formData.fare}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="order"
                  label="Order"
                  type="number"
                  value={formData.order}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingStop ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Stops;
