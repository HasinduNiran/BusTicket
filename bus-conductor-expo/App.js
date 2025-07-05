import React, { useState, useEffect } from 'react';
import LoginScreen from './src/screens/LoginScreen';
import RouteAssignmentScreen from './src/screens/RouteAssignmentScreen';
import BusSelectionScreen from './src/screens/BusSelectionScreen';
import RouteDirectionScreen from './src/screens/RouteDirectionScreen';
import TicketIssueScreen from './src/screens/TicketIssueScreen';
import { authAPI } from './src/services/api';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStoredAuth();
  }, []);

  const checkStoredAuth = async () => {
    try {
      const storedUser = await authAPI.getStoredUser();
      if (storedUser && storedUser.role === 'conductor') {
        setUser(storedUser);
        setCurrentScreen('busSelection'); // Go directly to bus selection
      }
    } catch (error) {
      console.error('Error checking stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentScreen('busSelection'); // Go directly to bus selection after login
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      setSelectedRoute(null);
      setSelectedBus(null);
      setSelectedDirection(null);
      setCurrentScreen('login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleBusSelect = (bus) => {
    setSelectedBus(bus);
    // Get the route from the bus data or fetch it
    if (bus.routeId) {
      setSelectedRoute(bus.routeId);
    }
    setCurrentScreen('routeDirection');
  };

  const handleDirectionSelect = (direction) => {
    setSelectedDirection(direction);
    setCurrentScreen('ticketIssue');
  };

  const handleBackToLogin = () => {
    setSelectedRoute(null);
    setSelectedBus(null);
    setSelectedDirection(null);
    setCurrentScreen('login');
  };

  const handleBackToBuses = () => {
    setSelectedBus(null);
    setSelectedDirection(null);
    setCurrentScreen('busSelection');
  };

  const handleBackToDirection = () => {
    setSelectedDirection(null);
    setCurrentScreen('routeDirection');
  };

  if (loading) {
    return null; // You can add a loading screen here if needed
  }

  switch (currentScreen) {
    case 'login':
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    
    case 'busSelection':
      return (
        <BusSelectionScreen
          user={user}
          onBusSelected={handleBusSelect}
          onBack={handleBackToLogin}
          onLogout={handleLogout}
        />
      );
    
    case 'routeDirection':
      return (
        <RouteDirectionScreen
          bus={selectedBus}
          route={selectedRoute}
          onDirectionSelected={handleDirectionSelect}
          onBack={handleBackToBuses}
          onLogout={handleLogout}
        />
      );
    
    case 'ticketIssue':
      return (
        <TicketIssueScreen
          user={user}
          route={selectedRoute}
          bus={selectedBus}
          direction={selectedDirection}
          onBack={handleBackToDirection}
          onBackToDashboard={handleBackToBuses}
        />
      );
    
    default:
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }
}
