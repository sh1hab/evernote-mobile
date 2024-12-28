import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface LoginResponse {
  success: boolean;
  data: {
    message: string;
    user: {
      _id: string;
      id: string;
      name: string;
      email: string;
      updated_at: string;
      created_at: string;
    };
    token: string;
  }
}

export default function Login() {
  const [email, setEmail] = useState('admin@email.com');
  const [password, setPassword] = useState('123456');
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const API_URL = Platform.OS === 'android'
    ? 'https://b967-103-120-32-51.ngrok-free.app/api/v1/auth/login'  // Android emulator
    : Platform.OS === 'ios'
      ? 'http://localhost:8000/api/v1/auth/login'  // iOS simulator
      : 'http://103.120.32.54:8000/api/v1/auth/login'; // Real device


  const login = async (email: string, password: string) => {
    setLoading(true);
    try {

      const response = await axios.post(API_URL, {
        email,
        password
      });

      const data = await response.data;

      if (response.status !== 200) {

        console.log('38');
        console.log(data);

        const errorMessage = (() => {
          switch (response.status) {
            case 400:
              return 'Invalid email or password format';
            case 401:
              return 'Invalid credentials';
            case 404:
              return 'User not found';
            case 429:
              return 'Too many login attempts. Please try again later';
            case 500:
              return 'Server error. Please try again later';
            default:
              return `Login failed (${response.status}): ${data.message || 'Unknown error'}`;
          }
        })();
        throw new Error(errorMessage);
      }

      if (data.data.user) {
        setToken(data.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
        await AsyncStorage.setItem('token', JSON.stringify(data.data.token));

        console.log(data.data.token);

        setUser(data.data.user);
        // Wait for state to update before navigation
        setTimeout(() => {
          router.replace('/(app)/home');
        }, 100);
      }

    } catch (error) {

      if (error instanceof TypeError) {
        console.error('Detailed network error:', {
          message: error.message,
          stack: error.stack,
          platform: Platform.OS,
          apiUrl: API_URL
        });
        throw new Error(`Network error: ${error.message}`);
      }
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#ff4444" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            placeholderTextColor="#666"
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#333',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#99c9ff',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe5e5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff4444',
    marginLeft: 8,
    fontSize: 14,
  },
});