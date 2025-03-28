import apiClient from './apiClient';
import { AxiosError } from 'axios';
import { ContactData } from '../store/types';

export const sendContactEmail = async (contactData: ContactData) => {
  try {
    const response = await apiClient.post('/api/Otp/contact', contactData);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response) {
        console.error('Error response:', error.response.data);
        return error.response.data;
      } else if (error.request) {
        console.error('Error request:', error.request);
        return { success: false, message: 'No response from server.' };
      } else {
        console.error('Error message:', error.message);
        return { success: false, message: error.message };
      }
    } else {
      console.error('Unexpected error:', error);
      return { success: false, message: 'An unexpected error occurred.' };
    }
  }
};
