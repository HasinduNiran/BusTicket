import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';

const RouteDirectionScreen = ({ bus, route, onDirectionSelected, onBack, onLogout }) => {
  const handleDirectionSelect = (direction) => {
    Alert.alert(
      'Confirm Direction',
      `Are you sure you want to operate in the ${direction} direction?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: () => onDirectionSelected(direction)
        }
      ]
    );
  };

  const routeName = route?.routeName || `${route?.startPoint} - ${route?.endPoint}` || 'Unknown Route';
  const startPoint = route?.startPoint || 'Start';
  const endPoint = route?.endPoint || 'End';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Select Route Direction</Text>
        
        <View style={styles.busInfo}>
          <Text style={styles.busNumber}>Bus: {bus?.busNumber}</Text>
          <Text style={styles.routeName}>Route: {routeName}</Text>
          <Text style={styles.category}>Category: {bus?.category?.toUpperCase()}</Text>
        </View>

        <Text style={styles.instruction}>
          Which direction will you be traveling today?
        </Text>

        <View style={styles.directionButtons}>
          <TouchableOpacity
            style={[styles.directionButton, styles.forwardDirection]}
            onPress={() => handleDirectionSelect('forward')}
          >
            <Text style={styles.directionTitle}>Forward Direction</Text>
            <Text style={styles.directionRoute}>{startPoint} → {endPoint}</Text>
            <Text style={styles.directionDescription}>
              Starting from {startPoint} going to {endPoint}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.directionButton, styles.returnDirection]}
            onPress={() => handleDirectionSelect('return')}
          >
            <Text style={styles.directionTitle}>Return Direction</Text>
            <Text style={styles.directionRoute}>{endPoint} → {startPoint}</Text>
            <Text style={styles.directionDescription}>
              Starting from {endPoint} going to {startPoint}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            💡 Note: This will determine the section numbering and fare calculation for your tickets.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
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
    backgroundColor: '#2196F3',
  },
  backButton: {
    padding: 10,
  },
  backText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  busInfo: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  busNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  routeName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  category: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  directionButtons: {
    gap: 15,
  },
  directionButton: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  forwardDirection: {
    backgroundColor: '#4CAF50',
  },
  returnDirection: {
    backgroundColor: '#FF9800',
  },
  directionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  directionRoute: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: '600',
  },
  directionDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  note: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  noteText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});

export default RouteDirectionScreen;
