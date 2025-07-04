import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const RouteSelectionScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedDirection, setSelectedDirection] = useState(null);

  const directions = [
    { 
      value: 'forward', 
      label: 'Forward Direction', 
      icon: 'arrow-forward',
      description: 'Start Point → End Point'
    },
    { 
      value: 'backward', 
      label: 'Return Direction', 
      icon: 'arrow-back',
      description: 'End Point → Start Point'
    }
  ];

  useEffect(() => {
    loadConductorData();
  }, []);

  const loadConductorData = async () => {
    try {
      setLoading(true);
      
      // Get buses assigned to this conductor
      const busResponse = await apiService.getConductorBuses();
      setBuses(busResponse.buses || []);
      
      // Get routes for the buses
      if (busResponse.buses && busResponse.buses.length > 0) {
        const routeIds = [...new Set(busResponse.buses.map(bus => bus.routeId._id))];
        const routeResponse = await apiService.getRoutesByIds(routeIds);
        setRoutes(routeResponse.routes || []);
      }
      
    } catch (error) {
      console.error('Load conductor data error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load your assigned buses',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBusSelection = (bus) => {
    setSelectedBus(bus);
    setSelectedDirection(null);
  };

  const handleDirectionSelection = (direction) => {
    setSelectedDirection(direction);
  };

  const handleStartJourney = () => {
    if (!selectedBus || !selectedDirection) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select both bus and direction',
      });
      return;
    }

    // Store the selected bus and direction in context or async storage
    // Then navigate to the ticket generator
    navigation.navigate('TicketGenerator', {
      busId: selectedBus._id,
      busNumber: selectedBus.busNumber,
      routeId: selectedBus.routeId._id,
      direction: selectedDirection.value,
      category: selectedBus.category,
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'normal': '#4caf50',
      'semi-luxury': '#2196F3',
      'luxury': '#9c27b0',
      'super-luxury': '#f44336'
    };
    return colors[category] || '#666';
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'normal': 'Normal',
      'semi-luxury': 'Semi-Luxury',
      'luxury': 'Luxury',
      'super-luxury': 'Super Luxury'
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading your assigned buses...</Text>
      </View>
    );
  }

  if (buses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="directions-bus" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>No Buses Assigned</Text>
        <Text style={styles.emptyText}>
          You don't have any buses assigned to you. Please contact the administrator.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Bus & Direction</Text>
        <Text style={styles.subtitle}>
          Welcome, {user?.profile?.fullName || user?.username}
        </Text>
      </View>

      {/* Bus Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <Icon name="directions-bus" size={20} color="#2196F3" /> Your Assigned Buses
        </Text>
        
        {buses.map((bus) => (
          <TouchableOpacity
            key={bus._id}
            style={[
              styles.busCard,
              selectedBus?._id === bus._id && styles.selectedBusCard
            ]}
            onPress={() => handleBusSelection(bus)}
          >
            <View style={styles.busHeader}>
              <View style={styles.busNumberContainer}>
                <Text style={styles.busNumber}>{bus.busNumber}</Text>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(bus.category) }]}>
                  <Text style={styles.categoryText}>{getCategoryLabel(bus.category)}</Text>
                </View>
              </View>
              {selectedBus?._id === bus._id && (
                <Icon name="check-circle" size={24} color="#4caf50" />
              )}
            </View>
            
            <View style={styles.routeInfo}>
              <Text style={styles.routeName}>{bus.routeId.routeName}</Text>
              <Text style={styles.routeDetails}>
                {bus.routeId.startPoint} → {bus.routeId.endPoint}
              </Text>
              <Text style={styles.routeNumber}>Route: {bus.routeId.routeNumber}</Text>
            </View>
            
            <View style={styles.busDetails}>
              <Text style={styles.capacity}>Capacity: {bus.capacity} passengers</Text>
              {bus.driverName && (
                <Text style={styles.driver}>Driver: {bus.driverName}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Direction Selection */}
      {selectedBus && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="compare-arrows" size={20} color="#2196F3" /> Select Direction
          </Text>
          
          {directions.map((direction) => (
            <TouchableOpacity
              key={direction.value}
              style={[
                styles.directionCard,
                selectedDirection?.value === direction.value && styles.selectedDirectionCard
              ]}
              onPress={() => handleDirectionSelection(direction)}
            >
              <View style={styles.directionHeader}>
                <Icon 
                  name={direction.icon} 
                  size={32} 
                  color={selectedDirection?.value === direction.value ? '#fff' : '#2196F3'} 
                />
                <View style={styles.directionInfo}>
                  <Text style={[
                    styles.directionLabel,
                    selectedDirection?.value === direction.value && styles.selectedDirectionText
                  ]}>
                    {direction.label}
                  </Text>
                  <Text style={[
                    styles.directionDescription,
                    selectedDirection?.value === direction.value && styles.selectedDirectionText
                  ]}>
                    {direction.value === 'forward' 
                      ? `${selectedBus.routeId.startPoint} → ${selectedBus.routeId.endPoint}`
                      : `${selectedBus.routeId.endPoint} → ${selectedBus.routeId.startPoint}`
                    }
                  </Text>
                </View>
                {selectedDirection?.value === direction.value && (
                  <Icon name="check-circle" size={24} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Start Journey Button */}
      {selectedBus && selectedDirection && (
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartJourney}
          >
            <Icon name="play-arrow" size={24} color="#fff" />
            <Text style={styles.startButtonText}>Start Journey</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  busCard: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  selectedBusCard: {
    borderColor: '#4caf50',
    backgroundColor: '#f8fff8',
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  busNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  routeInfo: {
    marginBottom: 12,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  routeDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  routeNumber: {
    fontSize: 12,
    color: '#999',
  },
  busDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
  capacity: {
    fontSize: 14,
    color: '#666',
  },
  driver: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  directionCard: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  selectedDirectionCard: {
    borderColor: '#2196F3',
    backgroundColor: '#2196F3',
  },
  directionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  directionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  directionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  directionDescription: {
    fontSize: 14,
    color: '#666',
  },
  selectedDirectionText: {
    color: '#fff',
  },
  actionSection: {
    padding: 16,
  },
  startButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
});

export default RouteSelectionScreen;
