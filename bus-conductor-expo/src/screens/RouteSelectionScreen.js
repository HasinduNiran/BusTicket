import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { routesAPI } from '../services/api';

const RouteSelectionScreen = ({ onRouteSelected, onBack }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      console.log('=== Loading Conductor Routes ===');
      
      // Try to load real data from API
      try {
        console.log('Calling getConductorRoutes API...');
        const response = await routesAPI.getConductorRoutes();
        console.log('Full API response:', response);
        console.log('Response data:', response.data);
        
        if (response.data && response.data.success) {
          if (response.data.routes && response.data.routes.length > 0) {
            console.log('Successfully loaded conductor routes:', response.data.routes);
            setRoutes(response.data.routes);
            Alert.alert(
              'Routes Loaded', 
              `Found ${response.data.routes.length} assigned route(s) for conductor`,
              [{ text: 'OK' }]
            );
            return;
          } else {
            // No routes assigned to conductor
            console.log('No routes assigned to conductor');
            Alert.alert(
              'No Routes Assigned', 
              'No routes have been assigned to your conductor account. Please contact your administrator.',
              [{ text: 'OK' }]
            );
            setRoutes([]);
            return;
          }
        } else {
          console.log('Invalid API response structure:', response.data);
          throw new Error('Invalid API response structure');
        }
      } catch (apiError) {
        console.log('=== API Error Details ===');
        console.log('Error message:', apiError.message);
        console.log('Error response:', apiError.response?.data);
        console.log('Error status:', apiError.response?.status);
        
        // If it's a network error, fall back to mock data
        if (apiError.message === 'Network Error') {
          console.log('Network error - using mock data');
          Alert.alert(
            'Network Error', 
            'Cannot connect to server. Using demo mode.',
            [{ text: 'OK' }]
          );
        } else if (apiError.response?.status === 403) {
          Alert.alert(
            'Access Denied', 
            'Your account does not have conductor permissions.',
            [{ text: 'OK' }]
          );
          return;
        } else {
          // For other errors, show them to user
          Alert.alert(
            'API Error', 
            `Failed to load routes: ${apiError.response?.data?.message || apiError.message}`,
            [
              { text: 'Use Demo Mode', onPress: () => {} },
              { text: 'Retry', onPress: () => loadRoutes() }
            ]
          );
        }
      }
      
      // Fallback to mock data if API is not available
      console.log('Using mock data fallback...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockRoutes = [
        {
          _id: '1',
          routeNumber: 'RT-001',
          routeName: 'Embilipitiya - Heen Iluk Hinna',
          description: 'Demo route (Backend not available)',
          category: 'Normal',
          startPoint: 'Embilipitiya',
          endPoint: 'Heen Iluk Hinna',
          distance: 45
        }
      ];
      
      setRoutes(mockRoutes);
      console.log('Mock routes loaded:', mockRoutes);
    } catch (error) {
      console.error('Load routes error:', error);
      Alert.alert('Error', 'Failed to load routes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (route) => {
    Alert.alert(
      'Select Route',
      `Do you want to select route ${route.routeNumber} - ${route.routeName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Select', 
          onPress: () => onRouteSelected(route)
        }
      ]
    );
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading routes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Route</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {routes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No routes available</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadRoutes}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          routes.map((route) => (
            <TouchableOpacity
              key={route._id}
              style={styles.routeItem}
              onPress={() => handleRouteSelect(route)}
            >
              <View style={styles.routeHeader}>
                <Text style={styles.routeNumber}>{route.routeNumber}</Text>
                <View 
                  style={[
                    styles.categoryBadge, 
                    { backgroundColor: getCategoryColor(route.category) }
                  ]}
                >
                  <Text style={styles.categoryText}>{route.category}</Text>
                </View>
              </View>
              <Text style={styles.routeName}>{route.routeName}</Text>
              <Text style={styles.routeDescription}>{route.description}</Text>
            </TouchableOpacity>
          ))
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
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  routeItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
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
    marginBottom: 8,
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
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
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RouteSelectionScreen;
