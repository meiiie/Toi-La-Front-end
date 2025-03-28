import apiClient from './apiClient';
import { VaiTroChucNang } from '../store/types';

const API_URL = '/api/vai-tro-chuc-nang';

export const getCacVaiTroChucNang = async (): Promise<VaiTroChucNang[]> => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

export const getCacVaiTroChucNangId = async (id: number): Promise<VaiTroChucNang> => {
  const response = await apiClient.get(`${API_URL}/${id}`);
  return response.data;
};

export const createVaiTroChucNang = async (
  vaiTroChucNang: Omit<VaiTroChucNang, 'id'>,
): Promise<VaiTroChucNang> => {
  const response = await apiClient.post(`${API_URL}/create-vai-tro`, vaiTroChucNang);
  return response.data;
};

export const updateVaiTroChucNang = async (
  vaiTroChucNang: VaiTroChucNang,
): Promise<VaiTroChucNang> => {
  const response = await apiClient.put(`${API_URL}/update-vai-tro`, vaiTroChucNang);
  return response.data;
};

export const deleteVaiTroChucNang = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/delete-vai-tro/${id}`);
};
