import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Users = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          User Management Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This section will allow administrators to:
        </Typography>
        <Box sx={{ mt: 2, textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
          <Typography variant="body2" color="text.secondary">
            • Manage conductor accounts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Add/remove bus owners
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Assign routes to conductors
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Monitor user activity
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Control user permissions
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Users;
