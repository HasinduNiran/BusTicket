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
  Tabs,
  Tab,
  TablePagination,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AutoAwesome as AutoIcon,
  Route as RouteIcon,
  LocationOn as LocationIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import axios from 'axios';
import API_CONFIG from '../config/api';

const RouteSections = () => {
  const [routeSections, setRouteSections] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('normal');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    routeId: '',
    stopId: '',
    sectionNumber: '',
    fare: '',
    stopCode: '',
    stopName: '',
    order: '',
    category: 'normal'
  });

  const categories = [
    { value: 'normal', label: 'Normal', color: 'default', multiplier: 1.0 },
    { value: 'semi-luxury', label: 'Semi-Luxury', color: 'primary', multiplier: 1.3 },
    { value: 'luxury', label: 'Luxury', color: 'secondary', multiplier: 1.6 },
    { value: 'super-luxury', label: 'Super Luxury', color: 'error', multiplier: 2.0 },
  ];

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (selectedRoute) {
      fetchRouteSections();
      fetchStops();
    }
  }, [selectedRoute, selectedCategory]);

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/route-sections/routes/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoutes(response.data.routes || []);
      if (response.data.routes?.length > 0) {
        setSelectedRoute(response.data.routes[0]._id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Fetch routes error:', error);
      setError('Failed to fetch routes');
      setLoading(false);
    }
  };

  const fetchRouteSections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/route-sections/route/${selectedRoute}/category/${selectedCategory}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRouteSections(response.data.routeSections || []);
    } catch (error) {
      console.error('Fetch route sections error:', error);
      setRouteSections([]);
    }
  };

  const fetchStops = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/route-sections/route/${selectedRoute}/stops`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStops(response.data.stops || []);
    } catch (error) {
      console.error('Fetch stops error:', error);
      setStops([]);
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const url = editingSection 
        ? `${API_CONFIG.BASE_URL}/route-sections/${editingSection._id}`
        : `${API_CONFIG.BASE_URL}/route-sections`;
      
      const method = editingSection ? 'put' : 'post';
      
      await axios[method](url, {
        ...formData,
        routeId: selectedRoute
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(editingSection ? 'Route section updated successfully!' : 'Route section created successfully!');
      fetchRouteSections();
      handleClose();
    } catch (error) {
      console.error('Submit route section error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save route section';
      setError(errorMessage);
    }
  };

  const handleDelete = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this route section?')) return;
    
    try {
      setError('');
      const token = localStorage.getItem('token');
      await axios.delete(`${API_CONFIG.BASE_URL}/route-sections/${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Route section deleted successfully!');
      fetchRouteSections();
    } catch (error) {
      console.error('Delete route section error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete route section';
      setError(errorMessage);
    }
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    setFormData({
      routeId: section.routeId._id,
      stopId: section.stopId._id,
      sectionNumber: section.sectionNumber,
      fare: section.fare,
      stopCode: section.stopCode,
      stopName: section.stopName,
      order: section.order,
      category: section.category
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingSection(null);
    setFormData({
      routeId: selectedRoute,
      stopId: '',
      sectionNumber: '',
      fare: '',
      stopCode: '',
      stopName: '',
      order: '',
      category: selectedCategory
    });
  };

  const handleAddNew = () => {
    setFormData({
      routeId: selectedRoute,
      stopId: '',
      sectionNumber: '',
      fare: '',
      stopCode: '',
      stopName: '',
      order: '',
      category: selectedCategory
    });
    setOpen(true);
  };

  const handleAutoGenerate = async () => {
    if (!window.confirm(`Are you sure you want to auto-generate route sections for ${selectedCategory} category? This will create sections based on existing stops.`)) {
      return;
    }

    try {
      setError('');
      const token = localStorage.getItem('token');
      const category = categories.find(cat => cat.value === selectedCategory);
      
      await axios.post(
        `${API_CONFIG.BASE_URL}/route-sections/auto-generate/${selectedRoute}/${selectedCategory}`,
        { fareMultiplier: category.multiplier },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`Auto-generation completed for ${category.label} category!`);
      fetchRouteSections();
    } catch (error) {
      console.error('Auto-generate error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to auto-generate route sections';
      setError(errorMessage);
    }
  };

  const handleStopChange = (stopId) => {
    const selectedStop = stops.find(stop => stop._id === stopId);
    if (selectedStop) {
      const category = categories.find(cat => cat.value === selectedCategory);
      setFormData({
        ...formData,
        stopId: stopId,
        stopCode: selectedStop.code,
        stopName: selectedStop.stopName,
        order: selectedStop.order,
        sectionNumber: selectedStop.sectionNumber || selectedStop.order,
        fare: Math.round(selectedStop.fare * category.multiplier)
      });
    }
  };

  const getCategoryChipColor = (category) => {
    const categoryConfig = categories.find(cat => cat.value === category);
    return categoryConfig?.color || 'default';
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Route Sections Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage section assignments for bus routes. Configure stop-specific sections and fares for each category.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Route Selection */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Select Route</InputLabel>
            <Select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              label="Select Route"
            >
              {routes.map((route) => (
                <MenuItem key={route._id} value={route._id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RouteIcon fontSize="small" />
                    {route.routeName} ({route.routeNumber})
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNew}
              disabled={!selectedRoute}
            >
              Add Route Section
            </Button>
            <Button
              variant="outlined"
              startIcon={<AutoIcon />}
              onClick={handleAutoGenerate}
              disabled={!selectedRoute}
            >
              Auto Generate
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Category Tabs */}
      <Tabs 
        value={selectedCategory} 
        onChange={(e, newValue) => setSelectedCategory(newValue)}
        sx={{ mb: 3 }}
      >
        {categories.map((category) => (
          <Tab 
            key={category.value} 
            label={category.label} 
            value={category.value}
            icon={<SpeedIcon />}
          />
        ))}
      </Tabs>

      {/* Route Sections Table */}
      {selectedRoute && (
        <Paper>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {categories.find(cat => cat.value === selectedCategory)?.label} Sections for{' '}
              {routes.find(r => r._id === selectedRoute)?.routeName}
            </Typography>
            
            {routeSections.length === 0 ? (
              <Alert severity="info">
                No route sections found for this route and category. Add sections to define the stop-specific fare structure.
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Stop Name</TableCell>
                      <TableCell>Section No.</TableCell>
                      <TableCell>Fare (Rs.)</TableCell>
                      <TableCell>Order</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {routeSections
                      .sort((a, b) => a.order - b.order)
                      .map((section) => (
                      <TableRow key={section._id}>
                        <TableCell>
                          <Chip 
                            label={section.stopCode} 
                            color="primary" 
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationIcon fontSize="small" color="action" />
                            {section.stopName}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={section.sectionNumber} 
                            color="secondary" 
                            size="small"
                          />
                        </TableCell>
                        <TableCell>Rs. {section.fare}</TableCell>
                        <TableCell>{section.order}</TableCell>
                        <TableCell>
                          <Chip
                            label={categories.find(cat => cat.value === section.category)?.label}
                            color={getCategoryChipColor(section.category)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            onClick={() => handleEdit(section)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleDelete(section._id)}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Paper>
      )}

      {/* Add/Edit Route Section Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSection ? 'Edit Route Section' : 'Add New Route Section'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Stop</InputLabel>
                <Select
                  value={formData.stopId}
                  onChange={(e) => handleStopChange(e.target.value)}
                  label="Stop"
                >
                  {stops.map((stop) => (
                    <MenuItem key={stop._id} value={stop._id}>
                      {stop.code} - {stop.stopName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                fullWidth
                label="Stop Code"
                value={formData.stopCode}
                onChange={(e) => setFormData({ ...formData, stopCode: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stop Name"
                value={formData.stopName}
                onChange={(e) => setFormData({ ...formData, stopName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Section Number"
                type="number"
                value={formData.sectionNumber}
                onChange={(e) => setFormData({ ...formData, sectionNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Fare (Rs.)"
                type="number"
                value={formData.fare}
                onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Order"
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={!formData.stopId || !formData.sectionNumber || !formData.fare || !formData.stopCode || !formData.stopName}
          >
            {editingSection ? 'Update' : 'Create'} Route Section
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RouteSections;
