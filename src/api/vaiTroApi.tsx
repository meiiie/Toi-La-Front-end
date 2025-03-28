import apiClient from './apiClient';
import { VaiTro } from '../store/types';

const API_URL = '/api/vai-tro';

export const getCacVaiTro = async (): Promise<VaiTro[]> => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

export const createVaiTro = async (vaiTro: Omit<VaiTro, 'id'>): Promise<VaiTro> => {
  const response = await apiClient.post(API_URL, vaiTro);
  return response.data;
};

export const updateVaiTro = async (vaiTroId: number, vaiTro: VaiTro): Promise<VaiTro> => {
  const response = await apiClient.put(`${API_URL}/${vaiTroId}`, vaiTro);
  return response.data;
};

export const deleteVaiTro = async (vaiTroId: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/${vaiTroId}`);
};
