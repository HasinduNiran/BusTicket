import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';

// Simple screens for testing
const DashboardScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Bus Ticket Conductor</Text>
    <Text style={styles.subtitle}>Dashboard</Text>
    <Text style={styles.description}>Welcome to the conductor app!</Text>
  </View>
);

const TicketScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Generate Ticket</Text>
    <Text style={styles.subtitle}>Conductor POS Interface</Text>
    <Text style={styles.description}>Select sections to generate tickets</Text>
  </View>
);

const HistoryScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Ticket History</Text>
    <Text style={styles.subtitle}>View past transactions</Text>
    <Text style={styles.description}>Track all issued tickets</Text>
  </View>
);

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Generate Ticket" component={TicketScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
