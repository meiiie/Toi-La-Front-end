import apiClient from './apiClient';
import { AxiosError } from 'axios';
import { SubscribeData } from '../store/types';

export const subscribeEmail = async (subscribeData: SubscribeData) => {
  try {
    const response = await apiClient.post('/api/Otp/subscribe', subscribeData);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response) {
        // Request made and server responded
        console.error('Error response:', error.response.data);
        return error.response.data;
      } else if (error.request) {
        // Request made but no response received
        console.error('Error request:', error.request);
        return { success: false, message: 'No response from server.' };
      } else {
        // Something else happened while setting up the request
        console.error('Error message:', error.message);
        return { success: false, message: error.message };
      }
    } else {
      console.error('Unexpected error:', error);
      return { success: false, message: 'An unexpected error occurred.' };
    }
  }
};
