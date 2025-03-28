import apiClient from './apiClient';
import { TaiKhoanVaiTro } from '../store/types';

const API_URL = '/api/tai-khoan/roles';

export const getCacTaiKhoanVaiTro = async (): Promise<TaiKhoanVaiTro[]> => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

export const createTaiKhoanVaiTro = async (
  taiKhoanVaiTro: Omit<TaiKhoanVaiTro, 'id'>,
): Promise<TaiKhoanVaiTro> => {
  const response = await apiClient.post(API_URL, taiKhoanVaiTro);
  return response.data;
};

export const updateTaiKhoanVaiTro = async (
  id: number,
  taiKhoanVaiTro: Partial<TaiKhoanVaiTro>,
): Promise<TaiKhoanVaiTro> => {
  const response = await apiClient.put(`${API_URL}/${id}`, taiKhoanVaiTro);
  return response.data;
};

export const deleteTaiKhoanVaiTro = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};
