import apiClient from './apiClient';
import { SendOtpResponse, VerifyOtpRequest, VerifyOtpResponse } from '../store/types';

export const sendOtp = async (email: string): Promise<SendOtpResponse> => {
  try {
    const response = await apiClient.post<SendOtpResponse>('/api/Otp/send', email, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to send OTP');
  }
};

export const verifyOtp = async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
  try {
    console.log('data', data);
    const response = await apiClient.post<VerifyOtpResponse>('/api/Otp/verify', data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('response', response);

    return response.data;
  } catch (error) {
    throw new Error('Failed to verify OTP');
  }
};
