import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { routesAPI } from '../services/api';

const RouteAssignmentScreen = ({ user, onRouteSelect, onLogout }) => {
  const [assignedRoutes, setAssignedRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAssignedRoutes();
  }, []);

  const loadAssignedRoutes = async () => {
    try {
      setLoading(true);
      
      // For now, let's use mock data since the backend route might not be ready
      // Replace this with actual API call: routesAPI.getConductorRoutes(user._id)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockRoutes = [
        {
          _id: '1',
          routeNumber: 'R001',
          routeName: 'City Center - Airport',
          category: 'Normal',
          startStop: 'City Center Terminal',
          endStop: 'Airport Terminal',
          distance: '25 km',
          estimatedTime: '45 min',
          isActive: true,
          assignedDate: '2024-01-15',
          description: 'Main route connecting city center to airport with multiple stops'
        },
        {
          _id: '2',
          routeNumber: 'R002',
          routeName: 'University - Shopping Mall',
          category: 'Semi-luxury',
          startStop: 'University Gate',
          endStop: 'Central Mall',
          distance: '15 km',
          estimatedTime: '30 min',
          isActive: true,
          assignedDate: '2024-01-10',
          description: 'Popular route for students and shoppers'
        },
        {
          _id: '3',
          routeNumber: 'R005',
          routeName: 'Business District Loop',
          category: 'Luxury',
          startStop: 'Business Plaza',
          endStop: 'Corporate Tower',
          distance: '12 km',
          estimatedTime: '25 min',
          isActive: true,
          assignedDate: '2024-01-20',
          description: 'Premium service for business district commuters'
        }
      ];
      
      setAssignedRoutes(mockRoutes);
    } catch (error) {
      console.error('Load routes error:', error);
      Alert.alert('Error', 'Failed to load assigned routes. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAssignedRoutes();
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Normal': return '#4CAF50';
      case 'Semi-luxury': return '#FF9800';
      case 'Luxury': return '#9C27B0';
      case 'Super luxury': return '#F44336';
      default: return '#2196F3';
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: onLogout, style: 'destructive' },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading your assigned routes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Assigned Routes</Text>
          <Text style={styles.subtitle}>Welcome, {user?.name || user?.username}</Text>
          <Text style={styles.conductorId}>ID: {user?.conductorDetails?.employeeId || user?._id}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {assignedRoutes.length === 0 ? (
          <View style={styles.noRoutesContainer}>
            <Text style={styles.noRoutesTitle}>No Routes Assigned</Text>
            <Text style={styles.noRoutesText}>
              You don't have any routes assigned yet. Please contact your supervisor for route assignment.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{assignedRoutes.length}</Text>
                <Text style={styles.statLabel}>Assigned Routes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{assignedRoutes.filter(r => r.isActive).length}</Text>
                <Text style={styles.statLabel}>Active Routes</Text>
              </View>
            </View>

            {assignedRoutes.map((route) => (
              <TouchableOpacity
                key={route._id}
                style={styles.routeCard}
                onPress={() => onRouteSelect(route)}
              >
                <View style={styles.routeHeader}>
                  <View style={styles.routeNumberContainer}>
                    <Text style={styles.routeNumber}>{route.routeNumber}</Text>
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(route.category) }]}>
                      <Text style={styles.categoryText}>{route.category}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusIndicator, { backgroundColor: route.isActive ? '#4CAF50' : '#F44336' }]} />
                </View>
                
                <Text style={styles.routeName}>{route.routeName}</Text>
                <Text style={styles.routeDescription}>{route.description}</Text>
                
                <View style={styles.routeDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>From:</Text>
                    <Text style={styles.detailValue}>{route.startStop}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>To:</Text>
                    <Text style={styles.detailValue}>{route.endStop}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Distance:</Text>
                    <Text style={styles.detailValue}>{route.distance}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duration:</Text>
                    <Text style={styles.detailValue}>{route.estimatedTime}</Text>
                  </View>
                </View>

                <View style={styles.routeFooter}>
                  <Text style={styles.assignedDate}>Assigned: {route.assignedDate}</Text>
                  <Text style={styles.selectRouteText}>Tap to select route →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
  conductorId: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  noRoutesContainer: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 50,
  },
  noRoutesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  noRoutesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  routeCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  routeNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginRight: 10,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  routeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  routeDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  routeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  assignedDate: {
    fontSize: 12,
    color: '#999',
  },
  selectRouteText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default RouteAssignmentScreen;
