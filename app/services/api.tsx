import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const token = AsyncStorage.getItem('token');

const api = axios.create({
    baseURL: 'https://b967-103-120-32-51.ngrok-free.app/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
});

export const contactsApi = {
    getContacts: () => api.get('/contacts'),
    createContact: (data: any) => api.post('/contacts', data),
    updateContact: (id: string, data: any) => api.put(`/contacts/${id}`, data),
    deleteContact: (id: string) => api.delete(`/contacts/${id}`),
};

export default api; 