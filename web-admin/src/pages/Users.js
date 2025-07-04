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
  Switch,
  FormControlLabel,
  Collapse,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import axios from 'axios';
import API_CONFIG from '../config/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState(null);
  const [showRoleDetails, setShowRoleDetails] = useState({});
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'conductor',
    busOwnerDetails: {
      companyName: '',
      licenseNumber: '',
      contactNumber: '',
      address: ''
    },
    conductorDetails: {
      employeeId: '',
      busNumber: '',
      routeId: ''
    }
  });

  const roles = [
    { value: 'admin', label: 'Admin', color: 'error' },
    { value: 'bus_owner', label: 'Bus Owner', color: 'primary' },
    { value: 'conductor', label: 'Conductor', color: 'secondary' }
  ];

  useEffect(() => {
    fetchUsers();
    fetchRoutes();
    fetchStats();
  }, [page, rowsPerPage, roleFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        role: roleFilter,
        search: searchTerm
      });

      const response = await axios.get(`${API_CONFIG.BASE_URL}/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(response.data.users || []);
      setTotalUsers(response.data.pagination?.totalUsers || 0);
      setError('');
    } catch (error) {
      console.error('Fetch users error:', error);
      setError('Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/users/routes/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoutes(response.data.routes || []);
    } catch (error) {
      console.error('Fetch routes error:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/users/stats/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const url = editingUser 
        ? `${API_CONFIG.BASE_URL}/users/${editingUser._id}`
        : `${API_CONFIG.BASE_URL}/users`;
      
      const method = editingUser ? 'put' : 'post';
      
      // Clean up form data based on role
      const submitData = {
        username: formData.username,
        email: formData.email,
        role: formData.role
      };

      // Only include password for new users or if explicitly changing
      if (!editingUser || formData.password) {
        submitData.password = formData.password;
      }

      // Add role-specific details
      if (formData.role === 'bus_owner') {
        submitData.busOwnerDetails = formData.busOwnerDetails;
      } else if (formData.role === 'conductor') {
        submitData.conductorDetails = formData.conductorDetails;
      }

      await axios[method](url, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(editingUser ? 'User updated successfully!' : 'User created successfully!');
      fetchUsers();
      fetchStats();
      handleClose();
    } catch (error) {
      console.error('Submit user error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save user';
      setError(errorMessage);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      setError('');
      const token = localStorage.getItem('token');
      await axios.delete(`${API_CONFIG.BASE_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('User deleted successfully!');
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Delete user error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      setError(errorMessage);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      await axios.patch(`${API_CONFIG.BASE_URL}/users/${userId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(`User ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Toggle status error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update user status';
      setError(errorMessage);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      busOwnerDetails: user.busOwnerDetails || {
        companyName: '',
        licenseNumber: '',
        contactNumber: '',
        address: ''
      },
      conductorDetails: user.conductorDetails || {
        employeeId: '',
        busNumber: '',
        routeId: user.conductorDetails?.routeId?._id || ''
      }
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'conductor',
      busOwnerDetails: {
        companyName: '',
        licenseNumber: '',
        contactNumber: '',
        address: ''
      },
      conductorDetails: {
        employeeId: '',
        busNumber: '',
        routeId: ''
      }
    });
    setShowPassword(false);
  };

  const handleAddNew = () => {
    setOpen(true);
  };

  const getRoleChipColor = (role) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig?.color || 'default';
  };

  const getRoleLabel = (role) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig?.label || role;
  };

  const toggleRoleDetails = (userId) => {
    setShowRoleDetails(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  if (loading && users.length === 0) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage system users including admins, bus owners, and conductors.
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

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4">{stats.totalUsers}</Typography>
                <Typography color="text.secondary">Total Active Users</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error">{stats.roleBreakdown.admin}</Typography>
                <Typography color="text.secondary">Admins</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">{stats.roleBreakdown.bus_owner}</Typography>
                <Typography color="text.secondary">Bus Owners</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">{stats.roleBreakdown.conductor}</Typography>
                <Typography color="text.secondary">Conductors</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters and Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Filter by Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              label="Filter by Role"
            >
              <MenuItem value="all">All Roles</MenuItem>
              {roles.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleAddNew}
            >
              Add User
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User Info</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Role Details</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <React.Fragment key={user._id}>
                  <TableRow>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{user.username}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Created: {new Date(user.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role)}
                        color={getRoleChipColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={user.isActive}
                            onChange={() => handleToggleStatus(user._id, user.isActive)}
                            size="small"
                          />
                        }
                        label={user.isActive ? 'Active' : 'Inactive'}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleRoleDetails(user._id)}
                      >
                        {showRoleDetails[user._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        onClick={() => handleEdit(user)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDelete(user._id)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} sx={{ p: 0 }}>
                      <Collapse in={showRoleDetails[user._id]}>
                        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                          {user.role === 'bus_owner' && user.busOwnerDetails && (
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Company:</Typography>
                                <Typography variant="body2">{user.busOwnerDetails.companyName || 'N/A'}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">License:</Typography>
                                <Typography variant="body2">{user.busOwnerDetails.licenseNumber || 'N/A'}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Contact:</Typography>
                                <Typography variant="body2">{user.busOwnerDetails.contactNumber || 'N/A'}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Address:</Typography>
                                <Typography variant="body2">{user.busOwnerDetails.address || 'N/A'}</Typography>
                              </Grid>
                            </Grid>
                          )}
                          {user.role === 'conductor' && user.conductorDetails && (
                            <Grid container spacing={2}>
                              <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">Employee ID:</Typography>
                                <Typography variant="body2">{user.conductorDetails.employeeId || 'N/A'}</Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">Bus Number:</Typography>
                                <Typography variant="body2">{user.conductorDetails.busNumber || 'N/A'}</Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">Route:</Typography>
                                <Typography variant="body2">
                                  {user.conductorDetails.routeId?.routeName || 'Not assigned'}
                                </Typography>
                              </Grid>
                            </Grid>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Add/Edit User Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={editingUser ? "New Password (leave blank to keep current)" : "Password"}
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  label="Role"
                >
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Bus Owner Details */}
            {formData.role === 'bus_owner' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2 }}>Bus Owner Details</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    value={formData.busOwnerDetails.companyName}
                    onChange={(e) => setFormData({
                      ...formData,
                      busOwnerDetails: {
                        ...formData.busOwnerDetails,
                        companyName: e.target.value
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="License Number"
                    value={formData.busOwnerDetails.licenseNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      busOwnerDetails: {
                        ...formData.busOwnerDetails,
                        licenseNumber: e.target.value
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    value={formData.busOwnerDetails.contactNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      busOwnerDetails: {
                        ...formData.busOwnerDetails,
                        contactNumber: e.target.value
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={formData.busOwnerDetails.address}
                    onChange={(e) => setFormData({
                      ...formData,
                      busOwnerDetails: {
                        ...formData.busOwnerDetails,
                        address: e.target.value
                      }
                    })}
                  />
                </Grid>
              </>
            )}

            {/* Conductor Details */}
            {formData.role === 'conductor' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2 }}>Conductor Details</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Employee ID"
                    value={formData.conductorDetails.employeeId}
                    onChange={(e) => setFormData({
                      ...formData,
                      conductorDetails: {
                        ...formData.conductorDetails,
                        employeeId: e.target.value
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Bus Number"
                    value={formData.conductorDetails.busNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      conductorDetails: {
                        ...formData.conductorDetails,
                        busNumber: e.target.value
                      }
                    })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Assigned Route</InputLabel>
                    <Select
                      value={formData.conductorDetails.routeId}
                      onChange={(e) => setFormData({
                        ...formData,
                        conductorDetails: {
                          ...formData.conductorDetails,
                          routeId: e.target.value
                        }
                      })}
                      label="Assigned Route"
                    >
                      <MenuItem value="">No Route Assigned</MenuItem>
                      {routes.map((route) => (
                        <MenuItem key={route._id} value={route._id}>
                          {route.routeName} ({route.routeNumber})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
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
            disabled={!formData.username || !formData.email || (!editingUser && !formData.password)}
          >
            {editingUser ? 'Update' : 'Create'} User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
