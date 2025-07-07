import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { busesAPI, authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BusSelectionScreen = ({ navigation, onBusSelected, onLogout }) => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conductorName, setConductorName] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setConductorName(userData.fullName || userData.username || 'Conductor');
        } else {
          setConductorName('Conductor');
        }
      } catch (error) {
        console.error("Failed to load user data", error);
        setConductorName('Conductor');
      }
      loadBuses();
    };
    init();
  }, []);

  const loadBuses = async () => {
    try {
      setLoading(true);
      console.log('=== Loading Conductor Buses ===');
      
      // Try to load real data from API
      try {
        console.log('Calling getConductorBuses API...');
        const response = await busesAPI.getConductorBuses();
        console.log('Full API response:', response);
        console.log('Response data:', response.data);
        
        if (response.data && response.data.success) {
          if (response.data.buses && response.data.buses.length > 0) {
            console.log('Successfully loaded conductor buses:', response.data.buses);
            setBuses(response.data.buses);
            Alert.alert(
              'Buses Loaded', 
              `Found ${response.data.buses.length} bus(es) for your route`,
              [{ text: 'OK' }]
            );
            return;
          } else {
            // No buses assigned to route
            console.log('No buses assigned to route');
            Alert.alert(
              'No Buses Available', 
              'No buses have been assigned to your route. Please contact your administrator.',
              [{ text: 'OK' }]
            );
            setBuses([]);
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
            `Failed to load buses: ${apiError.response?.data?.message || apiError.message}`,
            [
              { text: 'Use Demo Mode', onPress: () => {} },
              { text: 'Retry', onPress: () => loadBuses() }
            ]
          );
        }
      }
      
      // Fallback to mock data if API is not available
      console.log('Using mock data fallback...');
      await new Promise(resolve => setTimeout(resolve, 1000));        const mockBuses = [
        {
          _id: '1',
          busNumber: 'NB-1234',
          category: 'Normal',
          capacity: 52,
          driverName: 'Demo Driver',
          routeId: {
            _id: '1',
            routeName: 'Embilipitiya - Heen Iluk Hinna',
            routeNumber: 'RT-001'
          },
          isActive: true
        },
        {
          _id: '2',
          busNumber: 'NB-5678',
          category: 'Semi-luxury',
          capacity: 48,
          driverName: 'Demo Driver 2',
          routeId: {
            _id: '1',
            routeName: 'Embilipitiya - Heen Iluk Hinna',
            routeNumber: 'RT-001'
          },
          isActive: true
        }
      ];
      
      setBuses(mockBuses);
      console.log('Mock buses loaded:', mockBuses);
    } catch (error) {
      console.error('Load buses error:', error);
      Alert.alert('Error', 'Failed to load buses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBusSelect = (bus) => {
    Alert.alert(
      'Select Bus',
      `Do you want to select bus ${bus.busNumber}?\n\nCapacity: ${bus.capacity}\nCategory: ${bus.category}\nDriver: ${bus.driverName || 'Not assigned'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Select', 
          onPress: () => {
            if (!bus.routeId) {
              Alert.alert(
                'Error',
                'This bus does not have a route assigned. Please contact an administrator.'
              );
              return;
            }
            onBusSelected(bus); // Use the prop here
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      onLogout(); // Use the prop here
    } catch (error) {
      console.error('Logout failed', error);
      Alert.alert('Logout Failed', 'An error occurred while trying to log out.');
      // As a fallback, still attempt to trigger the logout on the UI
      onLogout();
    }
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

  const getCategoryLabel = (category) => {
    return category || 'Normal';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="auto" />
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading buses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Select a Bus</Text>
          <Text style={styles.conductorName}>Welcome, {conductorName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Buses List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {buses.length === 0 ? (
          <View style={styles.noBusesContainer}>
            <Text style={styles.noBusesText}>No buses available for your route</Text>
            <Text style={styles.noBusesSubtext}>Please contact your administrator</Text>
          </View>
        ) : (
          <View style={styles.busesContainer}>
            {buses.map((bus) => (
              <TouchableOpacity
                key={bus._id}
                style={styles.busCard}
                onPress={() => handleBusSelect(bus)}
              >
                <View style={styles.busHeader}>
                  <Text style={styles.busNumber}>{bus.busNumber}</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(bus.category) }]}>
                    <Text style={styles.categoryText}>{getCategoryLabel(bus.category)}</Text>
                  </View>
                </View>
                
                <View style={styles.busDetails}>
                  <Text style={styles.detailText}>
                    🪑 Capacity: {bus.capacity} seats
                  </Text>
                  {bus.driverName && (
                    <Text style={styles.detailText}>
                      👨‍✈️ Driver: {bus.driverName}
                    </Text>
                  )}
                  {bus.routeId && bus.routeId.routeName && (
                    <Text style={styles.detailText}>
                      🛣️ Route: {bus.routeId.routeName}
                    </Text>
                  )}
                </View>

                <View style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>Select This Bus</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Logout Button - MOVED TO HEADER */}
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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  conductorName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  busesContainer: {
    padding: 20,
  },
  noBusesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  noBusesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  noBusesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  busCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  busNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  busDetails: {
    marginBottom: 20,
  },
  detailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  selectButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default BusSelectionScreen;
