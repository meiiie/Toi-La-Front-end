import apiClient from './apiClient';
import { ThongBao } from '../store/types';

const API_URL = '/api/tai-khoan/thongbao';

export const getCacThongBao = async (): Promise<ThongBao[]> => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

export const createThongBao = async (thongBao: Omit<ThongBao, 'id'>): Promise<ThongBao> => {
  const response = await apiClient.post(API_URL, thongBao);
  return response.data;
};

export const updateThongBao = async (id: number, thongBao: ThongBao): Promise<ThongBao> => {
  const response = await apiClient.put(`${API_URL}/${id}`, thongBao);
  return response.data;
};

export const deleteThongBao = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};
