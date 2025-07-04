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
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Route as RouteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const Routes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState({
    routeName: '',
    routeNumber: '',
    startPoint: 'Embilipitiya',
    endPoint: '',
    distance: '',
    estimatedDuration: '',
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('/routes');
      setRoutes(response.data.routes || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoute) {
        await axios.put(`/routes/${editingRoute._id}`, formData);
        toast.success('Route updated successfully');
      } else {
        await axios.post('/routes', formData);
        toast.success('Route created successfully');
      }
      handleClose();
      fetchRoutes();
    } catch (error) {
      console.error('Error saving route:', error);
      toast.error(error.response?.data?.message || 'Failed to save route');
    }
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      routeName: route.routeName,
      routeNumber: route.routeNumber,
      startPoint: route.startPoint,
      endPoint: route.endPoint,
      distance: route.distance.toString(),
      estimatedDuration: route.estimatedDuration.toString(),
    });
    setOpen(true);
  };

  const handleDelete = async (routeId) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        await axios.delete(`/routes/${routeId}`);
        toast.success('Route deleted successfully');
        fetchRoutes();
      } catch (error) {
        console.error('Error deleting route:', error);
        toast.error('Failed to delete route');
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingRoute(null);
    setFormData({
      routeName: '',
      routeNumber: '',
      startPoint: 'Embilipitiya',
      endPoint: '',
      distance: '',
      estimatedDuration: '',
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return <Typography>Loading routes...</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Bus Routes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Add Route
        </Button>
      </Box>

      <Grid container spacing={3}>
        {routes.map((route) => (
          <Grid item xs={12} md={6} lg={4} key={route._id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <RouteIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {route.routeName}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Route #{route.routeNumber}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {route.startPoint} → {route.endPoint}
                </Typography>
                <Box display="flex" gap={1} mb={1}>
                  <Chip
                    label={`${route.distance} km`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={`${route.estimatedDuration} min`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                </Box>
                <Chip
                  label={route.isActive ? 'Active' : 'Inactive'}
                  size="small"
                  color={route.isActive ? 'success' : 'error'}
                />
              </CardContent>
              <CardActions>
                <IconButton
                  color="primary"
                  onClick={() => handleEdit(route)}
                  size="small"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => handleDelete(route._id)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {routes.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <RouteIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No routes found
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Get started by adding your first bus route
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Add Route
          </Button>
        </Paper>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingRoute ? 'Edit Route' : 'Add New Route'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="routeName"
                  label="Route Name"
                  value={formData.routeName}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="routeNumber"
                  label="Route Number"
                  value={formData.routeNumber}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="startPoint"
                  label="Start Point"
                  value={formData.startPoint}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="endPoint"
                  label="End Point"
                  value={formData.endPoint}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="distance"
                  label="Distance (km)"
                  type="number"
                  value={formData.distance}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="estimatedDuration"
                  label="Estimated Duration (minutes)"
                  type="number"
                  value={formData.estimatedDuration}
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
              {editingRoute ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Routes;
