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
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  BusAlert as BusIcon,
} from '@mui/icons-material';
import axios from 'axios';
import API_CONFIG from '../config/api';

const Sections = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('normal');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    sectionNumber: '',
    fare: '',
    category: 'normal',
    description: '',
  });

  const categories = [
    { value: 'normal', label: 'Normal', color: 'default' },
    { value: 'semi-luxury', label: 'Semi-Luxury', color: 'primary' },
    { value: 'luxury', label: 'Luxury', color: 'secondary' },
    { value: 'super-luxury', label: 'Super Luxury', color: 'error' },
  ];

  useEffect(() => {
    fetchAllSections();
  }, []);

  const fetchAllSections = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/sections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSections(response.data.sections || []);
      setError('');
    } catch (error) {
      console.error('Fetch sections error:', error);
      setError('Failed to fetch sections');
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const getSectionsByCategory = (category) => {
    return sections.filter(section => section.category === category);
  };

  const handleSubmit = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const url = editingSection 
        ? `${API_CONFIG.BASE_URL}/sections/${editingSection._id}`
        : `${API_CONFIG.BASE_URL}/sections`;
      
      const method = editingSection ? 'put' : 'post';
      
      await axios[method](url, {
        ...formData,
        description: formData.description || `Section ${formData.sectionNumber} - Rs. ${formData.fare} (${formData.category})`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(editingSection ? 'Section updated successfully!' : 'Section added successfully!');
      fetchAllSections();
      handleClose();
    } catch (error) {
      console.error('Submit section error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save section';
      setError(errorMessage);
    }
  };

  const handleDelete = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    
    try {
      setError('');
      const token = localStorage.getItem('token');
      await axios.delete(`${API_CONFIG.BASE_URL}/sections/${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Section deleted successfully!');
      fetchAllSections();
    } catch (error) {
      console.error('Delete section error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete section';
      setError(errorMessage);
    }
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    setFormData({
      sectionNumber: section.sectionNumber,
      fare: section.fare,
      category: section.category,
      description: section.description,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingSection(null);
    setFormData({
      sectionNumber: '',
      fare: '',
      category: selectedCategory,
      description: '',
    });
  };

  const handleAddNew = () => {
    setFormData({
      sectionNumber: '',
      fare: '',
      category: selectedCategory,
      description: '',
    });
    setOpen(true);
  };

  const handleBulkAdd = async (category) => {
    const baseFares = {
      'normal': 1.0,
      'semi-luxury': 1.3,
      'luxury': 1.6,
      'super-luxury': 2.0
    };
    
    const multiplier = baseFares[category];
    
    const bulkSections = [
      { sectionNumber: 1, fare: Math.round(27 * multiplier) },
      { sectionNumber: 2, fare: Math.round(35 * multiplier) },
      { sectionNumber: 3, fare: Math.round(45 * multiplier) },
      { sectionNumber: 4, fare: Math.round(55 * multiplier) },
      { sectionNumber: 5, fare: Math.round(66 * multiplier) },
      { sectionNumber: 6, fare: Math.round(76 * multiplier) },
      { sectionNumber: 7, fare: Math.round(86 * multiplier) },
      { sectionNumber: 8, fare: Math.round(90 * multiplier) },
      { sectionNumber: 9, fare: Math.round(97 * multiplier) },
      { sectionNumber: 10, fare: Math.round(104 * multiplier) },
      { sectionNumber: 11, fare: Math.round(111 * multiplier) },
      { sectionNumber: 12, fare: Math.round(116 * multiplier) },
      { sectionNumber: 13, fare: Math.round(123 * multiplier) },
      { sectionNumber: 14, fare: Math.round(130 * multiplier) },
      { sectionNumber: 15, fare: Math.round(135 * multiplier) },
      { sectionNumber: 16, fare: Math.round(140 * multiplier) },
      { sectionNumber: 17, fare: Math.round(147 * multiplier) },
      { sectionNumber: 18, fare: Math.round(152 * multiplier) },
      { sectionNumber: 19, fare: Math.round(159 * multiplier) },
      { sectionNumber: 20, fare: Math.round(166 * multiplier) },
      { sectionNumber: 21, fare: Math.round(171 * multiplier) },
      { sectionNumber: 22, fare: Math.round(176 * multiplier) },
      { sectionNumber: 23, fare: Math.round(183 * multiplier) },
      { sectionNumber: 24, fare: Math.round(189 * multiplier) },
      { sectionNumber: 25, fare: Math.round(195 * multiplier) },
      { sectionNumber: 26, fare: Math.round(201 * multiplier) },
      { sectionNumber: 27, fare: Math.round(208 * multiplier) },
      { sectionNumber: 28, fare: Math.round(213 * multiplier) },
      { sectionNumber: 29, fare: Math.round(220 * multiplier) },
      { sectionNumber: 30, fare: Math.round(227 * multiplier) },
      { sectionNumber: 31, fare: Math.round(232 * multiplier) }
    ];

    await bulkAddSections(bulkSections, category);
  };

  const bulkAddSections = async (sectionsData, category) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      console.log(`Adding sections for category: ${category}`);
      
      let addedCount = 0;
      let errors = [];
      
      for (const sectionData of sectionsData) {
        try {
          await axios.post(`${API_CONFIG.BASE_URL}/sections`, {
            ...sectionData,
            category,
            description: `Section ${sectionData.sectionNumber} - Rs. ${sectionData.fare} (${category})`
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          addedCount++;
        } catch (error) {
          console.error(`Error adding section ${sectionData.sectionNumber}:`, error);
          errors.push(`Section ${sectionData.sectionNumber}: ${error.response?.data?.message || error.message}`);
        }
      }
      
      fetchAllSections();
      
      if (errors.length === 0) {
        setSuccess(`All ${addedCount} sections added successfully for ${category} category!`);
      } else {
        setSuccess(`${addedCount} sections added successfully for ${category} category.`);
        if (errors.length > 0) {
          setError(`Some sections could not be added: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`);
        }
      }
    } catch (error) {
      console.error('Bulk add sections error:', error);
      setError(`Error adding sections: ${error.message}`);
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
        Section Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage bus sections by category. Each category has its own fare structure.
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
            icon={<BusIcon />}
          />
        ))}
      </Tabs>

      {categories.map((category) => (
        <Box 
          key={category.value} 
          sx={{ display: selectedCategory === category.value ? 'block' : 'none' }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {category.label} Sections
                  <Chip 
                    label={`${getSectionsByCategory(category.value).length} sections`}
                    size="small"
                    sx={{ ml: 2 }}
                    color={category.color}
                  />
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddNew}
                    size="small"
                  >
                    Add Section
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => handleBulkAdd(category.value)}
                    size="small"
                  >
                    Add Standard Fares
                  </Button>
                </Box>
              </Box>
              
              {getSectionsByCategory(category.value).length === 0 ? (
                <Alert severity="info">
                  No sections found for {category.label} category. Add sections to define the fare structure.
                </Alert>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Section Number</TableCell>
                        <TableCell>Fare (Rs.)</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getSectionsByCategory(category.value)
                        .sort((a, b) => a.sectionNumber - b.sectionNumber)
                        .map((section) => (
                        <TableRow key={section._id}>
                          <TableCell>
                            <Chip 
                              label={section.sectionNumber} 
                              color={category.color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>Rs. {section.fare}</TableCell>
                          <TableCell>{section.description}</TableCell>
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
            </CardContent>
          </Card>
        </Box>
      ))}

      {/* Add/Edit Section Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSection ? 'Edit Section' : 'Add New Section'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Section Number"
                type="number"
                value={formData.sectionNumber}
                onChange={(e) => setFormData({ ...formData, sectionNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fare (Rs.)"
                type="number"
                value={formData.fare}
                onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={`Section ${formData.sectionNumber} - Rs. ${formData.fare} (${formData.category})`}
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
            disabled={!formData.sectionNumber || !formData.fare || !formData.category}
          >
            {editingSection ? 'Update' : 'Add'} Section
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sections;
