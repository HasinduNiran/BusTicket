import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { stopsAPI, ticketsAPI } from '../services/api';

const TicketIssueScreen = ({ user, route, bus, direction, onBack, onBackToDashboard }) => {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFromStopIndex, setSelectedFromStopIndex] = useState(0);
  const [selectedToStopIndex, setSelectedToStopIndex] = useState(1);
  const [sectionNumber, setSectionNumber] = useState('');
  const [selectingStop, setSelectingStop] = useState('from'); // 'from' or 'to'
  const [fare, setFare] = useState(0);
  const [issuingTicket, setIssuingTicket] = useState(false);

  useEffect(() => {
    loadStops();
  }, [direction]); // Reload stops when direction changes

  useEffect(() => {
    calculateFare();
  }, [selectedFromStopIndex, selectedToStopIndex, sectionNumber]);

  const loadStops = async () => {
    try {
      setLoading(true);
      
      // Try to load real data from API
      try {
        const response = await stopsAPI.getByRoute(route._id, direction);
        if (response.data && response.data.stops) {
          setStops(response.data.stops);
          return;
        }
      } catch (apiError) {
        console.log('API not available, using mock data:', apiError.message);
      }
      
      // Fallback to mock data - create direction-based stops
      const mockStops = [];
      const baseStops = [
        { name: 'Embilipitiya Bus Stand', section: 0 },
        { name: 'Embilipitiya Town', section: 1 },
        { name: 'Udawalawa Junction', section: 2 },
        { name: 'Thanamalwila', section: 3 },
        { name: 'Monaragala', section: 4 },
        { name: 'Wellawaya', section: 5 },
        { name: 'Ella', section: 6 },
        { name: 'Bandarawela', section: 7 },
        { name: 'Haputale', section: 8 },
        { name: 'Diyatalawa', section: 9 },
        { name: 'Badulla', section: 10 }
      ];

      // If return direction, reverse the order
      const orderedStops = direction === 'return' ? [...baseStops].reverse() : baseStops;
      
      orderedStops.forEach((stop, index) => {
        mockStops.push({
          _id: `stop_${index}`,
          code: `ST${String(index + 1).padStart(3, '0')}`,
          stopName: stop.name,
          name: stop.name, // For backward compatibility
          sectionNumber: direction === 'return' ? (baseStops.length - 1 - stop.section) : stop.section,
          displaySectionNumber: index,
          order: index,
          routeId: route._id,
          isActive: true,
          coordinates: { latitude: null, longitude: null }
        });
      });

      setStops(mockStops);
    } catch (error) {
      console.error('Load stops error:', error);
      Alert.alert('Error', 'Failed to load stops. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateFare = () => {
    if (stops.length === 0 || !sectionNumber) {
      setFare(0);
      return;
    }

    const fromSection = parseInt(sectionNumber);
    const toStopSection = stops[selectedToStopIndex]?.sectionNumber || selectedToStopIndex;
    
    // Validation: From section must be less than to section
    if (fromSection >= toStopSection) {
      setFare(0);
      return;
    }

    // Calculate sections count (this is the key fix)
    const sectionsCount = toStopSection - fromSection;
    
    // Base fare calculation - now based on sections traveled, not absolute numbers
    let baseFare = 25; // Base fare
    let sectionFare = 15; // Per section fare
    
    // Category multipliers
    const categoryMultipliers = {
      'normal': 1.0,
      'semi-luxury': 1.3,
      'luxury': 1.6,
      'super-luxury': 2.0
    };
    
    const multiplier = categoryMultipliers[bus?.category] || 1.0;
    const calculatedFare = Math.ceil((baseFare + (sectionsCount * sectionFare)) * multiplier);
    
    setFare(calculatedFare);
  };

  const handleIssueTicket = () => {
    if (!sectionNumber.trim()) {
      Alert.alert('Error', 'Please enter a section number');
      return;
    }

    const fromSection = parseInt(sectionNumber);
    const toStopSection = stops[selectedToStopIndex]?.sectionNumber || selectedToStopIndex;

    // Enhanced validation
    if (isNaN(fromSection) || fromSection < 0) {
      Alert.alert('Error', 'Please enter a valid section number (0 or greater)');
      return;
    }

    if (fromSection >= toStopSection) {
      Alert.alert(
        'Invalid Selection', 
        `From section (${fromSection}) must be less than destination section (${toStopSection}).\n\nPlease select a different starting section or destination.`
      );
      return;
    }

    if (selectedFromStopIndex >= selectedToStopIndex) {
      Alert.alert('Error', 'Destination stop must be after departure stop');
      return;
    }

    const sectionsCount = toStopSection - fromSection;
    const directionText = direction === 'forward' 
      ? `${route.startPoint} → ${route.endPoint}` 
      : `${route.endPoint} → ${route.startPoint}`;

    Alert.alert(
      'Issue Ticket',
      `Issue ticket for:\nDirection: ${directionText}\nFrom: Section ${fromSection} (${stops[selectedFromStopIndex].name})\nTo: Section ${toStopSection} (${stops[selectedToStopIndex].name})\nSections: ${sectionsCount}\nFare: ₹${fare}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Issue', onPress: confirmIssueTicket }
      ]
    );
  };

  const confirmIssueTicket = async () => {
    try {
      setIssuingTicket(true);
      
      const fromSection = parseInt(sectionNumber);
      const toStopSection = stops[selectedToStopIndex]?.sectionNumber || selectedToStopIndex;
      
      const ticketData = {
        routeId: route._id,
        fromSectionNumber: fromSection,
        toSectionNumber: toStopSection,
        busNumber: bus.busNumber,
        fare: fare,
        passengerCount: 1,
        direction: direction,
        paymentMethod: 'cash'
      };
      
      try {
        // Try to issue ticket via API
        const response = await ticketsAPI.generate(ticketData);
        
        if (response.data && response.data.success) {
          Alert.alert(
            'Ticket Issued Successfully!',
            `Ticket ID: ${response.data.ticket.ticketNumber}\nFrom: Section ${fromSection}\nTo: Section ${toStopSection}\nSections: ${toStopSection - fromSection}\nFare: ₹${fare}`,
            [
              { text: 'Issue Another', onPress: resetForm },
              { text: 'Back to Routes', onPress: onBackToDashboard }
            ]
          );
          return;
        }
      } catch (apiError) {
        console.log('API not available, showing mock success:', apiError.message);
      }
      
      // Fallback to mock success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Ticket Issued Successfully!',
        `Ticket ID: TKT${Date.now()}\nFrom: Section ${fromSection}\nTo: Section ${toStopSection}\nSections: ${toStopSection - fromSection}\nFare: ₹${fare}\n\nNote: This is a demo ticket.`,
        [
          { text: 'Issue Another', onPress: resetForm },
          { text: 'Back to Routes', onPress: onBackToDashboard }
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to issue ticket. Please try again.');
      console.error('Issue ticket error:', error);
    } finally {
      setIssuingTicket(false);
    }
  };

  const resetForm = () => {
    setSelectedFromStopIndex(0);
    setSelectedToStopIndex(1);
    setSectionNumber('');
    setFare(0);
  };

  const handleStopSelect = (index) => {
    if (selectingStop === 'from') {
      setSelectedFromStopIndex(index);
      if (index >= selectedToStopIndex) {
        setSelectedToStopIndex(Math.min(index + 1, stops.length - 1));
      }
    } else {
      setSelectedToStopIndex(index);
      if (index <= selectedFromStopIndex) {
        setSelectedFromStopIndex(Math.max(index - 1, 0));
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading stops...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Direction</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Issue Ticket</Text>
          <Text style={styles.routeInfo}>{route.routeNumber} - {route.routeName}</Text>
          {bus && (
            <Text style={styles.busInfo}>Bus: {bus.busNumber} ({bus.category})</Text>
          )}
          {direction && (
            <Text style={styles.directionInfo}>
              Direction: {direction === 'forward' 
                ? `${route.startPoint} → ${route.endPoint}` 
                : `${route.endPoint} → ${route.startPoint}`}
            </Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stop Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select St5ops</Text>
          
          <View style={styles.stopSelectionContainer}>
            <View style={styles.stopTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.stopTypeButton,
                  selectingStop === 'from' && styles.stopTypeButtonActive
                ]}
                onPress={() => setSelectingStop('from')}
              >
                <Text style={[
                  styles.stopTypeButtonText,
                  selectingStop === 'from' && styles.stopTypeButtonTextActive
                ]}>
                  From Stop
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.stopTypeButton,
                  selectingStop === 'to' && styles.stopTypeButtonActive
                ]}
                onPress={() => setSelectingStop('to')}
              >
                <Text style={[
                  styles.stopTypeButtonText,
                  selectingStop === 'to' && styles.stopTypeButtonTextActive
                ]}>
                  To Stop
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.stopsList} 
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {stops.map((stop, index) => (
                <TouchableOpacity
                  key={stop._id}
                  style={[
                    styles.stopItem,
                    (selectingStop === 'from' && index === selectedFromStopIndex) ||
                    (selectingStop === 'to' && index === selectedToStopIndex)
                      ? styles.stopItemSelected
                      : null,
                    index === selectedFromStopIndex && selectingStop !== 'from'
                      ? styles.stopItemFrom
                      : null,
                    index === selectedToStopIndex && selectingStop !== 'to'
                      ? styles.stopItemTo
                      : null
                  ]}
                  onPress={() => handleStopSelect(index)}
                >
                  <Text style={styles.stopName}>{stop.name}</Text>
                  <Text style={styles.stopSection}>Section: {stop.displaySectionNumber}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Section Number Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section Number</Text>
          <TextInput
            style={styles.sectionInput}
            value={sectionNumber}
            onChangeText={setSectionNumber}
            placeholder="Enter section number"
            keyboardType="numeric"
            maxLength={3}
          />
          <Text style={styles.inputHelper}>
            Enter the section number from where the passenger boarded
          </Text>
        </View>

        {/* Fare Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fare Calculation</Text>
          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Total Fare:</Text>
            <Text style={styles.fareAmount}>₹{fare}</Text>
          </View>
          <Text style={styles.fareBreakdown}>
            From: {stops[selectedFromStopIndex]?.name} → To: {stops[selectedToStopIndex]?.name}
          </Text>
          <Text style={styles.fareBreakdown}>
            {sectionNumber && stops[selectedToStopIndex] ? 
              `From Section: ${sectionNumber} → To Section: ${stops[selectedToStopIndex]?.sectionNumber || selectedToStopIndex} • Sections: ${(stops[selectedToStopIndex]?.sectionNumber || selectedToStopIndex) - parseInt(sectionNumber || 0)}` :
              `Category: ${bus?.category?.toUpperCase()}`
            }
          </Text>
          {sectionNumber && parseInt(sectionNumber) >= (stops[selectedToStopIndex]?.sectionNumber || selectedToStopIndex) && (
            <Text style={styles.errorText}>
              ⚠️ Invalid: From section must be less than destination section
            </Text>
          )}
        </View>

        {/* Issue Button */}
        <TouchableOpacity
          style={[
            styles.issueButton,
            (issuingTicket || fare === 0) && styles.issueButtonDisabled
          ]}
          onPress={handleIssueTicket}
          disabled={issuingTicket || fare === 0}
        >
          {issuingTicket ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.issueButtonText}>Issue Ticket</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2196F3',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  routeInfo: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },
  busInfo: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
    fontWeight: '600',
  },
  directionInfo: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 2,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  stopSelectionContainer: {
    minHeight: 200,
  },
  stopTypeSelector: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 2,
  },
  stopTypeButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  stopTypeButtonActive: {
    backgroundColor: '#2196F3',
  },
  stopTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  stopTypeButtonTextActive: {
    color: '#ffffff',
  },
  stopsList: {
    maxHeight: 250,
  },
  stopItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stopItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  stopItemFrom: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  stopItemTo: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  stopSection: {
    fontSize: 12,
    color: '#666',
  },
  sectionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputHelper: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  fareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  fareLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  fareBreakdown: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: '600',
    marginTop: 5,
  },
  issueButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  issueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  issueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TicketIssueScreen;
