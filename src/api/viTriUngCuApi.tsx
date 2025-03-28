import apiClient from './apiClient';
import { ViTriUngCu } from '../store/types';

const API_URL = '/api/tai-khoan/roles';

export const getCacViTriUngCu = async (): Promise<ViTriUngCu[]> => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

export const createViTriUngCu = async (viTriUngCu: Omit<ViTriUngCu, 'id'>): Promise<ViTriUngCu> => {
  const response = await apiClient.post(API_URL, viTriUngCu);
  return response.data;
};

export const updateViTriUngCu = async (
  id: number,
  viTriUngCu: Partial<ViTriUngCu>,
): Promise<ViTriUngCu> => {
  const response = await apiClient.put(`${API_URL}/${id}`, viTriUngCu);
  return response.data;
};

export const deleteViTriUngCu = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};
