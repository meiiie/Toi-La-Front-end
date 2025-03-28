import apiClient from './apiClient';
import { ChucNang } from '../store/types';

const API_URL = '/api';

export const getCacChucNang = async (): Promise<ChucNang[]> => {
  const response = await apiClient.get(`${API_URL}/chuc-nang`);
  return response.data;
};

export const createChucNang = async (chucNang: Omit<ChucNang, 'id'>): Promise<ChucNang> => {
  const response = await apiClient.post(`${API_URL}/chuc-nang`, chucNang);
  return response.data;
};

export const updateChucNang = async (id: number, chucNang: ChucNang): Promise<ChucNang> => {
  const response = await apiClient.put(`${API_URL}/chuc-nang/${id}`, chucNang);
  return response.data;
};

export const deleteChucNang = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/chuc-nang/${id}`);
};
