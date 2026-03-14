import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
    baseURL: API_URL,
});

// Request interceptor to add token to headers
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            // Remove quotes if token is stored as JSON string
            const cleanToken = token.replace(/^"(.*)"$/, '$1');
            config.headers.Authorization = `Bearer ${cleanToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error.response?.status === 401) {
            // Clear stored credentials
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');

            // Redirect to login screen
            router.replace('/(auth)/login');
        }
        return Promise.reject(error);
    }
);

export const contactsApi = {
    getContacts: () => api.get('/contacts'),
    createContact: (data: any) => api.post('/contacts', data),
    updateContact: (id: string, data: any) => api.put(`/contacts/${id}`, data),
    deleteContact: (id: string) => api.delete(`/contacts/${id}`),
};

export default api; 