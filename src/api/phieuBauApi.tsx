import apiClient from './apiClient';
import { PhieuBau, PhienBauCu } from '../store/types';

const API_URL = '/api/tai-khoan/phieu-bau';

export const getCacPhieuBau = async (): Promise<PhieuBau[]> => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

export const createPhieuBau = async (phieuBau: Omit<PhieuBau, 'id'>): Promise<PhieuBau> => {
  const response = await apiClient.post(API_URL, phieuBau);
  return response.data;
};

export const updatePhieuBau = async (
  id: number,
  phieuBau: Partial<PhieuBau>,
): Promise<PhieuBau> => {
  const response = await apiClient.put(`${API_URL}/${id}`, phieuBau);
  return response.data;
};

export const deletePhieuBau = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};

export const getPhieuBauById = async (cuocBauCuId: number): Promise<PhienBauCu[]> => {
  console.log(cuocBauCuId);
  const response = await apiClient.get(`${API_URL}/byCuocBauCu/${cuocBauCuId}`);
  console.log(response);
  return response.data;
};
