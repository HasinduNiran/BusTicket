import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const DashboardScreen = ({ user, onLogout }) => {
  const handleRouteSelection = () => {
    Alert.alert('Route Selection', 'Route selection feature coming soon!');
  };

  const handleTicketGeneration = () => {
    Alert.alert('Ticket Generation', 'Ticket generation feature coming soon!');
  };

  const handleViewHistory = () => {
    Alert.alert('History', 'Ticket history feature coming soon!');
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

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Bus Conductor Dashboard</Text>
        <Text style={styles.welcomeText}>Welcome, {user?.name || user?.username}!</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuItem} onPress={handleRouteSelection}>
            <Text style={styles.menuIcon}>🚌</Text>
            <Text style={styles.menuTitle}>Select Route</Text>
            <Text style={styles.menuDescription}>Choose your bus route</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleTicketGeneration}>
            <Text style={styles.menuIcon}>🎫</Text>
            <Text style={styles.menuTitle}>Issue Ticket</Text>
            <Text style={styles.menuDescription}>Generate passenger tickets</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleViewHistory}>
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={styles.menuTitle}>View History</Text>
            <Text style={styles.menuDescription}>Check ticket history</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={styles.menuIcon}>🚪</Text>
            <Text style={styles.menuTitle}>Logout</Text>
            <Text style={styles.menuDescription}>Sign out of the app</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Bus Ticket System v1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
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
  menuIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  menuDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});

export default DashboardScreen;
