import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import {
  Route as RouteIcon,
  LocationOn,
  ConfirmationNumber,
  TrendingUp,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRoutes: 0,
    totalStops: 0,
    totalTickets: 0,
    totalRevenue: 0,
  });
  const [ticketData, setTicketData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch basic stats
      const [routesRes, ticketsRes] = await Promise.all([
        axios.get('/routes'),
        axios.get('/tickets/my-tickets'), // This will be updated for admin view
      ]);

      const routes = routesRes.data.routes || [];
      const tickets = ticketsRes.data.tickets || [];

      // Calculate stats
      const totalRevenue = tickets.reduce((sum, ticket) => sum + ticket.fare, 0);
      
      setStats({
        totalRoutes: routes.length,
        totalStops: routes.reduce((sum, route) => sum + (route.stops?.length || 0), 0),
        totalTickets: tickets.length,
        totalRevenue: totalRevenue,
      });

      // Generate chart data (mock data for now)
      const chartData = [
        { name: 'Mon', tickets: 45, revenue: 2400 },
        { name: 'Tue', tickets: 52, revenue: 2800 },
        { name: 'Wed', tickets: 38, revenue: 2100 },
        { name: 'Thu', tickets: 61, revenue: 3200 },
        { name: 'Fri', tickets: 55, revenue: 2900 },
        { name: 'Sat', tickets: 67, revenue: 3500 },
        { name: 'Sun', tickets: 43, revenue: 2300 },
      ];
      setTicketData(chartData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card sx={{ minHeight: 120 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <Typography>Loading dashboard...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Routes"
            value={stats.totalRoutes}
            icon={<RouteIcon sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Stops"
            value={stats.totalStops}
            icon={<LocationOn sx={{ fontSize: 40 }} />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Tickets"
            value={stats.totalTickets}
            icon={<ConfirmationNumber sx={{ fontSize: 40 }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`Rs. ${stats.totalRevenue.toFixed(2)}`}
            icon={<TrendingUp sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Weekly Ticket Sales
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ticketData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="tickets" stroke="#2196F3" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Weekly Revenue
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ticketData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#4caf50" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Overview
            </Typography>
            <Typography variant="body1">
              Welcome to the Bus Ticket Management System! Use the navigation menu to manage routes, stops, tickets, and view detailed reports.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
