import apiClient from './apiClient';
import { CuocBauCu } from '../store/types';

const API_URL = '/api/CuocBauCu';

export const getCacCuocBauCu = async (): Promise<CuocBauCu[]> => {
  const response = await apiClient.get(`${API_URL}/all`);
  return response.data;
};

export const createCuocBauCu = async (cuocBauCu: CuocBauCu): Promise<CuocBauCu> => {
  const response = await apiClient.post(`${API_URL}/tao`, { ...cuocBauCu, id: 0 });
  return response.data;
};

export const getCuocBauCuById = async (id: number): Promise<CuocBauCu> => {
  const response = await apiClient.get(`${API_URL}/layId/${id}`);
  return response.data;
};

export const updateCuocBauCu = async (cuocBauCu: CuocBauCu): Promise<CuocBauCu> => {
  const response = await apiClient.put(`${API_URL}/update`, cuocBauCu);
  return response.data;
};

export const deleteCuocBauCu = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/delete/${id}`);
};

export const timCuocBauCuTheoTen = async (tenCuocBauCu: string): Promise<CuocBauCu> => {
  const response = await apiClient.get(`${API_URL}/tim/${tenCuocBauCu}`);
  return response.data;
};

export const getCuocBauCuByTaiKhoanId = async (taiKhoanId: number): Promise<CuocBauCu[]> => {
  const response = await apiClient.get(`${API_URL}/taikhoan/${taiKhoanId}`);
  return response.data;
};
