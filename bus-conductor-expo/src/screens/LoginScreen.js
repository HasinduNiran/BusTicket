import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { authAPI } from '../services/api';

const LoginScreen = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('conductor1'); // Pre-filled for testing
  const [password, setPassword] = useState('conductor123'); // Pre-filled for testing
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    
    try {
      // Try real API authentication first
      try {
        // For real API, we need to send email instead of username
        // Check if the input looks like an email, otherwise map username to email
        let loginEmail = username.trim();
        if (!loginEmail.includes('@')) {
          // Map common usernames to their email addresses
          const usernameToEmailMap = {
            'conductor1': 'conductor@busticket.com',
            'conductor': 'conductor@busticket.com',
            'admin': 'admin@busticket.com',
            'busowner1': 'owner@busticket.com'
          };
          loginEmail = usernameToEmailMap[username.trim()] || `${username.trim()}@busticket.com`;
        }
        
        const response = await authAPI.login({
          email: loginEmail,
          password: password.trim()
        });
        
        console.log('Login response received:', response);
        
        if (response.data && response.data.user) {
          console.log('User data:', response.data.user);
          console.log('User role:', response.data.user.role);
          console.log('Auth token stored:', response.data.token ? 'Yes' : 'No');
          
          // Check if user is a conductor
          if (response.data.user.role !== 'conductor') {
            Alert.alert('Access Denied', 'This app is only for conductors. Please contact your administrator.');
            return;
          }
          
          Alert.alert('Success', `Welcome ${response.data.user.username}!\n\nRole: ${response.data.user.role}`, [
            { 
              text: 'OK', 
              onPress: () => onLoginSuccess(response.data.user)
            }
          ]);
          return;
        } else {
          console.log('Invalid response structure:', response);
          Alert.alert('Error', 'Invalid response from server');
          return;
        }
      } catch (apiError) {
        console.log('API not available, using demo authentication:', apiError.message);
        
        // Fallback to demo authentication
        const demoCredentials = [
          { username: 'conductor1', password: 'pass123', name: 'John Conductor', routes: ['R001', 'R002'] },
          { username: 'conductor2', password: 'pass456', name: 'Jane Conductor', routes: ['R003'] },
          { username: 'demo', password: 'demo', name: 'Demo Conductor', routes: ['R001', 'R002', 'R003'] }
        ];
        
        const user = demoCredentials.find(cred => 
          cred.username === username.trim() && cred.password === password.trim()
        );
        
        if (user) {
          const userData = {
            id: Date.now(),
            username: user.username,
            name: user.name,
            role: 'conductor',
            assignedRoutes: user.routes,
            isDemo: true
          };
          
          Alert.alert('Demo Login Success', `Welcome ${user.name}!\n\nNote: You're in demo mode since the backend is not accessible.`, [
            { 
              text: 'OK', 
              onPress: () => onLoginSuccess(userData)
            }
          ]);
        } else {
          Alert.alert('Error', 'Invalid demo credentials.\n\nTry:\n• username: demo, password: demo\n• username: conductor1, password: pass123');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials and try again.';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setUsername('conductor1');
    setPassword('conductor123');
    Alert.alert(
      'Demo Credentials Filled',
      'Backend credentials filled:\n\n• conductor1 → conductor@busticket.com\n• Password: conductor123\n\nThe app will map the username to email automatically.',
      [{ text: 'OK' }]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Bus Conductor App</Text>
        <Text style={styles.subtitle}>Please login to continue</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.demoButton}
          onPress={fillDemoCredentials}
          disabled={loading}
        >
          <Text style={styles.demoButtonText}>Use Demo Credentials</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  loginButton: {
    backgroundColor: '#2196F3',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  demoButton: {
    marginTop: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  demoButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
