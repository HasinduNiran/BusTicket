import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import moment from 'moment';

const DashboardScreen = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await apiService.getMyTickets();
      setSummary(response.summary);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load dashboard data',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Good {moment().hour() < 12 ? 'Morning' : moment().hour() < 18 ? 'Afternoon' : 'Evening'}!
          </Text>
          <Text style={styles.userName}>{user?.username}</Text>
        </View>
        <Icon name="account-circle" size={48} color="#2196F3" />
      </View>

      {/* Quick Stats */}
      {summary && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Today's Summary</Text>
          <Text style={styles.statsDate}>{moment(summary.date).format('MMMM D, YYYY')}</Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.revenueCard]}>
              <Icon name="attach-money" size={32} color="#4caf50" />
              <Text style={styles.statValue}>{formatCurrency(summary.totalRevenue)}</Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>
            
            <View style={[styles.statCard, styles.ticketCard]}>
              <Icon name="confirmation-number" size={32} color="#2196F3" />
              <Text style={styles.statValue}>{summary.totalTickets}</Text>
              <Text style={styles.statLabel}>Tickets Issued</Text>
            </View>
          </View>

          {summary.totalTickets > 0 && (
            <View style={styles.avgFareCard}>
              <Icon name="trending-up" size={24} color="#ff9800" />
              <Text style={styles.avgFareText}>
                Average Fare: {formatCurrency(summary.totalRevenue / summary.totalTickets)}
              </Text>
            </View>
          )}

          {/* Ticket Status Breakdown */}
          {summary.ticketsByStatus && Object.keys(summary.ticketsByStatus).length > 0 && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusTitle}>Ticket Status</Text>
              {Object.entries(summary.ticketsByStatus).map(([status, count]) => (
                <View key={status} style={styles.statusRow}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(status) }
                  ]} />
                  <Text style={styles.statusText}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}: {count}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.actionsTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionCard}>
          <Icon name="confirmation-number" size={32} color="#2196F3" />
          <Text style={styles.actionText}>Generate Ticket</Text>
          <Text style={styles.actionSubtext}>Issue new bus ticket</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <Icon name="history" size={32} color="#ff9800" />
          <Text style={styles.actionText}>View History</Text>
          <Text style={styles.actionSubtext}>See today's tickets</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionCard}>
          <Icon name="assessment" size={32} color="#9c27b0" />
          <Text style={styles.actionText}>Daily Report</Text>
          <Text style={styles.actionSubtext}>Sales summary</Text>
        </TouchableOpacity>
      </View>

      {/* Route Information */}
      {user?.conductorDetails?.routeId && (
        <View style={styles.routeContainer}>
          <Text style={styles.routeTitle}>Assigned Route</Text>
          <View style={styles.routeCard}>
            <Icon name="directions-bus" size={32} color="#4caf50" />
            <View style={styles.routeInfo}>
              <Text style={styles.routeName}>Route Information</Text>
              <Text style={styles.routeDetails}>
                Bus: {user.conductorDetails.busNumber}
              </Text>
              <Text style={styles.routeDetails}>
                Employee ID: {user.conductorDetails.employeeId}
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return '#4caf50';
    case 'used': return '#2196F3';
    case 'cancelled': return '#f44336';
    default: return '#9e9e9e';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    elevation: 2,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  statsContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statsDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 2,
  },
  revenueCard: {
    borderColor: '#4caf50',
  },
  ticketCard: {
    borderColor: '#2196F3',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  avgFareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  avgFareText: {
    fontSize: 14,
    color: '#f57c00',
    fontWeight: '600',
    marginLeft: 8,
  },
  statusContainer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
  },
  actionsContainer: {
    margin: 20,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 1,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
  actionSubtext: {
    fontSize: 12,
    color: '#666',
    marginLeft: 15,
    flex: 1,
  },
  routeContainer: {
    margin: 20,
    marginTop: 0,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  routeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    elevation: 1,
  },
  routeInfo: {
    marginLeft: 15,
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  routeDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default DashboardScreen;
