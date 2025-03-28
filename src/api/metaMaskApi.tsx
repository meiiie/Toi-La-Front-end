import apiClient from './apiClient';
import { AxiosError } from 'axios';
import { LoginMetaMaskData } from '../store/types';

export const loginMetaMask = async (data: LoginMetaMaskData) => {
  try {
    const response = await apiClient.post('/api/tai-khoan/login-metamask', data);
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

export const linkMetaMask = async (data: LoginMetaMaskData) => {
  try {
    const response = await apiClient.post('/api/metamask/link', data);
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

export const findAccountByWallet = async (diaChiVi: string) => {
  try {
    const response = await apiClient.get(`/api/metamask/find-by-wallet/${diaChiVi}`);
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
