import apiClient from './apiClient';
import { LichSuHoatDong } from '../store/types';

const API_URL = '/api/tai-khoan/lichsuhoatdong';

export const getCacLichSuHoatDong = async (): Promise<LichSuHoatDong[]> => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

export const createLichSuHoatDong = async (
  lichSuHoatDong: Omit<LichSuHoatDong, 'id'>,
): Promise<LichSuHoatDong> => {
  const response = await apiClient.post(API_URL, lichSuHoatDong);
  return response.data;
};

export const updateLichSuHoatDong = async (
  id: number,
  lichSuHoatDong: LichSuHoatDong,
): Promise<LichSuHoatDong> => {
  const response = await apiClient.put(`${API_URL}/${id}`, lichSuHoatDong);
  return response.data;
};

export const deleteLichSuHoatDong = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};
