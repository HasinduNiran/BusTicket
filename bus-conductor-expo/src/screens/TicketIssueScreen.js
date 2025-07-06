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
import { stopsAPI, ticketsAPI, faresAPI } from '../services/api';

const TicketIssueScreen = ({ user, route, bus, direction, onBack, onBackToDashboard }) => {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFromStopIndex, setSelectedFromStopIndex] = useState(0);
  const [selectedToStopIndex, setSelectedToStopIndex] = useState(0);
  const [previousToStopIndex, setPreviousToStopIndex] = useState(0);
  const [sectionNumber, setSectionNumber] = useState('');
  const [selectingStop, setSelectingStop] = useState('from'); // 'from' or 'to'
  const [fare, setFare] = useState(0);
  const [issuingTicket, setIssuingTicket] = useState(false);
  const [calculatingFare, setCalculatingFare] = useState(false);

  useEffect(() => {
    loadStops();
  }, [direction]); // Reload stops when direction changes

  useEffect(() => {
    // This effect triggers the fare calculation when the user has entered a valid section number.
    if (sectionNumber && !isNaN(parseInt(sectionNumber, 10)) && stops.length > 0) {
      const fromStop = stops[selectedFromStopIndex];
      const toStop = stops[selectedToStopIndex];

      if (fromStop && toStop) {
        const fromSection = fromStop.sectionNumber;
        const toSection = toStop.sectionNumber;

        // Only calculate if the entered section number matches the selected 'To' stop's section
        if (parseInt(sectionNumber, 10) === toSection) {
            calculateFare(fromSection, toSection);
        } else {
            // This case can happen if the user types a number but a stop hasn't been found yet.
            // We can clear the fare to avoid showing a stale value.
            setFare(0);
        }
      }
    } else {
      // If the section number is cleared, reset the fare.
      setFare(0);
    }
  }, [sectionNumber, selectedFromStopIndex, selectedToStopIndex, stops, direction]); // Rerun when these dependencies change

  const handleSectionNumberChange = (text) => {
    setSectionNumber(text);

    if (text && !isNaN(parseInt(text, 10)) && stops.length > 0) {
      const destinationSection = parseInt(text, 10);
      
      const toStopIndex = stops.findIndex(
        (s) => s.sectionNumber === destinationSection
      );

      if (toStopIndex !== -1) {
        setPreviousToStopIndex(selectedToStopIndex); // Store current index before updating
        setSelectedToStopIndex(toStopIndex);
        const destinationStop = stops[toStopIndex];
        const destinationStopName = destinationStop.stopName;
        console.log(`Section Number: ${destinationSection}, Destination: ${destinationStopName}`);
      } else {
        setSelectedToStopIndex(selectedFromStopIndex);
      }
    } else {
      setSelectedToStopIndex(selectedFromStopIndex);
    }
  };

  const loadStops = async () => {
    try {
      setLoading(true);
      
      const busCategory = bus.category || 'normal';
      // Always fetch the canonical route (e.g., 'return' direction which has 0-based sections)
      const response = await stopsAPI.getByRoute(route._id, 'return', busCategory);
      
      if (response.data && response.data.stops && response.data.stops.length > 0) {
        let processedStops = response.data.stops;

        // The API for 'return' gives us the canonical order (e.g., 0 to N)
        // For the 'forward' direction in the UI, we want to display them in reverse order (N to 0)
        if (direction === 'forward') {
          processedStops = [...processedStops].reverse();
        }

        setStops(processedStops);

        console.log(`--- Processed Stops for ${direction} direction ---`);
        processedStops.forEach(stop => {
          console.log(`Section: ${stop.sectionNumber}, Stop: ${stop.stopName}`);
        });
        console.log('------------------------------------');

      } else {
        Alert.alert(
          'No Stops Found', 
          `No stops are configured for this route. Please contact the administrator.`,
          [
            { text: 'Go Back', onPress: onBack }
          ]
        );
      }
    } catch (error) {
      console.error('Load stops error:', error);
      Alert.alert(
        'Error Loading Stops', 
        'Unable to load route stops. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: loadStops },
          { text: 'Go Back', onPress: onBack }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateFare = async (fromSection, toSection) => {
    // VALIDATION: Prevent backward travel based on direction
    const isForward = direction === 'forward';

    // In our canonical model (0 to N), forward means from < to, return means from > to.
    if (isForward && fromSection >= toSection) {
      Alert.alert(
        'Invalid Destination',
        `For the forward direction, the destination section (${toSection}) must be after the current section (${fromSection}).`,
        [{ text: 'OK' }]
      );
      setSectionNumber(''); // Clear invalid input
      setSelectedToStopIndex(previousToStopIndex); // Revert to the last valid stop
      setFare(0);
      return;
    }

    if (!isForward && fromSection <= toSection) {
      Alert.alert(
        'Invalid Destination',
        `For the return direction, the destination section (${toSection}) must be before the current section (${fromSection}).`,
        [{ text: 'OK' }]
      );
      setSectionNumber(''); // Clear invalid input
      setSelectedToStopIndex(previousToStopIndex); // Revert to the last valid stop
      setFare(0);
      return;
    }

    try {
      setCalculatingFare(true);
      
      const response = await faresAPI.calculate(
        route._id, 
        fromSection, 
        toSection, 
        bus.category || 'normal'
      );

      if (response.data && (response.data.fare !== undefined || response.data.calculatedFare !== undefined)) {
        const fareAmount = response.data.fare || response.data.calculatedFare;
        setFare(fareAmount);
      } else {
        setFare(0);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred while calculating the fare.';
      console.error('Fare calculation API error:', errorMessage, error.response?.data);
      Alert.alert('Fare Calculation Error', errorMessage);
      setFare(0);
    } finally {
      setCalculatingFare(false);
    }
  };

  const handleIssueTicket = async () => {
    if (!sectionNumber.trim()) {
      Alert.alert('Error', 'Please enter a section number');
      return;
    }

    const directionText = direction === 'forward' 
      ? `${route.startPoint} → ${route.endPoint}` 
      : `${route.endPoint} → ${route.startPoint}`;

    const fromStop = stops[selectedFromStopIndex];
    const toStop = stops[selectedToStopIndex];
    const fromSection = fromStop.sectionNumber;
    const toSection = toStop.sectionNumber;

    Alert.alert(
      'Issue Ticket',
      `Issue ticket for:\nDirection: ${directionText}\nFrom: ${fromStop.stopName} \nTo: ${toStop.stopName} \nFare: Rs.${fare}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Issue', onPress: confirmIssueTicket }
      ]
    );
  };

  const confirmIssueTicket = async () => {
    try {
      setIssuingTicket(true);
      
      const fromStop = stops[selectedFromStopIndex];
      const toStop = stops[selectedToStopIndex];
      
      const ticketData = {
        routeId: route._id,
        fromSectionNumber: fromStop.sectionNumber,
        toSectionNumber: toStop.sectionNumber,
        busNumber: bus.busNumber,
        fare: fare,
        passengerCount: 1,
        paymentMethod: 'cash',
        direction: direction
      };
      
      try {
        // Try to issue ticket via API
        const response = await ticketsAPI.create(ticketData);
        
        if (response.data && response.data.success) {
          Alert.alert(
            'Ticket Issued Successfully!',
            `Ticket ID: ${response.data.ticket.ticketNumber}\nFare: Rs.${fare}`,
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
        `Ticket ID: TKT${Date.now()}\nFare: Rs.${fare}\n\nNote: This is a demo ticket.`,
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
    setSectionNumber('');
    setSelectedFromStopIndex(0);
    setSelectedToStopIndex(0); // Allow same as from initially
    setSelectingStop('from');
    setFare(0);
    setCalculatingFare(false);
  };

  const moveSelection = (move) => {
    const currentStopIndex = selectingStop === 'from' ? selectedFromStopIndex : selectedToStopIndex;
    let nextIndex = currentStopIndex;

    if (move === 'up') {
      nextIndex = Math.max(0, currentStopIndex - 1);
    } else if (move === 'down') {
      nextIndex = Math.min(stops.length - 1, currentStopIndex + 1);
    }

    if (selectingStop === 'from') {
      setSelectedFromStopIndex(nextIndex);
    } else {
      setSelectedToStopIndex(nextIndex);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="auto" />
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
          <Text style={styles.backButtonText}>← Buses</Text>
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
          <Text style={styles.sectionTitle}>Select Stops</Text>
          
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
                ]}>From</Text>
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
                ]}>To</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.navigationControls}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => moveSelection('up')}
              >
                <Text style={styles.navButtonText}>▲ UP</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => moveSelection('down')}
              >
                <Text style={styles.navButtonText}>▼ DOWN</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.selectedStops}>
            <View style={styles.stopDisplay}>
              <Text style={styles.stopLabel}>From:</Text>
              <Text style={[
                styles.stopName,
                selectingStop === 'from' && styles.activeStop
              ]}>
                {stops[selectedFromStopIndex]?.stopName}
              </Text>
            </View>
            <Text style={styles.arrow}>↓</Text>
            <View style={styles.stopDisplay}>
              <Text style={styles.stopLabel}>To:</Text>
              <Text style={[
                styles.stopName,
                selectingStop === 'to' && styles.activeStop
              ]}>
                {stops[selectedToStopIndex]?.stopName}
              </Text>
            </View>
          </View>
        </View>

        {/* Section Number Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destination Section</Text>
          <Text style={styles.sectionDescription}>
            Enter the section number where the passenger wants to get off
          </Text>
          <TextInput
            style={styles.sectionInput}
            value={sectionNumber}
            onChangeText={handleSectionNumberChange}
            placeholder="Enter destination section number"
            keyboardType="numeric"
            maxLength={3}
          />
        </View>

        {/* Fare Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fare Calculation</Text>
          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Total Fare:</Text>
            {calculatingFare ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Text style={styles.fareAmount}>Rs.{fare}</Text>
            )}
          </View>
          {calculatingFare ? (
            <Text style={styles.fareNote}>Calculating fare from route sections...</Text>
          ) : fare > 0 && stops[selectedFromStopIndex] && stops[selectedToStopIndex] ? (
            <View>
              <Text style={styles.fareNote}>
                From: {stops[selectedFromStopIndex]?.stopName} (Section {stops[selectedFromStopIndex]?.sectionNumber})
              </Text>
              <Text style={styles.fareNote}>
                To: {stops[selectedToStopIndex]?.stopName} (Section {stops[selectedToStopIndex]?.sectionNumber})
              </Text>
              {(() => {
                const fromSection = stops[selectedFromStopIndex]?.sectionNumber;
                const toSection = stops[selectedToStopIndex]?.sectionNumber;
                const sectionCount = Math.abs(toSection - fromSection);
                return (
                  <Text style={styles.fareBreakdown}>
                    {sectionCount === 0 
                      ? `Same section (0 sections) = Rs.${fare}` 
                      : `From section ${fromSection} to section ${toSection} = ${sectionCount} sections = Rs.${fare}`
                    }
                  </Text>
                );
              })()}
            </View>
          ) : (
            <Text style={styles.fareNote}>
              Enter destination section number to calculate fare
            </Text>
          )}
        </View>

        {/* Issue Button */}
        <TouchableOpacity
          style={[styles.issueButton, (!sectionNumber || issuingTicket) && styles.issueButtonDisabled]}
          onPress={handleIssueTicket}
          disabled={!sectionNumber || issuingTicket}
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  stopSelectionContainer: {
    marginBottom: 15,
  },
  stopTypeSelector: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  stopTypeButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginRight: 10,
    borderRadius: 8,
  },
  stopTypeButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  stopTypeButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  stopTypeButtonTextActive: {
    color: '#ffffff',
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedStops: {
    marginTop: 15,
    alignItems: 'center',
  },
  stopDisplay: {
    alignItems: 'center',
    marginVertical: 5,
  },
  stopLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    minWidth: 200,
  },
  activeStop: {
    backgroundColor: '#E3F2FD',
    color: '#2196F3',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  arrow: {
    fontSize: 20,
    color: '#2196F3',
    marginVertical: 5,
  },
  sectionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
    textAlign: 'center',
  },
  fareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  fareLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  fareAmount: {
    fontSize: 24,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  fareNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  fareBreakdown: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
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
