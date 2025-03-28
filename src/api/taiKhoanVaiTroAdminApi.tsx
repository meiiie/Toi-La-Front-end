import apiClient from './apiClient';
import { TaiKhoanVaiTroAdmin } from '../store/types';

const API_URL = '/api/tai-khoan-vai-tro-admin';

export const fetchTaiKhoanVaiTroAdmin = async (): Promise<TaiKhoanVaiTroAdmin[]> => {
  const response = await apiClient.get<TaiKhoanVaiTroAdmin[]>(`${API_URL}/all`);
  return response.data;
};

export const fetchTaiKhoanVaiTroAdminById = async (id: number): Promise<TaiKhoanVaiTroAdmin> => {
  const response = await apiClient.get<TaiKhoanVaiTroAdmin>(`${API_URL}/lay/${id}`);
  return response.data;
};

export const updateTaiKhoanVaiTroAdminById = async (
  id: number,
  data: TaiKhoanVaiTroAdmin,
): Promise<TaiKhoanVaiTroAdmin> => {
  const response = await apiClient.put<TaiKhoanVaiTroAdmin>(`${API_URL}/update/${id}`, data);
  return response.data;
};

export const createTaiKhoanVaiTroAdmin = async (
  data: TaiKhoanVaiTroAdmin,
): Promise<TaiKhoanVaiTroAdmin> => {
  const response = await apiClient.post<TaiKhoanVaiTroAdmin>(`${API_URL}/create`, data);
  return response.data;
};

export const deleteTaiKhoanVaiTroAdminById = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/delete/${id}`);
};

export const searchTaiKhoanVaiTroAdmin = async (params: {
  tenVaiTro?: string;
  tenDangNhap?: string;
  email?: string;
}): Promise<TaiKhoanVaiTroAdmin[]> => {
  const response = await apiClient.get<TaiKhoanVaiTroAdmin[]>(`${API_URL}/search`, {
    params,
  });
  return response.data;
};
