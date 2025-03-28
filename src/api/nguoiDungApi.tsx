import apiClient from './apiClient';
import { TaoTaiKhoanTamThoi, SearchTaiKhoanResponse } from '../store/types';

const API_URL = '/api/tai-khoan';

export const getCacTaiKhoan = async (): Promise<TaoTaiKhoanTamThoi[]> => {
  const response = await apiClient.get(`${API_URL}/cac-tai-khoan`);
  return response.data;
};

export const searchCacTaiKhoan = async (params: {
  id?: number;
  tenDangNhap?: string;
  email?: string;
}): Promise<[SearchTaiKhoanResponse]> => {
  try {
    const response = await apiClient.get(`${API_URL}/search`, { params });
    console.log('Data ne:', response.data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tìm kiếm tài khoản:', error);
    throw error;
  }
};

export const createTaiKhoan = async (
  newTaiKhoan: Omit<TaoTaiKhoanTamThoi, 'id'>,
): Promise<TaoTaiKhoanTamThoi> => {
  const response = await apiClient.post(API_URL, newTaiKhoan);
  return response.data;
};

export const updateTaiKhoan = async (
  taiKhoanId: number,
  taiKhoan: Partial<TaoTaiKhoanTamThoi>,
): Promise<TaoTaiKhoanTamThoi> => {
  console.log('Data ne:', taiKhoan);
  const response = await apiClient.put(`${API_URL}/${taiKhoanId}`, taiKhoan);
  return response.data;
};

export const deleteTaiKhoan = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};
