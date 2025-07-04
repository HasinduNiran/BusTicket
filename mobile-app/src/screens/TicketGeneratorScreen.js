import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const TicketGeneratorScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [stops, setStops] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [fromSection, setFromSection] = useState('0'); // Default start from Embilipitiya
  const [toSection, setToSection] = useState('');
  const [passengerCount, setPassengerCount] = useState('1');
  const [busNumber, setBusNumber] = useState('');
  const [fareInfo, setFareInfo] = useState(null);
  const [generatingTicket, setGeneratingTicket] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, []);

  useEffect(() => {
    if (selectedRoute) {
      loadStops();
      // Set bus number from conductor details if available
      if (user?.conductorDetails?.busNumber) {
        setBusNumber(user.conductorDetails.busNumber);
      }
    }
  }, [selectedRoute]);

  useEffect(() => {
    if (fromSection && toSection && selectedRoute) {
      calculateFare();
    }
  }, [fromSection, toSection, selectedRoute, passengerCount]);

  const loadRoutes = async () => {
    try {
      const response = await apiService.getRoutes();
      setRoutes(response.routes);
      
      // Auto-select route if conductor has assigned route
      if (user?.conductorDetails?.routeId && response.routes.length > 0) {
        const assignedRoute = response.routes.find(
          route => route._id === user.conductorDetails.routeId
        );
        if (assignedRoute) {
          setSelectedRoute(assignedRoute);
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load routes',
      });
    }
  };

  const loadStops = async () => {
    try {
      const response = await apiService.getStopsForRoute(selectedRoute._id);
      setStops(response.stops);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load stops',
      });
    }
  };

  const calculateFare = async () => {
    try {
      const fromSectionNum = parseInt(fromSection);
      const toSectionNum = parseInt(toSection);
      
      if (fromSectionNum >= toSectionNum) {
        setFareInfo(null);
        return;
      }

      const response = await apiService.calculateFareDetail(
        selectedRoute._id,
        fromSectionNum,
        toSectionNum
      );
      
      const totalFare = response.calculatedFare * parseInt(passengerCount);
      setFareInfo({
        ...response,
        totalFare,
        passengerCount: parseInt(passengerCount)
      });
    } catch (error) {
      setFareInfo(null);
    }
  };

  const generateTicket = async () => {
    if (!selectedRoute || !toSection || !busNumber) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all required fields',
      });
      return;
    }

    const fromSectionNum = parseInt(fromSection);
    const toSectionNum = parseInt(toSection);
    
    if (fromSectionNum >= toSectionNum) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Invalid section selection',
      });
      return;
    }

    setGeneratingTicket(true);
    try {
      const ticketData = {
        fromSectionNumber: fromSectionNum,
        toSectionNumber: toSectionNum,
        routeId: selectedRoute._id,
        busNumber: busNumber.trim(),
        passengerCount: parseInt(passengerCount),
        paymentMethod: 'cash'
      };

      const response = await apiService.generateTicket(ticketData);
      
      Alert.alert(
        'Ticket Generated Successfully!',
        `Ticket Number: ${response.ticket.ticketNumber}\n` +
        `From: ${response.ticket.fromStop.stopName}\n` +
        `To: ${response.ticket.toStop.stopName}\n` +
        `Fare: Rs. ${response.ticket.fare.toFixed(2)}\n` +
        `Passengers: ${response.ticket.passengerCount}`,
        [
          {
            text: 'Print Ticket',
            onPress: () => printTicket(response.ticket),
          },
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );

      // Reset form
      setToSection('');
      setPassengerCount('1');
      setFareInfo(null);
      
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to generate ticket',
      });
    } finally {
      setGeneratingTicket(false);
    }
  };

  const printTicket = (ticket) => {
    // In a real app, this would integrate with a thermal printer
    Alert.alert('Print Feature', 'Ticket sent to printer');
  };

  const renderSectionPicker = (value, onChange, label, options) => {
    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>{label}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sectionButton,
                value === option.value && styles.sectionButtonSelected
              ]}
              onPress={() => onChange(option.value)}>
              <Text style={[
                styles.sectionButtonText,
                value === option.value && styles.sectionButtonTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const sectionOptions = stops.map(stop => ({
    value: stop.sectionNumber.toString(),
    label: `${stop.sectionNumber}: ${stop.stopName}`
  }));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Icon name="confirmation-number" size={32} color="#2196F3" />
        <Text style={styles.title}>Generate Ticket</Text>
      </View>

      {selectedRoute && (
        <View style={styles.routeInfo}>
          <Text style={styles.routeText}>
            Route: {selectedRoute.routeName}
          </Text>
          <Text style={styles.routeNumber}>
            #{selectedRoute.routeNumber}
          </Text>
        </View>
      )}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bus Number *</Text>
          <TextInput
            style={styles.input}
            value={busNumber}
            onChangeText={setBusNumber}
            placeholder="Enter bus number"
            autoCapitalize="characters"
          />
        </View>

        {renderSectionPicker(
          fromSection,
          setFromSection,
          'From Stop',
          sectionOptions
        )}

        {renderSectionPicker(
          toSection,
          setToSection,
          'To Stop *',
          sectionOptions.filter(option => 
            parseInt(option.value) > parseInt(fromSection)
          )
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Number of Passengers</Text>
          <View style={styles.passengerControls}>
            <TouchableOpacity
              style={styles.passengerButton}
              onPress={() => {
                const count = Math.max(1, parseInt(passengerCount) - 1);
                setPassengerCount(count.toString());
              }}>
              <Icon name="remove" size={24} color="#2196F3" />
            </TouchableOpacity>
            <Text style={styles.passengerCount}>{passengerCount}</Text>
            <TouchableOpacity
              style={styles.passengerButton}
              onPress={() => {
                const count = parseInt(passengerCount) + 1;
                setPassengerCount(count.toString());
              }}>
              <Icon name="add" size={24} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </View>

        {fareInfo && (
          <View style={styles.fareInfo}>
            <Text style={styles.fareTitle}>Fare Calculation</Text>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>From:</Text>
              <Text style={styles.fareValue}>{fareInfo.fromStop.stopName}</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>To:</Text>
              <Text style={styles.fareValue}>{fareInfo.toStop.stopName}</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Sections:</Text>
              <Text style={styles.fareValue}>{fareInfo.sections}</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Per Person:</Text>
              <Text style={styles.fareValue}>Rs. {fareInfo.calculatedFare.toFixed(2)}</Text>
            </View>
            <View style={[styles.fareRow, styles.totalFareRow]}>
              <Text style={styles.totalFareLabel}>Total Fare:</Text>
              <Text style={styles.totalFareValue}>
                Rs. {fareInfo.totalFare.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.generateButton,
            (!fareInfo || generatingTicket) && styles.generateButtonDisabled
          ]}
          onPress={generateTicket}
          disabled={!fareInfo || generatingTicket}>
          {generatingTicket ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="print" size={24} color="#fff" />
              <Text style={styles.generateButtonText}>Generate Ticket</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  routeInfo: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  routeNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  form: {
    margin: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  sectionButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionButtonSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  sectionButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  sectionButtonTextSelected: {
    color: '#fff',
  },
  passengerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
  },
  passengerButton: {
    padding: 10,
  },
  passengerCount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    color: '#333',
  },
  fareInfo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    elevation: 1,
  },
  fareTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  fareLabel: {
    fontSize: 14,
    color: '#666',
  },
  fareValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalFareRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 10,
  },
  totalFareLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalFareValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  generateButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default TicketGeneratorScreen;
