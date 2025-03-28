import apiClient from './apiClient';
import { CauHinhHeThong } from '../store/types';

const API_URL = '/api/cauhinhhethong';

export const getCacCauHinhHeThong = async (): Promise<CauHinhHeThong[]> => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

export const createCauHinhHeThong = async (
  cauHinhHeThong: Omit<CauHinhHeThong, 'id'>,
): Promise<CauHinhHeThong> => {
  const response = await apiClient.post(API_URL, cauHinhHeThong);
  return response.data;
};

export const updateCauHinhHeThong = async (
  id: number,
  cauHinhHeThong: CauHinhHeThong,
): Promise<CauHinhHeThong> => {
  const response = await apiClient.put(`${API_URL}/${id}`, cauHinhHeThong);
  return response.data;
};

export const deleteCauHinhHeThong = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};
