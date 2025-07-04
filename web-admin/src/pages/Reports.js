import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Reports = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>
      
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Reports Coming Soon
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This section will include detailed reports on:
        </Typography>
        <Box sx={{ mt: 2, textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
          <Typography variant="body2" color="text.secondary">
            • Daily/Monthly revenue reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Route performance analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Conductor performance tracking
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Passenger traffic analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Peak hours identification
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Reports;
